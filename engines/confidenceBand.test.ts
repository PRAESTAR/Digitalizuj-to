import { describe, expect, test } from 'vitest';
import { calculateDII, calculateORS } from './scoringEngine';
import { getQuizQuestions, calculateAnswerScore } from './questionEngine';
import type { Answer, Question } from '@/types';

/**
 * Konfidenčné pásma — 18-otázkový a 51-otázkový výsledok majú prestať
 * vyzerať rovnako isto.
 *
 * Pásmo NIE JE štatistický interval spoľahlivosti; to by si vyžadovalo
 * rozptylovú štruktúru položiek z pilotu, ktorý zatiaľ nebehol. Je to
 * deterministický rozsah z toho, čo dotazník nezistil — a testy strážia
 * práve tú deterministickú vlastnosť: bodový odhad musí vždy ležať vnútri.
 */

function answerAll(questions: Question[], pick: (q: Question) => string | string[]): Answer[] {
  return questions.map((q) => {
    const value = pick(q);
    return {
      questionId: q.id, value,
      // Skóre počíta ten istý engine ako v prevádzke. Natvrdo dosadená nula
      // pre multi_select by testovala iný model než ten, ktorý beží: pri
      // invertovanom skórovaní je prázdny výber 100 bodov, nie 0.
      score: calculateAnswerScore(q, value),
      isUnknown: false, wasSkipped: false,
      timestamp: '2026-08-06T00:00:00.000Z',
    };
  });
}

/** Stredná odpoveď — reprezentuje bežnú firmu, nie okrajový prípad. */
const middle = (q: Question): string | string[] => {
  const opts = q.options ?? [];
  if (q.question_type === 'multi_select') return [];
  return opts[Math.floor(opts.length / 2)]?.value ?? '';
};

describe('DII pásmo — deterministický rozsah z nemeraných indikátorov', () => {
  const questions = getQuizQuestions('complex');

  test('bodový odhad leží vždy vnútri rozsahu', () => {
    const dii = calculateDII(answerAll(questions, middle), questions);
    expect(dii.band).not.toBeNull();
    expect(dii.score12!).toBeGreaterThanOrEqual(dii.band!.lower);
    expect(dii.score12!).toBeLessThanOrEqual(dii.band!.upper);
  });

  test('šírka rozsahu sa rovná počtu nezmeraných indikátorov', () => {
    const dii = calculateDII(answerAll(questions, middle), questions);
    expect(dii.band!.upper - dii.band!.lower).toBe(12 - dii.measuredIndicators);
  });

  test('bez jedinej odpovede nie je pásmo — nemerané DII sa nepredstiera', () => {
    expect(calculateDII([], questions).band).toBeNull();
  });
});

describe('ORS pásmo — citlivosť na jednu odpoveď', () => {
  const cat = (id: string, weight: number, opts: number): Question => ({
    id, category: 'C', dimension: 'test', weight,
    maps_to_score: ['ors_C'], allow_unknown: true, branching_rules: [],
    evidence_type: 'direct', maps_to_risk: [], maps_to_roi_model: [],
    question_sk: 'test', question_type: 'single_choice',
    options: Array.from({ length: opts }, (_, i) => ({
      value: String(i), label: String(i), score: (100 / (opts - 1)) * i,
    })),
  } as unknown as Question);

  test('kategória meraná jednou otázkou má širší rozsah než meraná štyrmi', () => {
    const one = [cat('c1', 1, 5)];
    const four = [cat('c1', 1, 5), cat('c2', 1, 5), cat('c3', 1, 5), cat('c4', 1, 5)];

    const bandWidth = (qs: Question[]) => {
      const ors = calculateORS(answerAll(qs, middle), qs);
      const b = ors.categories['C'].band!;
      return b.upper - b.lower;
    };

    expect(bandWidth(one)).toBeGreaterThan(bandWidth(four));
  });

  test('celkové skóre leží vnútri celkového rozsahu', () => {
    const questions = getQuizQuestions('complex');
    const ors = calculateORS(answerAll(questions, middle), questions);
    expect(ors.band).not.toBeNull();
    expect(ors.score!).toBeGreaterThanOrEqual(ors.band!.lower);
    expect(ors.score!).toBeLessThanOrEqual(ors.band!.upper);
  });

  test('ZOBRAZENÉ skóre leží vnútri ZOBRAZENÉHO rozsahu aj pri penalizácii', () => {
    // Karta vypisuje scorePenalized, nie score. Kým pásmo ostávalo pri
    // nepenalizovanej hodnote, firma so slabou bezpečnosťou videla napríklad
    // „28/100" a hneď pod tým „Rozsah 35–46" — číslo mimo vlastného rozsahu.
    const questions = getQuizQuestions('complex');
    const answers = answerAll(questions, (q) => {
      const opts = q.options ?? [];
      if (q.question_type === 'multi_select') return [];
      // Kategória E na najhoršej možnosti = penalizácia sa spustí.
      if ((q.maps_to_score ?? []).includes('ors_E')) return opts[0]?.value ?? '';
      return opts[Math.floor(opts.length / 2)]?.value ?? '';
    });

    const ors = calculateORS(answers, questions);
    expect(ors.penaltyApplied).toBe(true);
    expect(ors.scorePenalized!).toBeGreaterThanOrEqual(ors.band!.lower);
    expect(ors.scorePenalized!).toBeLessThanOrEqual(ors.band!.upper);
  });

  test('nemeraná kategória nemá rozsah — nula sa nefabrikuje', () => {
    const questions = getQuizQuestions('complex');
    const ors = calculateORS([], questions);
    for (const c of Object.values(ors.categories)) expect(c.band).toBeNull();
    expect(ors.band).toBeNull();
  });
});

describe('indikatívny vs. komplexný kvíz', () => {
  // Toto je dôvod, prečo pásma vznikli: dovtedy oba výsledky vyzerali
  // rovnako isto, hoci jeden stojí na 18 a druhý na 51 odpovediach.
  test('indikatívny výsledok má širší rozsah než komplexný', () => {
    const ind = getQuizQuestions('indicative');
    const cx = getQuizQuestions('complex');

    const indOrs = calculateORS(answerAll(ind, middle), ind);
    const cxOrs = calculateORS(answerAll(cx, middle), cx);

    const width = (b: { lower: number; upper: number } | null) => (b ? b.upper - b.lower : 0);
    expect(width(indOrs.band)).toBeGreaterThan(width(cxOrs.band));
  });

  test('indikatívne DII pokrýva menej indikátorov, teda má širší rozsah', () => {
    const ind = getQuizQuestions('indicative');
    const cx = getQuizQuestions('complex');

    const indDii = calculateDII(answerAll(ind, middle), ind);
    const cxDii = calculateDII(answerAll(cx, middle), cx);

    expect(indDii.measuredIndicators).toBeLessThan(cxDii.measuredIndicators);
    expect(indDii.band!.upper - indDii.band!.lower)
      .toBeGreaterThan(cxDii.band!.upper - cxDii.band!.lower);
  });
});
