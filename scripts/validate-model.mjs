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
 *  9. benchmarkData: editovateľná kópia sa rozišla so zdrojom
 * 10. benchmarkData: distribúcia nesedí sama so sebou (súčet ≠ 1, medián
 *     nesedí s vlastnou distribúciou, ORS mimo rozsahu)
 * 11. benchmarkData: sektor/veľkosť voliteľná v kvíze nemá referenčný záznam
 *     (inak sa respondentovi ticho zobrazí „benchmark nedostupný")
 * 18. verejný changelog (`app/[locale]/changelog/page.tsx`) zaostal za bankou —
 *     revízia modelu bez záznamu pre firmy, ktoré si chcú overiť, čím sa meria
 * 17. veľkostné kotvy (`size_anchors`): strop odkazuje na možnosť, ktorú
 *     otázka ponúka, klesá s veľkosťou firmy, nesedí na maxime a nesmie byť
 *     na otázke sýtiacej DII (Eurostat premenné sa merajú pre všetkých rovnako)
 *
 * Spustenie:  node scripts/validate-model.mjs
 * Návratový kód 1 = nájdené chyby (vhodné do CI).
 */

import { readFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync('data/questionBank.json', 'utf8'));
const mirror = readFileSync('config/model/questionBank.json', 'utf8');
const scoringSrc = readFileSync('data/scoringConfig.ts', 'utf8');
const diiMap = JSON.parse(readFileSync('data/diiIndicators.json', 'utf8'));
const bench = JSON.parse(readFileSync('data/benchmarkData.json', 'utf8'));
const benchMirror = readFileSync('config/model/benchmarkData.json', 'utf8');
const marketSrc = readFileSync('lib/market.ts', 'utf8');

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
  if (!['single_choice', 'likert_11'].includes(q.question_type) || !q.options) continue;
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
  } else if (scale === 'likert-11') {
    // 11 stupňov s lineárnym bodovaním 0/10/…/100. Rovnaká logika ako
    // linear-N, len s vlastným názvom, aby sa dala fencovať v kontrole #13.
    if (q.options.length !== 11) {
      errors.push(`${q.id}: scale je likert-11, ale otázka má ${q.options.length} možností`);
    } else if (scores.join('/') !== linear(11).join('/')) {
      errors.push(`${q.id}: scale je likert-11, ale bodovanie [${scores.join('/')}] nezodpovedá [${linear(11).join('/')}]`);
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

// --- 9: benchmark zrkadlo ----------------------------------------------------
// Rovnaký princíp ako #7 pre otázkovú banku. Nie je to akademické: kým sa
// hodnoty držali zvlášť v TS a v JSON kópii, kópii chýbal celý blok ČR, hoci
// runtime s ním počítal.
if (JSON.stringify(bench) !== JSON.stringify(JSON.parse(benchMirror))) {
  errors.push('data/benchmarkData.json a config/model/benchmarkData.json sa OBSAHOVO rozchádzajú');
}

// --- 10: invarianty benchmark datasetu ---------------------------------------
for (const [code, c] of Object.entries(bench.countryBenchmarks)) {
  const d = c.diiDistribution;
  const sum = d.very_low + d.low + d.high + d.very_high;
  if (Math.abs(sum - 1) > 0.005) {
    errors.push(`benchmark/${code}: diiDistribution má súčet ${sum.toFixed(4)}, očakávané 1.000 ±0.005`);
  }
  // Medián sa odvádza z distribúcie (BENCHMARK_SPEC §3.3) — táto kontrola chytí
  // klasickú chybu „aktualizoval som distribúciu, medián som zabudol".
  // Vzorec platí, kým medián padá do pásma low; inak sa preskočí.
  if (d.very_low < 0.5 && d.very_low + d.low > 0.5) {
    const derived = 3.5 + ((0.5 - d.very_low) / d.low) * 3;
    if (Math.abs(derived - c.diiMedianScore) > 0.06) {
      errors.push(
        `benchmark/${code}: diiMedianScore ${c.diiMedianScore} nesedí s odvodením z distribúcie (${derived.toFixed(2)}) — BENCHMARK_SPEC §3.3`
      );
    }
  }
  if (c.orsEstimatedMedian < 0 || c.orsEstimatedMedian > 100) {
    errors.push(`benchmark/${code}: orsEstimatedMedian ${c.orsEstimatedMedian} je mimo rozsahu 0–100`);
  }
}

// Každý trh z lib/market.ts musí mať referenčné dáta, inak daná jazyková
// mutácia ticho zobrazí „Nedostupné".
const markets = [...marketSrc.matchAll(/'(SK|CZ|EU27)'/g)].map((m) => m[1]);
for (const m of new Set(markets)) {
  if (!bench.countryBenchmarks[m]) {
    errors.push(`benchmark: trh ${m} z lib/market.ts nemá countryBenchmarks záznam`);
  }
}

// --- 11: referenčná integrita voči banke -------------------------------------
// Bez tejto kontroly sa pridanie sektora/veľkosti do kvízu prejaví až tak, že
// respondent uvidí „benchmark nedostupný" — ticho a bez chyby v builde.
const optionValues = (tag) =>
  new Set(
    all
      .filter((q) => (q.maps_to_score ?? []).includes(tag))
      .flatMap((q) => (q.options ?? []).map((o) => o.value ?? o.id))
  );

for (const v of optionValues('benchmark_sector')) {
  if (!bench.sectorBenchmarks[v]) {
    errors.push(`benchmark: sektor "${v}" je voliteľný v kvíze, ale nemá sectorBenchmarks záznam`);
  }
}
for (const v of optionValues('benchmark_size')) {
  if (!bench.sizeBenchmarks[v]) {
    errors.push(`benchmark: veľkosť "${v}" je voliteľná v kvíze, ale nemá sizeBenchmarks záznam`);
  }
}

// --- 12: branching podmienky sú pre parser zrozumiteľné ----------------------
// engines/questionEngine.ts pri nerozpoznanej syntaxi ticho vráti false, takže
// preklep v podmienke sa neprejaví chybou — len pravidlo mlčky nikdy nezaberie.
// Tieto vzory musia zostať v zhode s `evaluateCondition`.
const CONDITION_PATTERNS = [
  /^value\s*==\s*'[^']+'$/,
  /^value\s*!=\s*'[^']+'$/,
  /^value\s*==\s*'[^']+'(\s*\|\|\s*value\s*==\s*'[^']+')+$/,
  /^selected_count\s*(<=|>=|<|>|==)\s*\d+$/,
  /^selected\.includes\('[^']+'\)$/,
  /^!selected\.includes\('[^']+'\)$/,
];

