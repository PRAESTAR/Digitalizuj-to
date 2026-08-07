/**
 * Čo sa o kvalite merania dá zistiť z uložených výsledkov — a čo nie.
 *
 * `scoringConfig.pilotCriteria` popisuje pilotnú štúdiu (Cronbachova alfa,
 * diskriminácia položiek, miera dokončenia…). Tá štúdia sa ale s dnešným
 * úložiskom **spustiť nedá** a nie je to otázka počtu respondentov:
 *
 *  - `answers_json` je zámerne vždy NULL (rozhodnutie 5. 8. 2026 — odpovede
 *    po otázkach sa neukladajú), takže Cronbachova alfa ani item-total
 *    korelácie nemajú z čoho vzniknúť. Obe potrebujú odpovede po položkách.
 *  - Nedokončené kvízy sa neukladajú vôbec, takže mieru dokončenia nemá
 *    s čím porovnávať.
 *
 * Kritériá teda vyzerajú prevádzkovo, ale sú aspiračné. Tento skript to
 * priznáva a spočíta to, čo z agregátov spočítať ide — a to nie je málo:
 * medzikategóriové korelácie odpovedajú na otázku, či šesť ODRM oblastí meria
 * šesť rôznych vecí, alebo sa navzájom duplikujú.
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
const blocked = [
  ['cronbachAlphaMin', 'potrebuje odpovede po položkách — `answers_json` je zámerne NULL'],
  ['itemDiscriminationMin', 'to isté: item-total korelácia sa bez položiek nedá'],
  ['unknownAnswerRateMax', 'podiel „Neviem" je vlastnosť odpovedí, nie agregátu'],
  ['completionRateMin', 'nedokončené kvízy sa neukladajú, takže menovateľ neexistuje'],
];
console.log('NEDÁ SA SPOČÍTAŤ (nie kvôli počtu respondentov, ale kvôli tomu, čo ukladáme):');
for (const [k, why] of blocked) console.log(`  ✗ ${k.padEnd(24)} ${why}`);
console.log();

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
console.log(`  vzorka                 ${rows.length} (pilot vyžaduje 200)`);

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

console.log('\nZáver: kým sa neuloží aspoň časť odpovedí po položkách, pilotné');
console.log('kritériá zostávajú aspiračné bez ohľadu na počet respondentov.');
console.log('Riešenie je rozhodnutie o zbere, nie čakanie — viď METHODOLOGY §13.');
