import { describe, expect, test } from 'vitest';
import { calculateDII, calculateORS } from './scoringEngine';
import type { Answer, Question } from '@/types';

/**
 * Fixtúry používajú REÁLNE ID otázok z data/diiIndicators.json — engine
 * mapuje kritériá podľa ID, syntetické ID by boli vždy nemerané.
 */
function makeQ(partial: Partial<Question> & { id: string }): Question {
  return {
    category: 'dii',
    dimension: 'test',
    weight: 1,
    maps_to_score: ['dii'],
    allow_unknown: true,
    branching_rules: [],
    evidence_type: 'self_reported',
    maps_to_risk: [],
    maps_to_roi_model: [],
    question_sk: 'test',
    question_type: 'single_choice',
    ...partial,
  } as Question;
}

function answer(questionId: string, value: string | string[], score: number, flags?: Partial<Answer>): Answer {
  return {
    questionId,
    value,
    score,
    isUnknown: false,
    wasSkipped: false,
    timestamp: '2026-08-04T00:00:00.000Z',
    ...flags,
  };
}

describe('calculateDII — per-indikátorová agregácia (v3/2025)', () => {
  test('extrapolácia: 2 merané indikátory, 1 splnený → score12 = 6', () => {
    const questions = [makeQ({ id: 'cx_DII01' }), makeQ({ id: 'cx_DII02' })];
    const answers = [
      answer('cx_DII01', 'basic', 25), // DII3 met (minScore 25)
      answer('cx_DII02', 'none', 0),   // DII4 measured, not met (minScore 33)
    ];
    const dii = calculateDII(answers, questions);

    expect(dii.measured).toBe(true);
    expect(dii.measuredIndicators).toBe(2);
    expect(dii.metIndicators).toBe(1);
    expect(dii.score12).toBe(6); // round(1/2 × 12)
    expect(dii.level).toBe('low');
    expect(dii.confidence).toBe('low'); // < 6 meraných
    expect(dii.indicators).toHaveLength(12);
    expect(dii.indicators.find(i => i.code === 'DII3')?.status).toBe('met');
    expect(dii.indicators.find(i => i.code === 'DII4')?.status).toBe('not_met');
    expect(dii.indicators.find(i => i.code === 'DII7')?.status).toBe('unmeasured');
  });

  test('anyOfValues: jedna multi_select otázka meria DII7/8/9 nezávisle', () => {
    const questions = [makeQ({ id: 'ind_05', question_type: 'multi_select', category: 'B' })];
    const answers = [answer('ind_05', ['crm', 'accounting'], 25)];
    const dii = calculateDII(answers, questions);

    expect(dii.indicators.find(i => i.code === 'DII7')?.status).toBe('not_met'); // erp nezvolené
    expect(dii.indicators.find(i => i.code === 'DII8')?.status).toBe('met');     // crm zvolené
    expect(dii.indicators.find(i => i.code === 'DII9')?.status).toBe('not_met'); // bi nezvolené
    expect(dii.measuredIndicators).toBe(3);
    expect(dii.metIndicators).toBe(1);
    expect(dii.score12).toBe(4); // round(1/3 × 12)
  });

  test('Neviem/preskočené = nemerané, nie nula', () => {
    const questions = [makeQ({ id: 'cx_DII01' }), makeQ({ id: 'cx_DII02' })];
    const answers = [
      answer('cx_DII01', 'basic', 25, { isUnknown: true }),
      answer('cx_DII02', 'presence', 33, { wasSkipped: true }),
    ];
    const dii = calculateDII(answers, questions);

    expect(dii.measured).toBe(false);
    expect(dii.score12).toBeNull();
    expect(dii.score100).toBeNull();
    expect(dii.level).toBeNull();
    expect(dii.indicators.every(i => i.status === 'unmeasured')).toBe(true);
  });

  test('striktný v3: vylúčená dii otázka (ind_10) nesýti skóre ani meranie', () => {
    const questions = [makeQ({ id: 'ind_10', question_type: 'multi_select', category: 'E' })];
    const answers = [answer('ind_10', ['mfa', 'backup'], 100)];
    const dii = calculateDII(answers, questions);

    expect(dii.measured).toBe(false);
    expect(dii.score100).toBeNull();
  });

  test('score100 priemeruje len namapované platné odpovede', () => {
    const questions = [
      makeQ({ id: 'cx_DII01' }),
      makeQ({ id: 'cx_DII02' }),
      makeQ({ id: 'ind_10', question_type: 'multi_select', category: 'E' }), // vylúčená
    ];
    const answers = [
      answer('cx_DII01', 'basic', 25),
      answer('cx_DII02', 'none', 0),
      answer('ind_10', ['mfa'], 100), // nesmie zdvihnúť priemer
    ];
    const dii = calculateDII(answers, questions);

    expect(dii.score100).toBe(12.5); // (25 + 0) / 2
  });
});