/** Hodnoty, ktoré podmienka porovnáva — na overenie, že v otázke existujú. */
const valuesInCondition = (c) => [...c.matchAll(/'([^']+)'/g)].map((m) => m[1]);

for (const q of all) {
  for (const rule of q.branching_rules ?? []) {
    const cond = rule.condition;
    if (typeof cond !== 'string' || cond.trim() === '') {
      errors.push(`${q.id}: branching pravidlo bez podmienky`);
      continue;
    }
    if (!CONDITION_PATTERNS.some((re) => re.test(cond.trim()))) {
      errors.push(`${q.id}: podmienku "${cond}" parser nepozná — pravidlo sa nikdy nespustí`);
      continue;
    }
    // Podmienka nad multi_select otázkou musí používať selected*, nad
    // single_choice zasa value — inak sa vyhodnotí vždy ako false.
    const usesSelected = cond.includes('selected');
    if (q.question_type === 'multi_select' && !usesSelected) {
      errors.push(`${q.id}: multi_select otázka má podmienku "${cond}" nad \`value\` — pre pole sa nikdy nesplní`);
    }
    if (q.question_type === 'single_choice' && usesSelected) {
      errors.push(`${q.id}: single_choice otázka má podmienku "${cond}" nad \`selected\` — pre reťazec sa nikdy nesplní`);
    }
    // Porovnávaná hodnota musí byť medzi možnosťami otázky.
    if (/value|selected\.includes/.test(cond)) {
      const opts = new Set((q.options ?? []).map((o) => o.value ?? o.id));
      for (const v of valuesInCondition(cond)) {
        if (!opts.has(v)) {
          errors.push(`${q.id}: podmienka odkazuje na hodnotu "${v}", ktorú otázka neponúka`);
        }
      }
    }
    if (rule.on_unknown !== undefined && !['ignore', 'apply'].includes(rule.on_unknown)) {
      errors.push(`${q.id}: on_unknown musí byť 'ignore' alebo 'apply', nie "${rule.on_unknown}"`);
    }
  }
}

