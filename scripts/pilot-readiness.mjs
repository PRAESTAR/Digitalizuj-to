/**
 * Čo sa o kvalite merania dá zistiť z uložených výsledkov — a čo nie.
 *
 * Do 7. 8. 2026 tento skript porovnával stav so šiestimi prahmi
 * (`scoringConfig.pilotCriteria`). Tie sú zmazané: nečítal ich žiadny engine
 * a štyri z nich sa s týmto úložiskom spočítať nedali bez ohľadu na počet
 * respondentov, lebo `answers_json` je zámerne NULL a nedokončené kvízy sa
 * neukladajú. Rozhodnutie zo 7. 8. 2026 znie, že odpovede po položkách sa
 * zbierať nebudú — Cronbachova alfa ani diskriminácia položiek teda nemajú
 * z čoho vzniknúť a nie je to otázka času (METHODOLOGY §13).
 *
 * Skript preto neporovnáva s prahmi. Počíta to, čo z agregátov spočítať IDE,
 * a najcennejšie sú medzikategóriové korelácie: odpovedajú na otázku, či šesť
 * ODRM oblastí meria šesť rôznych vecí, alebo sa navzájom duplikujú. Na to
 * odpovede po položkách netreba.
 *
 * POVINNÁ STRATIFIKÁCIA PODĽA `model_version`. Banka sa medzi 4. a 7. 8. 2026
 * zmenila štyrikrát (1.5 → 1.8). Korelácia počítaná naprieč verziami je zmes
 * viacerých nástrojov, nie zistenie o jednom — preto sa vzorka rozpadá podľa
 * verzie a spoločne sa nepočíta nič.
 *
 * Spustenie:  DB_PASS='…' npm run pilot:readiness
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const mysql = require('mysql2/promise');

const CATS = ['A', 'B', 'C', 'D', 'E', 'F'];
const CAT_KEY = { A: 'procesy', B: 'systemy', C: 'data', D: 'infra', E: 'security', F: 'governance' };

/** Pearsonova korelácia; null keď je vzorka príliš malá alebo bez rozptylu. */
function pearson(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([a, b]) => a !== null && b !== null);
  const n = pairs.length;
  if (n < 3) return null;
  const mx = pairs.reduce((s, [a]) => s + a, 0) / n;
  const my = pairs.reduce((s, [, b]) => s + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (const [a, b] of pairs) {
    num += (a - mx) * (b - my);
    dx += (a - mx) ** 2;
    dy += (b - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'db.r6.websupport.sk',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'digitalizuj',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'Digitalizuj',
});

const [rows] = await db.query(
  `SELECT quiz_type, model_version, dii_score12, ors_score, tdri_score, nps_score, result_json
     FROM assessment_results
    ORDER BY created_at`
);
const [[itemLevel]] = await db.query(
  'SELECT COUNT(*) c FROM assessment_results WHERE answers_json IS NOT NULL'
);
await db.end();

console.log(`Uložených výsledkov: ${rows.length}`);
console.log(`Z toho s odpoveďami po otázkach: ${itemLevel.c}\n`);

// ── Čo sa spočítať NEDÁ a prečo ───────────────────────────────────────────
console.log('NEDÁ SA SPOČÍTAŤ (nie kvôli počtu respondentov, ale kvôli tomu, čo ukladáme):');
console.log('  ✗ vnútorná konzistencia (alfa)   potrebuje odpovede po položkách — answers_json je zámerne NULL');
console.log('  ✗ diskriminácia položiek         to isté: item-total korelácia sa bez položiek nedá');
console.log('  ✗ podiel „Neviem"                je vlastnosť odpovedí, nie agregátu');
console.log('  ✗ miera dokončenia               nedokončené kvízy sa neukladajú, menovateľ neexistuje');
console.log('  Rozhodnuté 7. 8. 2026: zbierať sa nebudú. Viď METHODOLOGY §13.\n');

if (rows.length === 0) {
  console.log('Žiadne výsledky — zvyšok sa počítať nedá. Vráť sa, keď kvíz niekto vyplní.');
  process.exit(0);
}

// ── Čo sa spočítať DÁ ─────────────────────────────────────────────────────
const cats = {};
for (const c of CATS) cats[c] = [];
const ors = [], dii = [], tdri = [], nps = [];

for (const r of rows) {
  ors.push(r.ors_score === null ? null : Number(r.ors_score));
  dii.push(r.dii_score12 === null ? null : Number(r.dii_score12));
  tdri.push(r.tdri_score === null ? null : Number(r.tdri_score));
  if (r.nps_score !== null) nps.push(Number(r.nps_score));
  let parsed = null;
  try { parsed = JSON.parse(r.result_json); } catch { /* poškodený riadok preskočíme */ }
  for (const c of CATS) {
    const v = parsed?.ors?.categories?.[c]?.score;
    cats[c].push(typeof v === 'number' ? v : null);
  }
  void CAT_KEY;
}

console.log('SPOČÍTATEĽNÉ Z AGREGÁTOV:');
console.log(`  vzorka                 ${rows.length}`);

// Rozpad podľa verzie modelu. Bez neho by korelácie nižšie miešali výsledky
// z nástrojov, ktoré merali inak — banka sa medzi 4. a 7. 8. 2026 zmenila
// štyrikrát. Paušálne „potrebujeme 200 respondentov" je preto zavádzajúce:
// rozhoduje počet v NAJVÄČŠEJ verzii, nie súčet.
const byVersion = {};
for (const r of rows) byVersion[r.model_version ?? '(neuvedená)'] = (byVersion[r.model_version ?? '(neuvedená)'] ?? 0) + 1;
const versions = Object.entries(byVersion).sort((a, b) => b[1] - a[1]);
console.log(`  verzií modelu vo vzorke ${versions.length}`);
for (const [v, n] of versions) console.log(`    ${String(v).padEnd(12)} ${n}`);
if (versions.length > 1) {
  console.log('  ⚠ Vzorka je zmesou viacerých verzií nástroja — korelácie nižšie sú');
  console.log('    orientačné. Na tvrdenie o modeli počítaj v rámci jednej verzie.');
}

const rOrsDii = pearson(ors, dii);
console.log(`  korelácia ORS ↔ DII    ${rOrsDii === null ? 'nedostatočná vzorka' : rOrsDii.toFixed(3)}`);
const rOrsTdri = pearson(ors, tdri);
console.log(`  korelácia ORS ↔ TDRI   ${rOrsTdri === null ? 'nedostatočná vzorka' : rOrsTdri.toFixed(3)} (očakáva sa ZÁPORNÁ)`);
if (nps.length) {
  console.log(`  NPS                    n=${nps.length}, priemer ${(nps.reduce((a, b) => a + b, 0) / nps.length).toFixed(1)}`);
}

console.log('\n  Medzikategóriové korelácie (vysoké = kategórie merajú to isté):');
let maxPair = null;
for (let i = 0; i < CATS.length; i++) {
  for (let j = i + 1; j < CATS.length; j++) {
    const r = pearson(cats[CATS[i]], cats[CATS[j]]);
    if (r === null) continue;
    if (!maxPair || Math.abs(r) > Math.abs(maxPair.r)) maxPair = { a: CATS[i], b: CATS[j], r };
    console.log(`    ${CATS[i]}–${CATS[j]}  ${r.toFixed(3)}`);
  }
}
if (maxPair) {
  console.log(`\n  Najvyššia: ${maxPair.a}–${maxPair.b} = ${maxPair.r.toFixed(3)}`);
  if (Math.abs(maxPair.r) > 0.85) {
    console.log('  ⚠ Nad 0,85 — tie dve kategórie pravdepodobne merajú tú istú vec a ich oddelenie je zdanlivé.');
  }
} else {
  console.log('    (nedostatočná vzorka)');
}

console.log('\nZáver: odpovede po položkách sa zbierať NEBUDÚ (rozhodnuté 7. 8. 2026),');
console.log('takže vnútorná konzistencia ani diskriminácia položiek sa nikdy nespočítajú');
console.log('— a nie je to otázka času. Dôkaz o kvalite merania stojí na obsahovej');
console.log('validite (kognitívny pretest) a na diskriminačnej validite, ktorú vidno');
console.log('práve v medzikategóriových koreláciách vyššie. Viď METHODOLOGY §13.');
