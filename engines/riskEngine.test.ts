import { describe, expect, test } from 'vitest';
import { calculateTDRI, getRiskLevel } from './riskEngine';
import {
  riskFactorDefinitions,
  riskConfidenceMultipliers,
  tdriMaxPenaltySum,
  scoringConfig,
} from '@/data/scoringConfig';
import type { Answer, Question } from '@/types';

function makeQ(id: string, riskIds: string[], scores: number[] = [0, 50, 100]): Question {
  return {
    id,
    category: 'E',
    dimension: 'test',
    weight: 1,
    maps_to_score: ['ors_E'],
    allow_unknown: true,
    branching_rules: [],
    evidence_type: 'self_reported',
    maps_to_risk: riskIds,
    maps_to_roi_model: [],
    question_sk: 'test',
    question_type: 'single_choice',
    options: scores.map((s, i) => ({ value: `v${i}`, label: `o${i}`, score: s })),
  } as unknown as Question;
}

function answer(questionId: string, score: number, flags?: Partial<Answer>): Answer {
  return {
    questionId,
    value: 'v0',
    score,
    isUnknown: false,
    wasSkipped: false,
    timestamp: '2026-08-05T00:00:00.000Z',
    ...flags,
  };
}

describe('calculateTDRI — sila dôkazu vs. závažnosť', () => {
  test('potvrdené riziko váži viac než odvodené — pre KAŽDÝ faktor', () => {
    // Toto je regresia na inverziu, ktorá v modeli reálne bola: závažnosť sa
    // násobila dvakrát, takže potvrdené stredné riziko (0,6×) skórovalo nižšie
    // než to isté riziko len odvodené z nízkeho skóre (0,8×).
    for (const def of riskFactorDefinitions) {
      const q = makeQ(`q_${def.id}`, [def.id]);
      const questions = [q];

      const confirmed = calculateTDRI([answer(q.id, 100)], questions, new Set([def.id]));
      const inferredStrong = calculateTDRI([answer(q.id, 10)], questions, new Set());
      const inferredModerate = calculateTDRI([answer(q.id, 45)], questions, new Set());

      const p = (r: ReturnType<typeof calculateTDRI>) =>
        r.factors.find(f => f.id === def.id)!.penalty;

      expect(p(confirmed), `${def.id} (${def.severity}): potvrdené vs odvodené-silné`)
        .toBeGreaterThan(p(inferredStrong));
      expect(p(inferredStrong), `${def.id}: odvodené-silné vs odvodené-stredné`)
        .toBeGreaterThan(p(inferredModerate));
      expect(p(inferredModerate), `${def.id}: odvodené-stredné musí byť kladné`).toBeGreaterThan(0);
    }
  });

  test('zlepšenie odpovede nikdy nezvýši index rizika', () => {
    // Konkrétny prípad, ktorý pôvodný model porušoval: RF10 potvrdené (2,4)
    // vychádzalo NIŽŠIE než RF10 len odvodené z nízkeho skóre (3,2).
    const q = makeQ('q_rf10', ['RF10']);
    const horsia = calculateTDRI([answer(q.id, 0)], [q], new Set(['RF10']));
    const lepsia = calculateTDRI([answer(q.id, 100)], [q], new Set());
    expect(horsia.score).toBeGreaterThanOrEqual(lepsia.score);
    expect(lepsia.score).toBe(0);
  });

  test('nezodpovedané ani Neviem neaktivuje riziko', () => {
    const q = makeQ('q_rf05', ['RF05']);
    const unknown = calculateTDRI([answer(q.id, 0, { isUnknown: true })], [q], new Set());
    expect(unknown.factors.find(f => f.id === 'RF05')!.active).toBe(false);
    expect(unknown.score).toBe(0);
  });
});

describe('calculateTDRI — normalizovaná škála', () => {
  test('100 je dosiahnuteľných, keď sú potvrdené všetky faktory', () => {
    const questions = riskFactorDefinitions.map(d => makeQ(`q_${d.id}`, [d.id]));
    const answers = questions.map(q => answer(q.id, 0));
    const all = calculateTDRI(answers, questions, new Set(riskFactorDefinitions.map(d => d.id)));
    expect(all.score).toBe(100);
    expect(all.riskLevel).toBe('critical');
  });

  test('penalta faktora je na rovnakej škále ako skóre', () => {
    // Gate pre odporúčania porovnáva penaltu so skóre — musia byť súmerateľné.
    const def = riskFactorDefinitions.find(d => d.id === 'RF01')!;
    const q = makeQ('q_rf01', ['RF01']);
    const r = calculateTDRI([answer(q.id, 0)], [q], new Set(['RF01']));
    const expected =
      Math.round(((def.maxPenalty * riskConfidenceMultipliers.confirmed) / tdriMaxPenaltySum) * 100 * 10) / 10;
    expect(r.factors.find(f => f.id === 'RF01')!.penalty).toBe(expected);
    expect(r.score).toBe(Math.round(expected));
  });

  test('bez rizík je skóre 0 a pásmo low', () => {
    const r = calculateTDRI([], [], new Set());
    expect(r.score).toBe(0);
    expect(r.riskLevel).toBe('low');
  });
});

describe('getRiskLevel — prahy z konfigurácie', () => {
  test('pásma sedia na scoringConfig.riskThresholds', () => {
    const [low, medium, high] = scoringConfig.riskThresholds;
    expect(getRiskLevel(low)).toBe('low');
    expect(getRiskLevel(low + 1)).toBe('medium');
    expect(getRiskLevel(medium)).toBe('medium');
    expect(getRiskLevel(medium + 1)).toBe('high');
    expect(getRiskLevel(high)).toBe('high');
    expect(getRiskLevel(high + 1)).toBe('critical');
  });
});

describe('assessment audit — stav dôkazu je vo výstupe', () => {
  test('faktor nesie confirmed aj evidenceStrength', () => {
    const q = makeQ('q_rf02', ['RF02']);
    const confirmed = calculateTDRI([answer(q.id, 0)], [q], new Set(['RF02']));
    const inferred = calculateTDRI([answer(q.id, 10)], [q], new Set());

    const c = confirmed.factors.find(f => f.id === 'RF02')!;
    expect(c.confirmed).toBe(true);
    expect(c.evidenceStrength).toBe('confirmed');

    const i = inferred.factors.find(f => f.id === 'RF02')!;
    expect(i.confirmed).toBe(false);
    expect(i.evidenceStrength).toBe('inferred_strong');
  });
});