// --- 13: fence na škálu 0–10 ------------------------------------------------
// Typ `likert_11` je vyhradený pre subjektívny úsudok o budúcnosti (zámer,
// ochota, pravdepodobnosť). Zvyšok banky stojí na behaviorálne ukotvených
// možnostiach — tie dajú dvom firmám s rovnakou praxou rovnakú odpoveď, holé
// číslo taký referenčný bod nemá. Bez tejto kontroly by sa z typu časom stal
// lenivý default a banka by sa zosunula z doloženej evidencie na pocit.
for (const q of all) {
  const isLikert = q.question_type === 'likert_11';
  if (isLikert !== (q.scale === 'likert-11')) {
    errors.push(`${q.id}: question_type "${q.question_type}" a scale "${q.scale}" si odporujú — likert_11 a likert-11 idú vždy spolu`);
  }
  if (!isLikert) continue;

  if (!q.anchor_low_sk || !q.anchor_high_sk) {
    errors.push(`${q.id}: škála 0–10 musí mať obe kotvy (anchor_low_sk, anchor_high_sk) — bez nich je to číselník bez významu`);
  }
  if (q.evidence_type !== 'self_assessment') {
    errors.push(`${q.id}: škála 0–10 meria subjektívny úsudok, takže evidence_type musí byť 'self_assessment', nie '${q.evidence_type}'`);
  }
  if ((q.maps_to_score ?? []).includes('dii')) {
    errors.push(`${q.id}: škála 0–10 nesmie sýtiť DII — premenné Eurostatu sú binárne fakty, sebahodnotenie na ne odpovedať nevie`);
  }
  // Do ORS smie prispieť len vedome: skóre z nej je názor, nie zistený stav.
  const orsTags = (q.maps_to_score ?? []).filter((t) => t.startsWith('ors_'));
  if (orsTags.length > 0 && !q.likert_ors_rationale) {
    errors.push(`${q.id}: škála 0–10 sýti ${orsTags.join(', ')} — doplň "likert_ors_rationale" so zdôvodnením, prečo je názor prípustný vstup do skóre zrelosti`);
  }
}

// --- 14: zrkadlo scoring configu -------------------------------------------
// `config/model/scoringConfig.json` je GENEROVANÝ pohľad na
// `data/scoringConfig.ts`. Dovtedy sa udržiaval ručne a rozišiel sa: chýbalo
// v ňom 20 exportov a štyri kľúče mali iné názvy než v kóde. Nikto to
// nekontroloval, hoci README ho označoval ako editovateľný — kto tam zmenil
// prah, nezmenil nič. Rovnaká ochrana ako pri benchmarkData (#9).
try {
  const { loadScoringConfig, toMirror, MIRROR_PATH } = await import('./model-config.mjs');
  // Porovnáva sa OBSAH, nie bajty: git na Windows prepisuje konce riadkov,
  // takže textové porovnanie by hlásilo rozdiel aj pri zhodnom súbore
  // (rovnaký prístup ako pri zrkadle benchmarkData v kontrole #9).
  const expected = toMirror(await loadScoringConfig());
  const actual = JSON.parse(readFileSync(MIRROR_PATH, 'utf8'));
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    errors.push(
      'config/model/scoringConfig.json sa rozchádza s data/scoringConfig.ts — spusti `npm run config:sync`'
    );
  }
} catch (e) {
  errors.push('kontrola zrkadla scoringConfigu zlyhala: ' + e.message);
}

// --- 15: kópie špecifikácií v config/model ---------------------------------
// `config/model/` je balík pre editorov modelu — ľudí, ktorí do TypeScriptu
// nevidia. Kópie sa udržiavali ručne a rozišli sa: SCORING_SPEC o 355 riadkov,
// a opisovala MODEL SPRED 4. 8. 2026 (plochý priemer DII, pureBinary, nemerané
// fabrikované na nulu) — teda správanie, ktoré scoring v1.5 odstránil. Presne
// tí ľudia, pre ktorých ten priečinok je, čítali opis modelu, čo už neexistuje.
try {
  const docs = await import('./sync-model-docs.mjs');
  for (const name of docs.MIRRORED_DOCS) {
    if (docs.expectedCopy(name) !== docs.actualCopy(name)) {
      errors.push(
        'config/model/' + name + ' sa rozchádza s koreňovou verziou — spusti `npm run docs:sync`'
      );
    }
  }
} catch (e) {
  errors.push('kontrola kópií špecifikácií zlyhala: ' + e.message);
}

