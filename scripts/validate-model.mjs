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
 *
 * Spustenie:  node scripts/validate-model.mjs
 * Návratový kód 1 = nájdené chyby (vhodné do CI).
 */

import { readFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync('data/questionBank.json', 'utf8'));
const mirror = readFileSync('config/model/questionBank.json', 'utf8');
const scoringSrc = readFileSync('data/scoringConfig.ts', 'utf8');

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
