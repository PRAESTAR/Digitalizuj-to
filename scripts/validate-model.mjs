#!/usr/bin/env node
/**
 * Validátor Adaptívneho modelu DAP.
 *
 * Toto je lacná náhrada za referenčnú integritu, kvôli ktorej by inak
 * bolo treba databázu. Kontroluje presne tie triedy chýb, ktoré sa
 * v tomto projekte reálne stali a ktoré JSON sám o sebe nezachytí:
 *
 *  1. branching pravidlo mieri na neexistujúcu otázku (chýbajúci FK)
 *  2. branching cieľ je v poradí PRED zdrojovou otázkou (nikdy sa nespustí)
 *  3. rizikový faktor nemá žiadnu otázku, ktorá by ho spustila (osirotený RF)
 *  4. otázka odkazuje na neexistujúci rizikový faktor
 *  5. bodovanie nesedí s deklarovanou škálou (`scale`)
 *  6. neštandardná škála bez `scale_rationale` (nedokumentovaná odchýlka)
 *  7. data/questionBank.json a config/model/questionBank.json sa rozišli
 *  8. DII mapovanie (data/diiIndicators.json) nesedí s bankou — striktný v3
 *     režim: každá 'dii' otázka musí byť namapovaná na indikátor ALEBO
 *     explicitne vylúčená s dôvodom; kritériá musia byť vyhodnotiteľné
 *
 * Spustenie:  node scripts/validate-model.mjs
 * Návratový kód 1 = nájdené chyby (vhodné do CI).
 */

import { readFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync('data/questionBank.json', 'utf8'));
const mirror = readFileSync('config/model/questionBank.json', 'utf8');
const scoringSrc = readFileSync('data/scoringConfig.ts', 'utf8');
const diiMap = JSON.parse(readFileSync('data/diiIndicators.json', 'utf8'));

const errors = [];
const warn = [];

// --- zoznam otázok v poradí, v akom ich engine prechádza -------------------
const indicative = bank.indicative_quiz.questions.map((q, i) => ({ ...q, quiz: 'indicative', pos: i }));
const complex = bank.complex_quiz.modules
  .flatMap((m) => m.questions)
  .map((q, i) => ({ ...q, quiz: 'complex', pos: i }));
const all = [...indicative, ...complex];

const posIn = (quiz) => {
  const list = quiz === 'indicative' ? indicative : complex;
  return new Map(list.map((q) => [q.id, q.pos]));
};

// --- 1 + 2: branching ciele -------------------------------------------------
for (const q of all) {
  const map = posIn(q.quiz);
  for (const rule of q.branching_rules ?? []) {
    if (rule.action === 'flag_risk') continue;
    const targets = Array.isArray(rule.target) ? rule.target : [rule.target];
    for (const t of targets) {
      if (!map.has(t)) {
        errors.push(`${q.id}: branching cieľ "${t}" v kvíze ${q.quiz} neexistuje`);
      } else if (map.get(t) <= q.pos) {
        errors.push(`${q.id}: branching cieľ "${t}" je v poradí PRED zdrojom — pravidlo sa nikdy nespustí`);
      }
    }
  }
}

// --- 3 + 4: rizikové faktory ------------------------------------------------
const definedRF = [...scoringSrc.matchAll(/id:\s*'(RF\d+)'/g)].map((m) => m[1]);
const triggered = new Set();
const referenced = new Set();
for (const q of all) {
  for (const rf of q.maps_to_risk ?? []) referenced.add(rf);
  for (const rule of q.branching_rules ?? []) {
    if (rule.action !== 'flag_risk') continue;
    for (const t of Array.isArray(rule.target) ? rule.target : [rule.target]) triggered.add(t);
  }
}
for (const rf of definedRF) {
  if (!triggered.has(rf)) errors.push(`${rf}: definovaný v scoringConfig, ale žiadna otázka ho nespúšťa (mŕtvy faktor)`);
}
for (const rf of [...referenced, ...triggered]) {
  if (!definedRF.includes(rf)) errors.push(`${rf}: otázka naň odkazuje, ale v scoringConfig nie je definovaný`);
}

// --- 5 + 6: škály -----------------------------------------------------------
const linear = (n) => Array.from({ length: n }, (_, i) => Math.round((i * 100) / (n - 1)));
for (const q of all) {
  if (q.question_type !== 'single_choice' || !q.options) continue;
  const scores = q.options.map((o) => o.score);
  const scale = q.scale;

  if (!scale) {
    errors.push(`${q.id}: chýba pole "scale" — každá single-choice otázka musí deklarovať škálu`);
    continue;
  }
  if (scale.startsWith('linear-')) {
    const n = Number(scale.slice(7));
    if (n !== q.options.length) {
      errors.push(`${q.id}: scale je ${scale}, ale otázka má ${q.options.length} možností`);
    } else if (scores.join('/') !== linear(n).join('/')) {
      errors.push(`${q.id}: scale je ${scale}, ale bodovanie [${scores.join('/')}] nezodpovedá [${linear(n).join('/')}]`);
    }
  } else if (['categorical', 'descending', 'custom'].includes(scale)) {
    if (!q.scale_rationale) {
      errors.push(`${q.id}: škála "${scale}" je odchýlka od štandardu a musí mať "scale_rationale"`);
    }
  } else if (scale !== 'meta') {
    errors.push(`${q.id}: neznáma hodnota scale "${scale}"`);
  }
}