// --- 16: pečiatky verzií v špecifikáciách ----------------------------------
// Každý spec mal vlastné dekoratívne číslo verzie (1.1-MVP, 2.0, 2.1…), ktoré
// nikto spoľahlivo nezvyšoval — všetky boli z júla, hoci sa dokumenty odvtedy
// viackrát prepísali. Číslo, ktoré vyzerá autoritatívne a drží ho ruka, je
// horšie než žiadne: čitateľ mu verí. Nahradila ho pečiatka „Platí pre",
// ktorá uvádza verzie ZDROJOV — a tie sa dajú overiť. Revízia modelu bez
// prečítania dokumentácie tak zhodí build.
const SPEC_SOURCES = {
  bank: bank.version,
  scoring: (scoringSrc.match(/version: '([^']+)'/) || [])[1],
  bench: bench.version,
};
const SPEC_LABELS = {
  bank: 'otázková banka',
  scoring: 'scoring config',
  bench: 'benchmark dáta',
};
const SPEC_FILES = {
  'METHODOLOGY.md': ['bank', 'scoring', 'bench'],
  'SCORING_SPEC.md': ['bank', 'scoring'],
  'BENCHMARK_SPEC.md': ['bench', 'scoring'],
  'ROI_MODEL.md': ['bank', 'scoring'],
  'RECOMMENDATION_RULES.md': ['bank', 'scoring'],
  'ARCHITECTURE.md': ['bank', 'scoring', 'bench'],
  'MODEL_VERSIONS.md': ['bank', 'scoring', 'bench'],
};
for (const [file, sources] of Object.entries(SPEC_FILES)) {
  let head;
  try { head = readFileSync(file, 'utf8').split(String.fromCharCode(10)).slice(0, 12).join(' '); }
  catch { errors.push(file + ": súbor chýba, hoci má niesť pečiatku verzie"); continue; }

  if (!head.includes('**Platí pre:**')) {
    errors.push(file + ': chýba pečiatka "Platí pre" — dokument musí uvádzať verzie zdrojov, ktoré opisuje');
    continue;
  }
  for (const s of sources) {
    const want = SPEC_LABELS[s] + ' `' + SPEC_SOURCES[s] + '`';
    if (!head.includes(want)) {
      errors.push(
        file + ': pečiatka neuvádza ' + want + ' — model sa posunul, dokument nie. Skontroluj obsah a uprav pečiatku.'
      );
    }
  }
}

// --- 17: fence na veľkostné kotvy -------------------------------------------
// `size_anchors` prepisuje skóre otázky podľa počtu zamestnancov. Je to jediné
// miesto v modeli, kde odpoveď na jednu otázku mení hodnotu inej — teda presne
// ten druh mechaniky, ktorý sa pri chybe neprejaví pádom, ale tichým posunom
// skóre celej triedy firiem. Preto rovnaké oplotenie ako pri škále 0–10 (#13).
const SIZE_BANDS = ['micro', 'small', 'medium', 'large'];
const diiCriterionIds = new Set(
  diiMap.indicators.flatMap((ind) => (ind.criteria ?? []).map((c) => c.questionId))
);

for (const q of all) {
  const anchors = q.size_anchors;
  if (anchors === undefined) continue;

  if (typeof anchors !== 'object' || anchors === null || Array.isArray(anchors)) {
    errors.push(`${q.id}: size_anchors musí byť objekt`);
    continue;
  }
  if (!anchors.rationale_sk) {
    errors.push(`${q.id}: size_anchors bez "rationale_sk" — strop, ktorý nikto nezdôvodnil, je len tichá úprava skóre`);
  }
  // Strop je najvyššia možnosť REBRÍČKA. Pri multi_select žiadny rebríček nie
  // je (skóre vzniká súčtom zaškrtnutých položiek), takže by pojem nedával
  // zmysel a prepočet by ho zdeformoval nepredvídateľne.
  if (q.question_type !== 'single_choice') {
    errors.push(`${q.id}: size_anchors je len pre single_choice, nie pre "${q.question_type}"`);
  }
  // Otázka sýtiaca DII sa upravovať NESMIE: premenné Eurostatu sú binárne
  // fakty a porovnateľnosť s meranou distribúciou stojí na tom, že sa merajú
  // rovnako pre každého. Testuje sa účasť v diiIndicators.json, nie tag
  // 'dii' v maps_to_score — cx_DII04 tag má, ale je z v3 sady explicitne
  // vylúčená, takže do DII nevstupuje. Rozhoduje kontrakt, nie štítok.
  if (diiCriterionIds.has(q.id)) {
    errors.push(`${q.id}: size_anchors na otázke, ktorá je kritériom DII indikátora — prepočet by rozbil porovnateľnosť s meranou distribúciou Eurostatu`);
  }

  const ceilings = anchors.ceilings;
  if (typeof ceilings !== 'object' || ceilings === null || Object.keys(ceilings).length === 0) {
    errors.push(`${q.id}: size_anchors.ceilings je prázdne — pole bez stropu nerobí nič`);
    continue;
  }

  const byValue = new Map((q.options ?? []).map((o) => [o.value, o.score]));
  const max = Math.max(...(q.options ?? []).map((o) => o.score));
  const scoreOf = {};

  for (const [band, value] of Object.entries(ceilings)) {
    if (!SIZE_BANDS.includes(band)) {
      errors.push(`${q.id}: size_anchors pozná pásma ${SIZE_BANDS.join('/')}, nie "${band}"`);
      continue;
    }
    if (!byValue.has(value)) {
      errors.push(`${q.id}: strop pásma ${band} odkazuje na možnosť "${value}", ktorú otázka neponúka`);
      continue;
    }
    const s = byValue.get(value);
    if (s <= 0) {
      errors.push(`${q.id}: strop pásma ${band} ("${value}") má skóre ${s} — nulový strop by celé pásmo vynásobil nekonečnom`);
    }
    if (s >= max) {
      errors.push(`${q.id}: strop pásma ${band} ("${value}") je ${s}, teda maximum otázky (${max}) — kotva by nerobila nič, radšej ju zmaž`);
    }
    scoreOf[band] = s;
  }

  // Väčšia firma nesmie mať nižší strop než menšia — inak by úprava trestala
  // rast. Pásmo bez záznamu znamená plný rebríček, teda `max`.
  let prev = 0;
  for (const band of SIZE_BANDS) {
    const s = scoreOf[band] ?? max;
    if (s < prev) {
      errors.push(`${q.id}: strop pásma ${band} (${s}) je nižší než v menšom pásme (${prev}) — kotvy musia rásť s veľkosťou firmy`);
    }
    prev = s;
  }
}