describe('calculateORS — N/A kategórie s renormalizáciou', () => {
  const qA = makeQ({ id: 'q_a1', category: 'A', maps_to_score: ['ors_A'] });
  const qD = makeQ({ id: 'q_d1', category: 'D', maps_to_score: ['ors_D'] });
  const qE = makeQ({ id: 'q_e1', category: 'E', maps_to_score: ['ors_E'] });

  test('nemeraná kategória neťahá skóre k nule (renormalizácia váh)', () => {
    const ors = calculateORS([answer('q_a1', 'x', 80)], [qA, qD]);

    expect(ors.score).toBe(80); // nie 80 × 0.2 = 16
    expect(ors.measuredCategories).toBe(1);
    expect(ors.categories['A'].measured).toBe(true);
    expect(ors.categories['A'].score).toBe(80);
    expect(ors.categories['D'].measured).toBe(false);
    expect(ors.categories['D'].score).toBeNull();
    expect(ors.categories['D'].contribution).toBeNull();
    expect(ors.maturityLevel).toBe(3); // 80 > 60, nie > 80
  });

  test('bezpečnostná penalizácia len pri MERANEJ nízkej E', () => {
    const withE = calculateORS(
      [answer('q_a1', 'x', 80), answer('q_e1', 'x', 10)],
      [qA, qE]
    );
    // ors = (80×0.2 + 10×0.2) / 0.4 = 45; factor = 0.7 + 0.3×(10/30) = 0.8
    expect(withE.score).toBe(45);
    expect(withE.penaltyApplied).toBe(true);
    expect(withE.scorePenalized).toBe(36);

    const withoutE = calculateORS([answer('q_a1', 'x', 80)], [qA, qE]);
    expect(withoutE.penaltyApplied).toBe(false);
    expect(withoutE.scorePenalized).toBe(withoutE.score);
  });

  test('ORS smeruje podľa maps_to_score kontraktu, nie podľa category', () => {
    const riskFlagQ = makeQ({ id: 'q_b_flag', category: 'B', maps_to_score: [] }); // čisto risk-flag
    const dualQ = makeQ({ id: 'q_dual', category: 'D', maps_to_score: ['ors_D', 'ors_E'] });
    const ors = calculateORS(
      [answer('q_b_flag', 'x', 0), answer('q_dual', 'x', 60)],
      [riskFlagQ, dualQ]
    );

    // risk-flag otázka bez ors_* tagu nesmie kontaminovať B nulou
    expect(ors.categories['B'].measured).toBe(false);
    expect(ors.categories['B'].score).toBeNull();
    // duálny tag sýti obe deklarované kategórie
    expect(ors.categories['D'].score).toBe(60);
    expect(ors.categories['E'].score).toBe(60);
  });

  test('žiadna meraná kategória → null skóre aj maturita, nie falošná nula', () => {
    const ors = calculateORS(
      [answer('q_a1', 'x', 50, { isUnknown: true })],
      [qA]
    );

    expect(ors.measuredCategories).toBe(0);
    expect(ors.score).toBeNull();
    expect(ors.scorePenalized).toBeNull();
    expect(ors.maturityLevel).toBeNull();
    expect(ors.maturityLabelSk).toBeNull();
  });
});
