/**
 * Zosynchronizuje kópie špecifikácií v `config/model/` s koreňom repozitára.
 *
 * `config/model/` je balík pre editorov modelu — ľudí, ktorí do TypeScriptu
 * nevidia. Kópie sa dovtedy udržiavali ručne a rozišli sa: `SCORING_SPEC.md`
 * o 355 riadkov, a čo je horšie, opisovala **model spred 4. 8. 2026** —
 * plochý priemer DII, `pureBinary`, nemerané skóre fabrikované na nulu. Teda
 * presne to správanie, ktoré scoring v1.5 odstránil. Presne tí ľudia, pre
 * ktorých ten priečinok je, tak čítali opis modelu, ktorý už neexistuje.
 *
 * Zdrojom pravdy je koreň. Tu sa len kopíruje.
 *
 * Spustenie:  npm run docs:sync
 * Kontrola:   beží automaticky v `npm run build` (validate-model.mjs #15)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Dokumenty písané v koreni a zrkadlené do `config/model/`.
 *
 * `QUESTION_BANK_GUIDE.md` v zozname NIE JE — ten sa píše priamo v
 * `config/model/` a v koreni neexistuje, lebo je to návod na editovanie,
 * nie špecifikácia modelu.
 */
export const MIRRORED_DOCS = [
  'METHODOLOGY.md',
  'SCORING_SPEC.md',
  'BENCHMARK_SPEC.md',
  'ROI_MODEL.md',
  'RECOMMENDATION_RULES.md',
];

/** Hlavička, ktorá kópiu označí ako kópiu — inak ju niekto začne editovať. */
function withBanner(text, name) {
  const banner = [
    '<!--',
    `  KÓPIA — needituj. Zdrojom pravdy je /${name} v koreni repozitára.`,
    '  Túto kópiu vyrába `npm run docs:sync` a build kontroluje zhodu',
    '  (validate-model.mjs #15). Zmeny rob v koreni.',
    '-->',
    '',
  ].join('\n');
  return banner + text;
}

export function expectedCopy(name) {
  const src = readFileSync(path.join(ROOT, name), 'utf8').replace(/\r\n/g, '\n');
  return withBanner(src, name);
}

export function actualCopy(name) {
  return readFileSync(path.join(ROOT, 'config/model', name), 'utf8').replace(/\r\n/g, '\n');
}

// Priame spustenie (nie import z validátora) → prepíš kópie.
// `pathToFileURL` je jediný spoľahlivý spôsob porovnania na Windows: ručne
// poskladané `file://` + cesta dá dve lomky namiesto troch a písmeno disku
// sa nezhoduje, takže sa podmienka ticho nikdy nesplní.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const name of MIRRORED_DOCS) {
    const target = path.join(ROOT, 'config/model', name);
    let previous = null;
    try { previous = readFileSync(target, 'utf8').replace(/\r\n/g, '\n'); } catch { /* prvý beh */ }
    const next = expectedCopy(name);
    writeFileSync(target, next);
    console.log(`config/model/${name}: ${previous === next ? 'bez zmeny' : 'PREGENEROVANÉ'}`);
  }
}
