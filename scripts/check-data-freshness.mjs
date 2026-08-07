/**
 * Kontrola aktuálnosti externých dát a pripomienka ročných úloh.
 *
 * Model stojí na dvoch externých kotvách, ktoré sa obnovujú raz ročne a na
 * ktoré sa v decembri/marci ľahko zabudne:
 *
 *  - **Eurostat `isoc_e_dii`** (DII distribúcie) — publikácia december
 *  - **Eurostat `lc_lci_lev` / ŠÚ SR** (hodinová cena práce) — publikácia marec
 *
 * Bez pripomienky sa na to príde až vtedy, keď niekto porovná referenčné
 * hodnoty s realitou. Skript porovná dátumy v dátach s dnešným dňom a povie,
 * čo je po termíne — a čo presne treba prepísať, aby to nebola archeológia.
 *
 * ZÁMERNE NESŤAHUJE DÁTA. Automatický import z Eurostatu by znamenal, že sa
 * referenčné čísla môžu zmeniť bez toho, aby to niekto videl v diffe —
 * a benchmark, ktorý sa zmení sám, je horší než zastaraný. Skript hlási,
 * človek rozhoduje a zapisuje.
 *
 * Spustenie:  npm run data:freshness [-- --date=2026-12-15]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Dátum sa dá podsunúť, aby sa dala kontrola otestovať bez čakania na december.
const dateArg = process.argv.find((a) => a.startsWith('--date='));
const TODAY = dateArg ? new Date(dateArg.slice(7)) : new Date();

const bench = JSON.parse(readFileSync(path.join(ROOT, 'data/benchmarkData.json'), 'utf8'));
const scoringSrc = readFileSync(path.join(ROOT, 'data/scoringConfig.ts'), 'utf8');
const hourly = (scoringSrc.match(/defaultHourlyCostEur = ([\d.]+)/) || [])[1];
// Počet sektorových sadzieb — aby výpis hovoril, koľko hodnôt treba obnoviť.
// Jedna hodnota v tabuľke ôsmich je horšia než žiadna: vyzerá aktuálne.
const sectorRates = (() => {
  const block = scoringSrc.match(/sectorHourlyCostEur[^=]*=\s*\{([\s\S]*?)^\};/m);
  return block ? (block[1].match(/^\s+\w+:\s*[\d.]+,/gm) || []).length : 0;
})();

/**
 * Zdroje s ročným cyklom. `dueMonth` je mesiac publikácie (1–12),
 * `graceMonths` je lehota, do ktorej sa to má premietnuť.
 */
const SOURCES = [
  {
    name: 'Eurostat isoc_e_dii — DII distribúcie',
    dueMonth: 12,
    graceMonths: 3,
    currentLabel: `${bench.version} · aktualizované ${bench.lastUpdated}`,
    lastUpdated: bench.lastUpdated,
    todo: [
      'stiahnuť nové E_DI3_VLO/LO/HI/VHI pre SK, CZ a EU27',
      'prepísať data/benchmarkData.json → countryBenchmarks + version + lastUpdated',
      'npm run config:sync (zrkadlo) a skontrolovať validátor #9',
      'aktualizovať referenčné hodnoty v METHODOLOGY §2.1 a BENCHMARK_SPEC',
      'zapísať do MODEL_VERSIONS.md so stupňom porovnateľnosti (zmena distribúcií = posunutá)',
    ],
  },
  {
    name: 'Eurostat lc_lci_lev / ŠÚ SR — hodinová cena práce',
    dueMonth: 3,
    graceMonths: 2,
    currentLabel: `${hourly} €/h (záloha) + ${sectorRates} sektorových sadzieb`,
    lastUpdated: bench.lastUpdated,
    todo: [
      'stiahnuť lc_lci_lev pre SK, rok N, lcstruct=D1_D4_MD5 — CELÉ členenie NACE, nie jednu hodnotu',
      'prepísať sectorHourlyCostEur v data/scoringConfig.ts (8 odvetví: C, G, M, F, H, I, J, B-S_X_O)',
      'prepísať aj defaultHourlyCostEur — je to záloha pri neuvedenom odvetví (NACE J)',
      'npm run config:sync',
      'aktualizovať tabuľku v ROI_MODEL §7.1 vrátane zmeraných dopadov',
      'npx vitest run engines/sectorRate.test.ts — stráži, že sadzobník sedí s kvízom',
      'zapísať do MODEL_VERSIONS.md (zmena ceny práce = prerušená, všetky € sa menia)',
    ],
  },
];

/** Kedy mala byť daná kotva naposledy obnovená a o koľko meškáme. */
function overdueMonths(source) {
  const y = TODAY.getFullYear();
  // Posledná publikácia, ktorá už nastala.
  let lastRelease = new Date(y, source.dueMonth - 1, 1);
  if (lastRelease > TODAY) lastRelease = new Date(y - 1, source.dueMonth - 1, 1);
  const deadline = new Date(lastRelease);
  deadline.setMonth(deadline.getMonth() + source.graceMonths);
  const updated = new Date(source.lastUpdated);
  if (updated >= lastRelease) return { state: 'ok', lastRelease, deadline };
  if (TODAY < deadline) return { state: 'due', lastRelease, deadline };
  const months = Math.floor((TODAY - deadline) / (1000 * 60 * 60 * 24 * 30.44));
  return { state: 'overdue', months, lastRelease, deadline };
}

const fmt = (d) => d.toISOString().slice(0, 10);
console.log(`Kontrola k ${fmt(TODAY)}\n`);

let worst = 'ok';
for (const s of SOURCES) {
  const r = overdueMonths(s);
  const mark = r.state === 'ok' ? '✓' : r.state === 'due' ? '•' : '✗';
  console.log(`${mark} ${s.name}`);
  console.log(`   v repe: ${s.currentLabel}`);
  console.log(`   posledná publikácia ${fmt(r.lastRelease)} · termín premietnutia ${fmt(r.deadline)}`);
  if (r.state === 'ok') {
    console.log('   aktuálne\n');
    continue;
  }
  worst = r.state === 'overdue' ? 'overdue' : (worst === 'overdue' ? 'overdue' : 'due');
  console.log(r.state === 'due'
    ? '   ČAKÁ NA SPRACOVANIE — publikácia už vyšla, termín ešte beží'
    : `   PO TERMÍNE o ~${r.months} mes.`);
  for (const t of s.todo) console.log(`     – ${t}`);
  console.log();
}

// ── Jednorazové udalosti, ktoré sa nedajú odvodiť z cyklu ─────────────────
const EVENTS = [
  {
    when: '2026-12',
    what: 'Prieskum Eurostat ICT usage 2026 — môže priniesť DII v4',
    why: 'v4 zmení počet aj mapovanie premenných: diiTotalIndicators, data/diiIndicators.json, DII vrstva otázok a celá porovnateľnosť histórie',
  },
  {
    when: '2027-06',
    what: 'Publikácia State of the Digital Decade 2027',
    why: 'referenčné hodnoty a kontext v METHODOLOGY',
  },
];
console.log('Naplánované udalosti:');
for (const e of EVENTS) {
  const passed = fmt(TODAY).slice(0, 7) >= e.when;
  console.log(`  ${passed ? '!' : ' '} ${e.when}  ${e.what}`);
  console.log(`       ${e.why}`);
}

if (worst === 'overdue') {
  console.log('\nAspoň jedna kotva je po termíne.');
  process.exit(1);
}
