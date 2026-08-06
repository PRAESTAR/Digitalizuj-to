import { describe, expect, test } from 'vitest';
import { calculateORS } from './scoringEngine';
import { getQuizQuestions, calculateAnswerScore } from './questionEngine';
import { scoringConfig } from '@/data/scoringConfig';
import type { Answer, Question } from '@/types';

/**
 * Zaokrúhľovanie sa smie diať až pri zobrazení.
 *
 * ORS prechádzal tromi zaokrúhleniami za sebou — skóre kategórie na desatinu,
 * z tých zaokrúhlených vážený priemer, ten sa zaokrúhlil znova a až z neho sa
 * odvodil maturity level. Drift bol malý (do 0,12 bodu), ale na hranici pásma
 * rozhodujúci: v 27 zo 4 000 kombinácií odpovedí dal inú nálepku
 * („Rozvíjajúci sa" vs. „Pokročilý") než presná matematika.
 *
 * Tento test drží presnú referenčnú implementáciu vedľa enginu a porovnáva ich
 * na deterministickom sweepe cez reálnu banku.
 */

/** Referencia bez akéhokoľvek priebežného zaokrúhľovania. */
function orsExact(answers: Answer[], questions: Question[]) {
  const cats = ['A', 'B', 'C', 'D', 'E', 'F'];
  const exactCategoryScores: Record<string, number> = {};
  let weighted = 0;
  let weightSum = 0;

  for (const c of cats) {
    const qs = questions.filter((q) => (q.maps_to_score ?? []).includes(`ors_${c}`));
    const as = answers.filter((a) => qs.some((q) => q.id === a.questionId) && !a.isUnknown && !a.wasSkipped);
    if (!as.length) continue;
    let s = 0;
    let w = 0;
    for (const a of as) {
      const q = qs.find((x) => x.id === a.questionId)!;
      s += a.score * q.weight;
      w += q.weight;
    }
    const catScore = s / w;
    exactCategoryScores[c] = catScore;
    weighted += catScore * scoringConfig.categoryWeights[c];
    weightSum += scoringConfig.categoryWeights[c];
  }
  if (weightSum === 0) return null;

  const ors = weighted / weightSum;
  let penalized = ors;
  const e = exactCategoryScores['E'];
  if (e !== undefined && e < scoringConfig.securityPenaltyThreshold) {
    const factor =
      1 - scoringConfig.securityPenaltyMaxFactor +
      scoringConfig.securityPenaltyMaxFactor * (e / scoringConfig.securityPenaltyThreshold);
    penalized = ors * factor;
  }

  let level = 0;
  for (let i = 0; i < scoringConfig.maturityThresholds.length; i++) {
    if (penalized > scoringConfig.maturityThresholds[i]) level = i + 1;
  }
  return { ors, penalized, level };
}

/** Deterministický generátor odpovedí — bez Math.random, aby bol beh opakovateľný. */
function answersForSeed(questions: Question[], seed: number): Answer[] {
  let s = seed;
  return questions.map((q) => {
    const opts = q.options ?? [];
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const value = q.question_type === 'multi_select'
      ? opts.filter((_, i) => ((s >> i) & 1) === 1).map((o) => o.value)
      : opts[s % Math.max(1, opts.length)]?.value ?? '';
    return {
      questionId: q.id, value, score: calculateAnswerScore(q, value),
      isUnknown: false, wasSkipped: false, timestamp: '2026-08-06T00:00:00.000Z',
    };
  });
}

describe('zaokrúhľovanie nemení odvodené rozhodnutia', () => {
  const questions = getQuizQuestions('complex');
  const SWEEP = 4000;

  test('maturity level sa NIKDY nelíši od presného výpočtu', () => {
    let flips = 0;
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersForSeed(questions, seed);
      const got = calculateORS(answers, questions);
      const exact = orsExact(answers, questions);
      if (!exact || got.maturityLevel === null) continue;
      if (got.maturityLevel !== exact.level) flips++;
    }
    expect(flips).toBe(0);
  });

  test('zobrazené skóre sa od presnej hodnoty líši najviac o pol kroku zobrazenia', () => {
    // 0,05 je teoretické minimum pri zobrazení na jedno desatinné miesto —
    // väčšia odchýlka by znamenala, že sa niekde zaokrúhľuje pred výpočtom.
    let maxOrs = 0;
    let maxPenalized = 0;
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersForSeed(questions, seed);
      const got = calculateORS(answers, questions);
      const exact = orsExact(answers, questions);
      if (!exact || got.score === null || got.scorePenalized === null) continue;
      maxOrs = Math.max(maxOrs, Math.abs(got.score - exact.ors));
      maxPenalized = Math.max(maxPenalized, Math.abs(got.scorePenalized - exact.penalized));
    }
    expect(maxOrs).toBeLessThanOrEqual(0.0501);
    expect(maxPenalized).toBeLessThanOrEqual(0.0501);
  });
});

describe('sémantika pásiem maturity je polootvorená zdola', () => {
  // Porovnáva sa ostrým `>`, takže prah patrí do NIŽŠIEHO pásma:
  // level 0 = [0,20], 1 = (20,40], 2 = (40,60], 3 = (60,80], 4 = (80,100].
  // Bez zdokumentovania sa to dá prečítať oboma smermi a hodnota presne na
  // prahu je práve tá, o ktorú sa vedú spory.
  const oneQuestion = (score: number): { questions: Question[]; answers: Answer[] } => {
    const q = {
      id: 'x', category: 'A', dimension: 'test', weight: 1,
      maps_to_score: ['ors_A'], allow_unknown: true, branching_rules: [],
      evidence_type: 'direct', maps_to_risk: [], maps_to_roi_model: [],
      question_sk: 'test', question_type: 'single_choice',
      options: [{ value: 'v', label: 'v', score }],
    } as unknown as Question;
    return {
      questions: [q],
      answers: [{
        questionId: 'x', value: 'v', score,
        isUnknown: false, wasSkipped: false, timestamp: '2026-08-06T00:00:00.000Z',
      }],
    };
  };

  test.each([
    [0, 0], [20, 0], [20.01, 1],
    [40, 1], [40.01, 2],
    [60, 2], [60.01, 3],
    [80, 3], [80.01, 4], [100, 4],
  ])('skóre %s → level %s', (score, expected) => {
    const { questions, answers } = oneQuestion(score);
    expect(calculateORS(answers, questions).maturityLevel).toBe(expected);
  });
});
