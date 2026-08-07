import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Cesta banka → MariaDB → banka nesmie po ceste nič stratiť.
 *
 * 6.–7. 8. 2026 ju stratila trikrát a zakaždým ticho: `scoring_mode`,
 * `anchor_low_sk`/`anchor_high_sk` a `likert_ors_rationale` prešli cez
 * `assertKeys` (boli v `QUESTION_KEYS`), ale nedostali sa do INSERT-u ani do
 * kompilácie späť. Publish z DB by tak vypol invertované skórovanie `cx_A05`
 * — teda skóre 0 pre všetkých respondentov — a nikto by sa nič nedozvedel.
 *
 * `compile.mjs --check` to zachytí, ale potrebuje databázu a nikto ho po
 * pridaní tých polí nespustil. Tento test tú istú triedu chyby chytí bez
 * pripojenia: porovnáva ZOZNAMY POLÍ, nie dáta.
 */

const importSrc = readFileSync('scripts/db/import.mjs', 'utf8');
const compileSrc = readFileSync('scripts/db/compile.mjs', 'utf8');
const publishSrc = readFileSync('hosting/admin/publish.php', 'utf8');
const schemaSrc = readFileSync('db/schema.sql', 'utf8');
const bank = JSON.parse(readFileSync('data/questionBank.json', 'utf8'));

/** Kľúče, ktoré sa v banke reálne vyskytujú (nie hypotetické). */
const keysInBank = new Set<string>();
for (const q of [
  ...bank.indicative_quiz.questions,
  ...bank.complex_quiz.modules.flatMap((m: { questions: unknown[] }) => m.questions),
]) {
  for (const k of Object.keys(q as object)) keysInBank.add(k);
}

const questionColumns = [...importSrc.matchAll(/^ {2}(\w+): \(q\) =>/gm)].map(m => m[1]);
const handledElsewhere = new Set(
  [...(importSrc.match(/const HANDLED_ELSEWHERE = new Set\(\[([\s\S]*?)\]\)/) ?? ['', ''])[1]
    .matchAll(/'([^']+)'/g)].map(m => m[1])
);
const questionsTable = schemaSrc.slice(
  schemaSrc.indexOf('CREATE TABLE questions'),
  schemaSrc.indexOf('CREATE TABLE question_i18n')
);

describe('round-trip banka ↔ MariaDB', () => {
  test('import má stĺpec pre každý kľúč, ktorý sa v banke vyskytuje', () => {
    const persisted = new Set([...questionColumns, ...handledElsewhere]);
    const lost = [...keysInBank].filter(k => !persisted.has(k));
    expect(lost, `polia bez cieľa v DB: ${lost.join(', ')}`).toEqual([]);
  });

  test('každý stĺpec z importu existuje v db/schema.sql', () => {
    const missing = questionColumns.filter(
      c => !new RegExp(`^\\s{2}${c}\\s`, 'm').test(questionsTable)
    );
    expect(missing, `stĺpce chýbajú v schéme: ${missing.join(', ')}`).toEqual([]);
  });

  test('kompilácia späť vracia každý kľúč, ktorý import uložil', () => {
    // Kľúče, ktoré compile.mjs skladá inak než priamym prepisom stĺpca.
    const derived = new Set(['id', 'category', 'dimension', 'question_type', 'weight',
      'evidence_type', 'allow_unknown']);
    const missing = questionColumns.filter(
      c => !derived.has(c) && !new RegExp(`out\\.${c}\\b|r\\.${c}\\b`).test(compileSrc)
    );
    expect(missing, `compile.mjs ich zahadzuje: ${missing.join(', ')}`).toEqual([]);
  });

  test('publish.php pozná tie isté polia ako compile.mjs', () => {
    // Nasadenie porovnáva výstupy oboch implementácií checksumom, takže
    // rozdiel medzi nimi je chyba bez ohľadu na to, ktorá má pravdu.
    const derived = new Set(['id', 'category', 'dimension', 'question_type', 'weight',
      'evidence_type', 'allow_unknown']);
    const missing = questionColumns.filter(
      c => !derived.has(c) && !publishSrc.includes(`'${c}'`)
    );
    expect(missing, `publish.php ich zahadzuje: ${missing.join(', ')}`).toEqual([]);
  });
});
