import { describe, expect, test } from 'vitest';
import { replayAnswers } from './quizState';
import { getQuizQuestions } from './questionEngine';

/**
 * Prehratie odpovedí — základ opravy už zodpovedanej otázky (`EDIT_ANSWER`).
 *
 * Nosný invariant: **stav po oprave sa musí rovnať stavu z čerstvého behu
 * s tou istou odpoveďou.** Vetvenie je závislé od odpovedí, takže inkrementálna
 * úprava „na mieste" by musela vedieť vrátiť späť preskočené otázky, rizikové
 * flagy aj meta polia respondenta — a jednu z tých vecí by skôr či neskôr
 * zabudla. Preto sa stav prehráva od nuly.
 */

const cx = getQuizQuestions('complex');
type Input = { questionId: string; value: string | string[]; isUnknown: boolean };
const a = (questionId: string, value: string | string[]): Input => ({ questionId, value, isUnknown: false });

/** Porovnateľný odtlačok stavu — časové pečiatky sa zámerne ignorujú. */
const shape = (r: ReturnType<typeof replayAnswers>) => ({
  answers: r.answers.map(x => ({ id: x.questionId, v: x.value, s: x.score, sk: x.wasSkipped, u: x.isUnknown })),
  skipped: [...r.skipped].sort(),
  riskFlags: [...r.riskFlags].sort(),
  respondent: r.respondent,
});

describe('prehratie je deterministické', () => {
  test('dvakrát to isté dá to isté', () => {
    const inputs = [a('cx_01', 'manufacturing'), a('cx_02', 'medium'), a('cx_A02', 'automated')];
    expect(shape(replayAnswers(inputs, cx))).toEqual(shape(replayAnswers(inputs, cx)));
  });

  test('oprava dá ten istý stav ako čerstvý beh', () => {
    // Pôvodne 'medium', opravené na 'micro'.
    const original = [a('cx_01', 'retail'), a('cx_02', 'medium'), a('cx_A02', 'manual')];
    const opravene = original.map(x => (x.questionId === 'cx_02' ? a('cx_02', 'micro') : x));
    const cerstvy = [a('cx_01', 'retail'), a('cx_02', 'micro'), a('cx_A02', 'manual')];
    expect(shape(replayAnswers(opravene, cx))).toEqual(shape(replayAnswers(cerstvy, cx)));
  });

  test('vetvenie sa pri oprave vráti späť', () => {
    // cx_02 = micro/small preskočí cx_E08_nis2; medium ho vráti.
    const micro = replayAnswers([a('cx_02', 'micro')], cx);
    const medium = replayAnswers([a('cx_02', 'medium')], cx);
    expect(micro.skipped.has('cx_E08_nis2')).toBe(true);
    expect(medium.skipped.has('cx_E08_nis2')).toBe(false);
    // A hlavne: prechod späť preskočenie ZRUŠÍ, nie nechá visieť.
    const spat = replayAnswers([a('cx_02', 'medium')], cx);
    expect(spat.skipped.has('cx_E08_nis2')).toBe(false);
  });

  test('meta polia respondenta sa prehrajú tiež', () => {
    const r = replayAnswers([a('cx_01', 'construction'), a('cx_02', 'large')], cx);
    expect(r.respondent.sector).toBe('construction');
    expect(r.respondent.employeeCountBand).toBe('large');
    // Zmena sektora ho prepíše, nezanechá starý.
    const r2 = replayAnswers([a('cx_01', 'construction'), a('cx_01', 'ict')], cx);
    expect(r2.respondent.sector).toBe('ict');
  });

  test('odpoveď na otázku, ktorú vetvenie medzitým preskočilo, sa neprehrá', () => {
    // Firma najprv uviedla medium (dostala NIS2 otázku), potom opravila na
    // micro — odpoveď na NIS2 sa už do stavu dostať nesmie.
    const r = replayAnswers([
      a('cx_02', 'micro'),
      a('cx_E08_nis2', 'yes_prepared'),
    ], cx);
    const nis2 = r.answers.find(x => x.questionId === 'cx_E08_nis2');
    expect(nis2?.wasSkipped, 'preskočená otázka nesmie niesť odpoveď').toBe(true);
  });

  test('preskočené otázky sú v odpovediach ako syntetické záznamy s dôvodom', () => {
    const r = replayAnswers([a('cx_02', 'micro')], cx);
    const nis2 = r.answers.find(x => x.questionId === 'cx_E08_nis2');
    expect(nis2).toBeDefined();
    expect(nis2!.wasSkipped).toBe(true);
    expect(nis2!.skipReason).toContain('cx_02');
  });

  test('prehratie nemodifikuje vstupné pole', () => {
    const inputs = [a('cx_02', 'micro')];
    const kopia = JSON.parse(JSON.stringify(inputs));
    replayAnswers(inputs, cx);
    expect(inputs).toEqual(kopia);
  });
});