// Pásma v kotvách musia sedieť s hodnotami, ktoré kvíz reálne ponúka —
// inak by sa strop vyhlásil pre pásmo, do ktorého sa respondent nedostane.
const sizeOptionValues = new Set(optionValues('benchmark_size'));
for (const q of all) {
  for (const band of Object.keys(q.size_anchors?.ceilings ?? {})) {
    if (SIZE_BANDS.includes(band) && !sizeOptionValues.has(band)) {
      errors.push(`${q.id}: kotva pre pásmo "${band}", ktoré otázka na veľkosť firmy neponúka`);
    }
  }
}

// --- 18: verejný changelog nesmie zaostať za modelom ------------------------
// Stránka /changelog má vlastný kuratovaný zoznam vydaní — zámerne NIE je
// generovaná z CHANGELOG.md, lebo hovorí inému publiku (firmám o meraní, nie
// vývojárovi o kóde). Cena za to je drift a ten sa aj stal: dva dni ukazovala
// 5. augusta, hoci sa medzitým zmenila banka, výpočet DII aj skórovanie.
// Firma, ktorá si chce overiť, čím sa meria, tam videla neaktuálny stav.
//
// Kontroluje sa DÁTUM, nie obsah: čo presne sa do verejného changelogu napíše,
// je redakčné rozhodnutie, ale revízia modelu bez akéhokoľvek záznamu preň je
// chyba. Rovnaký princíp ako pri pečiatkach špecifikácií (#16).
{
  const page = 'app/[locale]/changelog/page.tsx';
  let src;
  try { src = readFileSync(page, 'utf8'); }
  catch { errors.push(page + ': súbor chýba, hoci nesie verejnú históriu zmien'); src = null; }

  if (src) {
    const dates = [...src.matchAll(/^\s*date: '(\d{4}-\d{2}-\d{2})',$/gm)].map((m) => m[1]);
    if (dates.length === 0) {
      errors.push(page + ': nenašiel som ani jedno vydanie s dátumom — zmenil sa tvar poľa changelog?');
    } else {
      const newest = dates.slice().sort().at(-1);
      if (newest < bank.last_updated) {
        errors.push(
          `${page}: najnovšie vydanie je z ${newest}, ale otázková banka sa menila ${bank.last_updated} ` +
          '— doplň záznam, inak verejná história tvrdí neaktuálny stav modelu'
        );
      }
      // OG modifiedTime je signál čerstvosti pre vyhľadávače; keď zaostane za
      // obsahom stránky, hlási starší dátum, než aký na stránke naozaj je.
      const og = (src.match(/modifiedTime: '(\d{4}-\d{2}-\d{2})/) || [])[1];
      if (og && og < newest) {
        errors.push(`${page}: modifiedTime je ${og}, ale najnovšie vydanie je z ${newest}`);
      }
    }
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