// --- 7: zrkadlo -------------------------------------------------------------
if (JSON.stringify(bank) !== JSON.stringify(JSON.parse(mirror))) {
  errors.push('data/questionBank.json a config/model/questionBank.json sa OBSAHOVO rozchádzajú');
}

// --- 8: DII mapovanie (striktný v3) ------------------------------------------
const byId = new Map(all.map((q) => [q.id, q]));
const mappedIds = new Set(diiMap.indicators.flatMap((ind) => ind.criteria.map((c) => c.questionId)));
const excludedIds = new Set(diiMap.excludedDiiQuestions.map((e) => e.questionId));

if (diiMap.indicators.length !== 12) {
  errors.push(`diiIndicators: očakávaných 12 indikátorov, nájdených ${diiMap.indicators.length}`);
}
for (let i = 0; i < diiMap.indicators.length; i++) {
  const ind = diiMap.indicators[i];
  if (ind.code !== `DII${i + 1}`) {
    errors.push(`diiIndicators[${i}]: kód "${ind.code}" nesedí s poradím (očakávané DII${i + 1})`);
  }
  if (ind.criteria.length === 0 && !ind.uncoveredReason) {
    errors.push(`${ind.code}: nepokrytý indikátor musí mať "uncoveredReason"`);
  }
  for (const c of ind.criteria) {
    const q = byId.get(c.questionId);
    if (!q) { errors.push(`${ind.code}: kritériová otázka "${c.questionId}" v banke neexistuje`); continue; }
    if (!(q.maps_to_score ?? []).includes('dii')) {
      errors.push(`${ind.code}: otázka ${c.questionId} nemá 'dii' tag, ale je kritériom indikátora`);
    }
    if (!c.rationale) {
      errors.push(`${ind.code}/${c.questionId}: kritérium bez "rationale" — prah musí byť odôvodnený`);
    }
    const scores = (q.options ?? []).map((o) => o.score);
    const values = (q.options ?? []).map((o) => o.value ?? o.id);
    if (c.metWhen && typeof c.metWhen.minScore === 'number') {
      if (!scores.some((s) => s >= c.metWhen.minScore)) {
        errors.push(`${ind.code}/${c.questionId}: minScore ${c.metWhen.minScore} nedosahuje žiadna možnosť — kritérium nesplniteľné`);
      }
      if (!scores.some((s) => s < c.metWhen.minScore)) {
        errors.push(`${ind.code}/${c.questionId}: minScore ${c.metWhen.minScore} spĺňa každá možnosť — kritérium degenerované (vždy splnené)`);
      }
    } else if (c.metWhen && Array.isArray(c.metWhen.anyOfValues)) {
      for (const v of c.metWhen.anyOfValues) {
        if (!values.includes(v)) {
          errors.push(`${ind.code}/${c.questionId}: hodnota "${v}" v anyOfValues neexistuje medzi možnosťami otázky`);
        }
      }
    } else {
      errors.push(`${ind.code}/${c.questionId}: metWhen musí byť {minScore} alebo {anyOfValues}`);
    }
  }
}
for (const e of diiMap.excludedDiiQuestions) {
  const q = byId.get(e.questionId);
  if (!q) errors.push(`diiIndicators/excluded: otázka "${e.questionId}" v banke neexistuje`);
  else if (!(q.maps_to_score ?? []).includes('dii')) {
    errors.push(`diiIndicators/excluded: ${e.questionId} nemá 'dii' tag — vylúčenie je bezpredmetné`);
  }
  if (!e.reason) errors.push(`diiIndicators/excluded: ${e.questionId} bez dôvodu vylúčenia`);
  if (mappedIds.has(e.questionId)) {
    errors.push(`diiIndicators: ${e.questionId} je súčasne vylúčená AJ kritériom indikátora`);
  }
}
// Úplnosť striktného v3 režimu: každá 'dii' otázka je namapovaná alebo vylúčená.
// Deduplikované cez Set — otázky zdieľané oboma kvízmi (v `all` dvakrát) by
// inak vyrobili duplicitné chyby.
for (const id of new Set(all.filter((q) => (q.maps_to_score ?? []).includes('dii')).map((q) => q.id))) {
  if (!mappedIds.has(id) && !excludedIds.has(id)) {
    errors.push(`${id}: má 'dii' tag, ale nie je ani kritériom indikátora, ani vo vylúčenom zozname (striktný v3 vyžaduje explicitné rozhodnutie)`);
  }
}

// --- výstup -----------------------------------------------------------------
const scaleCounts = {};
for (const q of all) if (q.scale) scaleCounts[q.scale] = (scaleCounts[q.scale] ?? 0) + 1;

console.log(`Otázok: ${all.length}  ·  rizikových faktorov: ${definedRF.length}`);
console.log('Škály: ' + Object.entries(scaleCounts).map(([k, v]) => `${k}=${v}`).join('  '));
for (const w of warn) console.log('UPOZORNENIE  ' + w);
if (errors.length) {
  console.error(`\n${errors.length} CHÝB:`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log('\nModel je konzistentný — žiadne chyby.');
