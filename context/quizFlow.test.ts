import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Tok kvízu: posledná odpoveď kvíz NEDOKONČÍ.
 *
 * Do 7. 8. 2026 `SUBMIT_ANSWER` pri poslednej otázke sám nastavil
 * `status: 'completed'` a rovno zavolal `computeResult`. Efekt v `quiz/page.tsx`
 * potom vždy trafil vetvu s presmerovaním a `completeQuiz()` sa v normálnom
 * toku nezavolal ani raz — `COMPLETE_QUIZ` bola mŕtva vetva reducera.
 *
 * Nebola to len kozmetika: medzi poslednou odpoveďou a výsledkom neexistoval
 * okamih, do ktorého by sa dalo čokoľvek vložiť — ani rekapitulácia, ani
 * ponuka opraviť odpoveď (`IMPROVEMENT_CHECKLIST.md`, kontrola rozporov).
 *
 * Reducer sa v tomto prostredí spustiť nedá (`AssessmentContext` je klientský
 * komponent a testy bežia bez DOM), takže sa kontroluje ŠTRUKTÚRA zdroja.
 * Je to hrubší nástroj než beh, ale chytá presne tú regresiu, ktorá nastala:
 * návrat `computeResult` do `SUBMIT_ANSWER`.
 */

const ctx = readFileSync('context/AssessmentContext.tsx', 'utf8');
const page = readFileSync('app/[locale]/(assessment)/quiz/page.tsx', 'utf8');
const types = readFileSync('types/index.ts', 'utf8');

/**
 * Zdroj bez komentárov. Komentáre v tomto repozitári cituj­ú starý kód
 * („do 7. 8. 2026 tu bolo…"), takže by test hlásil regresiu na vlastnom
 * vysvetlení, prečo k nej nesmie dôjsť.
 */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Telo jednej vetvy `case '<NAME>':` reducera, bez komentárov. */
function reducerCase(name: string): string {
  const start = ctx.indexOf(`case '${name}': {`);
  expect(start, `vetva ${name} v reduceri chýba`).toBeGreaterThan(-1);
  const next = ctx.indexOf("\n    case '", start + 1);
  return stripComments(ctx.slice(start, next === -1 ? ctx.length : next));
}

describe('tok kvízu', () => {
  test('typ stavu pozná medzistav answered', () => {
    expect(types).toMatch(/AssessmentStatus = [^;]*'answered'/);
  });

  test('SUBMIT_ANSWER výsledok NEPOČÍTA', () => {
    const body = reducerCase('SUBMIT_ANSWER');
    expect(body.includes('computeResult'),
      'SUBMIT_ANSWER opäť počíta výsledok — COMPLETE_QUIZ tým stráca zmysel').toBe(false);
  });

  test('SUBMIT_ANSWER pri poslednej otázke prejde do answered, nie completed', () => {
    const body = reducerCase('SUBMIT_ANSWER');
    expect(body).toContain("status = 'answered'");
    expect(body.includes("status = 'completed'")).toBe(false);
  });

  test('COMPLETE_QUIZ výsledok počíta a je idempotentná', () => {
    const body = reducerCase('COMPLETE_QUIZ');
    expect(body).toContain('computeResult');
    // Bez tejto poistky by druhý beh efektu (StrictMode) vyrobil iný snapshot
    // toho istého kvízu — `computeResult` razí `computedAt`.
    expect(body).toContain("status === 'completed'");
  });

  test('stránka kvízu completeQuiz naozaj volá a rieši answered ako prvé', () => {
    const src = stripComments(page);
    expect(src).toContain('completeQuiz()');
    const answeredAt = src.indexOf("status === 'answered'");
    const completedAt = src.indexOf("status === 'completed'");
    expect(answeredAt, 'vetva answered chýba').toBeGreaterThan(-1);
    expect(answeredAt, 'answered sa musí riešiť pred completed, inak sa completeQuiz nezavolá')
      .toBeLessThan(completedAt);
  });

  test('výsledková stránka bez spočítaného výsledku nepadne', () => {
    const results = readFileSync('app/[locale]/(assessment)/results/page.tsx', 'utf8');
    expect(results).toMatch(/!assessment\.result|!assessment \|\| !assessment\.result/);
  });
});
