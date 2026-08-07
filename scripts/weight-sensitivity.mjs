/**
 * Sensitivity analýza váh ODRM kategórií.
 *
 * Váhy A–F (20/20/15/15/20/10 %) sú expertne stanovené — nevznikli z dát,
 * lebo žiadne nie sú. Otázka, ktorú si každý recenzent metodiky položí, znie:
 * **ako veľmi na nich záleží?** Ak posun o ±5 percentuálnych bodov výsledok
 * takmer nemení, expertné nastavenie je prijateľné riziko. Ak ho mení
 * podstatne, váhy sú skrytý parameter, ktorý rozhoduje viac než odpovede.
 *
 * Skript to zmeria: každú váhu postupne posunie o ±5 p. b., zvyšné
 * renormalizuje, prepočíta ORS nad deterministickou vzorkou odpovedí
 * a vypíše, o koľko sa pohol bod aj nálepka zrelosti.
 *
 * Spustenie:  node scripts/weight-sensitivity.mjs
 * Výstup ide do ARCHITECTURE/METHODOLOGY ako doložené číslo, nie odhad.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const ts = require('typescript');

/** Načíta TS modul cez transpiler — rovnaký postup ako scripts/model-config.mjs. */
async function loadTs(rel) {
  const src = readFileSync(path.join(ROOT, rel), 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  // Relatívne importy v scoringConfig sú len typové, takže po transpilácii zmiznú.
  const url = 'data:text/javascript;base64,' + Buffer.from(outputText, 'utf8').toString('base64');
  return import(url);
}

const { scoringConfig } = await loadTs('data/scoringConfig.ts');
const bank = JSON.parse(readFileSync(path.join(ROOT, 'data/questionBank.json'), 'utf8'));

const CATS = ['A', 'B', 'C', 'D', 'E', 'F'];
const BASE = scoringConfig.categoryWeights;
const DELTA = 0.05; // ±5 percentuálnych bodov

const questions = bank.complex_quiz.modules.flatMap((m) => m.questions);

/** Deterministická vzorka odpovedí — bez Math.random, aby bol beh opakovateľný. */
function answersForSeed(seed) {
  let s = seed;
  const out = new Map();
  for (const q of questions) {
    const opts = q.options ?? [];
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    if (q.question_type === 'multi_select') {
      const picked = opts.filter((_, i) => ((s >> i) & 1) === 1);
      const score = q.scoring_mode === 'inverted'
        ? Math.max(0, 100 + picked.reduce((a, o) => a + o.score, 0))
        : Math.min(100, Math.round(picked.reduce((a, o) => a + o.score, 0) / (q.max_score || 100) * 100));
      out.set(q.id, score);
    } else {
      out.set(q.id, opts[s % Math.max(1, opts.length)]?.score ?? 0);
    }
  }
  return out;
}

/** ORS pri daných váhach — tá istá aritmetika ako scoringEngine, plná presnosť. */
function ors(scores, weights) {
  let weighted = 0, weightSum = 0;
  let eScore = null;
  for (const c of CATS) {
    const items = questions
      .filter((q) => (q.maps_to_score ?? []).includes('ors_' + c))
      .map((q) => ({ score: scores.get(q.id) ?? 0, weight: q.weight }));
    const w = items.reduce((a, i) => a + i.weight, 0);
    if (w <= 0) continue;
    const catScore = items.reduce((a, i) => a + i.score * i.weight, 0) / w;
    if (c === 'E') eScore = catScore;
    weighted += catScore * weights[c];
    weightSum += weights[c];
  }
  if (weightSum === 0) return { score: null, level: null };
  let score = weighted / weightSum;
  if (eScore !== null && eScore < scoringConfig.securityPenaltyThreshold) {
    const f = 1 - scoringConfig.securityPenaltyMaxFactor +
      scoringConfig.securityPenaltyMaxFactor * (eScore / scoringConfig.securityPenaltyThreshold);
    score *= f;
  }
  let level = 0;
  for (let i = 0; i < scoringConfig.maturityThresholds.length; i++) {
    if (score > scoringConfig.maturityThresholds[i]) level = i + 1;
  }
  return { score, level };
}

/** Posun jednej váhy o delta; zvyšok sa renormalizuje, aby súčet ostal 1. */
function perturb(cat, delta) {
  const out = { ...BASE };
  const target = Math.max(0.01, Math.min(0.99, BASE[cat] + delta));
  const actualDelta = target - BASE[cat];
  out[cat] = target;
  const others = CATS.filter((c) => c !== cat);
  const otherSum = others.reduce((a, c) => a + BASE[c], 0);
  for (const c of others) out[c] = BASE[c] - actualDelta * (BASE[c] / otherSum);
  return out;
}

const SWEEP = 2000;
const results = [];

for (const cat of CATS) {
  for (const delta of [-DELTA, DELTA]) {
    const weights = perturb(cat, delta);
    let maxAbs = 0, sumAbs = 0, flips = 0, n = 0;
    for (let seed = 0; seed < SWEEP; seed++) {
      const scores = answersForSeed(seed);
      const base = ors(scores, BASE);
      const alt = ors(scores, weights);
      if (base.score === null || alt.score === null) continue;
      n++;
      const d = Math.abs(alt.score - base.score);
      maxAbs = Math.max(maxAbs, d);
      sumAbs += d;
      if (alt.level !== base.level) flips++;
    }
    results.push({
      cat,
      delta: delta > 0 ? '+5 p. b.' : '−5 p. b.',
      avgShift: sumAbs / n,
      maxShift: maxAbs,
      levelFlipPct: (flips / n) * 100,
      n,
    });
  }
}

console.log(`Sensitivity váh ODRM — ${SWEEP} kombinácií odpovedí, komplexný kvíz\n`);
console.log('Váha       Posun      Priem. zmena ORS   Max. zmena   Preklopený level');
console.log('─'.repeat(76));
for (const r of results) {
  console.log(
    `${r.cat} (${Math.round(BASE[r.cat] * 100)} %)`.padEnd(11) +
    r.delta.padEnd(11) +
    `${r.avgShift.toFixed(2)} b`.padStart(15) +
    `${r.maxShift.toFixed(2)} b`.padStart(13) +
    `${r.levelFlipPct.toFixed(2)} %`.padStart(18)
  );
}

const worst = results.reduce((a, b) => (b.levelFlipPct > a.levelFlipPct ? b : a));
const maxAvg = Math.max(...results.map((r) => r.avgShift));
const maxMax = Math.max(...results.map((r) => r.maxShift));
console.log('─'.repeat(76));
console.log(`Najcitlivejšia: kategória ${worst.cat} pri ${worst.delta} — level sa preklopí v ${worst.levelFlipPct.toFixed(2)} % prípadov`);
console.log(`Najväčšia priemerná zmena ORS: ${maxAvg.toFixed(2)} b · najväčšia jednotlivá: ${maxMax.toFixed(2)} b`);
