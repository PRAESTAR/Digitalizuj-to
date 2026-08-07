import { describe, expect, test } from 'vitest';
import { buildAuditTrail } from './auditEngine';
import { calculateDII, calculateORS } from './scoringEngine';
import { calculateTDRI } from './riskEngine';
import { calculateAIReadiness } from './aiReadinessEngine';
import { calculateBenchmarks } from './benchmarkEngine';
import { calculateBusinessImpact, extractROIInputs } from './roiEngine';
import { generateRecommendations } from './recommendationEngine';
import { getQuizQuestions, calculateAnswerScore } from './questionEngine';
import { scoringConfig } from '@/data/scoringConfig';
import type { Answer, Question, ResultSnapshot, AuditStep, SizeBand } from '@/types';

/**
 * REPLAY TEST — dôkaz tvrdenia „každé skóre je auditovateľné a spätne
 * rozložiteľné".
 *
 * To tvrdenie stojí na homepage, v metodike aj v štruktúrovaných dátach pre
 * Google. Do 6. 8. 2026 ho nič neoveroval: audit trail bola tabuľka surových
 * odpovedí, z ktorej bolo vidieť ČO respondent odpovedal, ale nie AKO z toho
 * vzniklo číslo.
 *
 * Tento test skóre PREPOČÍTA VÝHRADNE Z KROKOV TRAILU — nesiaha na engine ani
 * na banku otázok — a porovná s tým, čo engine vydal. Ak sa výpočet a jeho
 * vysvetlenie rozídu, spadne. To je rozdiel medzi doloženým a deklarovaným.
 */

function answersFor(questions: Question[], seed: number): Answer[] {
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

function resultFor(questions: Question[], answers: Answer[], sizeBand: SizeBand | null = null): ResultSnapshot {
  const dii = calculateDII(answers, questions);
  const ors = calculateORS(answers, questions, sizeBand);
  const tdri = calculateTDRI(answers, questions, new Set<string>());
  const aiReadiness = calculateAIReadiness(answers, questions);
  const roiInputs = extractROIInputs(answers, questions, ors.categories['F']?.score ?? null);
  const businessImpact = calculateBusinessImpact(answers, questions, roiInputs);
  const benchmarks = calculateBenchmarks(dii, ors, 'manufacturing', 'small', 'SK');
  const recommendations = generateRecommendations(answers, questions, ors, tdri, dii, aiReadiness);
  return {
    assessmentId: 'test',
    modelVersion: {
      questionBankVersion: 'test', scoringConfigVersion: scoringConfig.version,
      benchmarkDataVersion: 'test', diiMethodologyVersion: 'test',
      computedAt: '2026-08-06T00:00:00.000Z',
    },
    dii, ors, tdri, aiReadiness, businessImpact, benchmarks, recommendations,
  };
}

/** Vážený priemer POČÍTANÝ LEN Z KROKU — engine sa nepoužíva. */
function replayWeightedMean(step: Extract<AuditStep, { kind: 'category' | 'aggregate' }>): number | null {
  if (step.weightSum <= 0) return null;
  const sum = step.items.reduce((acc, i) => acc + i.score * i.weight, 0);
  return sum / step.weightSum;
}

const questions = getQuizQuestions('complex');
const SWEEP = 300;

/**
 * Replay beží pre OBE vetvy: bez pásma veľkosti (surové skóre) aj pre
 * mikrofirmu, kde sa uplatňujú veľkostné kotvy (SCORING_SPEC §13). Kotva
 * mení čísla vstupujúce do kategórií, takže keby ju trail nezohľadnil,
 * z rozkladu by pôvodné skóre nevyšlo — a to je presne tá trieda chyby,
 * ktorú tento test odhalil pri svojom prvom behu.
 */
describe.each([[null], ['micro']] as [SizeBand | null][])(
  'replay (pásmo: %s): skóre sa dá prepočítať výhradne z audit trailu', (band) => {
  test('každá ORS kategória sa z krokov prepočíta na svoju zobrazenú hodnotu', () => {
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersFor(questions, seed);
      const result = resultFor(questions, answers, band);
      const trail = buildAuditTrail(result, answers, questions, band);

      for (const step of trail.steps) {
        if (step.kind !== 'category') continue;
        if (!step.measured) { expect(step.displayed).toBeNull(); continue; }
        const replayed = replayWeightedMean(step);
        expect(replayed).not.toBeNull();
        // Zobrazená hodnota je zaokrúhlená na desatinu — rozdiel smie byť
        // najviac pol kroku zobrazenia (SCORING_SPEC §9.1).
        expect(Math.abs(replayed! - step.displayed!), `${step.id} @ seed ${seed}`)
          .toBeLessThanOrEqual(0.0501);
      }
    }
  });

  test('celkové ORS sa z kategóriových krokov prepočíta na zobrazenú hodnotu', () => {
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersFor(questions, seed);
      const result = resultFor(questions, answers, band);
      const trail = buildAuditTrail(result, answers, questions, band);

      const agg = trail.steps.find((s) => s.kind === 'aggregate');
      expect(agg).toBeDefined();
      const replayed = replayWeightedMean(agg as Extract<AuditStep, { kind: 'aggregate' }>);
      expect(Math.abs(replayed! - result.ors.score!), `seed ${seed}`).toBeLessThanOrEqual(0.0501);
    }
  });

  test('penalta prepočítaná z kroku dá zobrazené penalizované skóre', () => {
    let seen = 0;
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersFor(questions, seed);
      const result = resultFor(questions, answers, band);
      const trail = buildAuditTrail(result, answers, questions, band);
      const step = trail.steps.find((s) => s.kind === 'penalty');
      if (!step || step.kind !== 'penalty') continue;
      seen++;
      expect(Math.abs(step.before * step.factor - step.after), `seed ${seed}`)
        .toBeLessThanOrEqual(0.0501);
    }
    // Ak by penalta nikdy nenastala, test by nič netestoval.
    expect(seen).toBeGreaterThan(0);
  });

  test('úroveň zrelosti sa z kroku odvodí porovnaním s prahmi', () => {
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersFor(questions, seed);
      const result = resultFor(questions, answers, band);
      const trail = buildAuditTrail(result, answers, questions, band);
      const step = trail.steps.find((s) => s.kind === 'level');
      if (!step || step.kind !== 'level') continue;

      let replayed = 0;
      for (let i = 0; i < step.thresholds.length; i++) {
        if (step.value > step.thresholds[i]) replayed = i + 1;
      }
      expect(replayed, `seed ${seed}`).toBe(step.level);
    }
  });

  test('DII sa z kroku prepočíta extrapoláciou', () => {
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersFor(questions, seed);
      const result = resultFor(questions, answers, band);
      const trail = buildAuditTrail(result, answers, questions, band);
      const step = trail.steps.find((s) => s.kind === 'dii');
      if (!step || step.kind !== 'dii') continue;

      expect(Math.round((step.met / step.measuredCount) * step.total), `seed ${seed}`)
        .toBe(step.computed);
      // Počet indikátorov v kroku musí sedieť s deklarovaným celkom.
      expect(step.indicators.length).toBe(step.total);
      expect(step.indicators.filter((i) => i.status === 'met').length).toBe(step.met);
    }
  });

  test('krok kotvy nesie vlastný prepočet, ktorý sa dá overiť', () => {
    let seen = 0;
    for (let seed = 0; seed < SWEEP; seed++) {
      const answers = answersFor(questions, seed);
      const result = resultFor(questions, answers, band);
      const trail = buildAuditTrail(result, answers, questions, band);

      for (const step of trail.steps) {
        if (step.kind !== 'anchor') continue;
        seen++;
        const replayed = Math.min(step.questionMax, step.rawScore * step.factor);
        expect(Math.abs(replayed - step.adjustedScore), `${step.id} @ seed ${seed}`)
          .toBeLessThanOrEqual(0.0001);
        // Krok odpovede musí ukazovať tú istú dvojicu čísel.
        const ans = trail.steps.find(s => s.kind === 'answer' && s.id === step.id);
        expect(ans && ans.kind === 'answer' ? ans.rawScore : null).toBe(step.rawScore);
      }
    }
    // Bez pásma kotva nesmie nastať vôbec; s mikrofirmou musí.
    expect(seen === 0, `pásmo ${band}, krokov kotvy ${seen}`).toBe(band === null);
  });
});

describe('trail pokrýva všetky triedy krokov, ktoré má', () => {
  const answers = answersFor(questions, 7);
  const result = resultFor(questions, answers);
  const trail = buildAuditTrail(result, answers, questions);
  const kinds = new Set(trail.steps.map((s) => s.kind));

  test.each(['answer', 'category', 'aggregate', 'level', 'dii', 'benchmark'])(
    'obsahuje krok typu %s', (kind) => { expect(kinds.has(kind as AuditStep['kind'])).toBe(true); }
  );

  test('každá odpoveď má vlastný krok', () => {
    expect(trail.steps.filter((s) => s.kind === 'answer').length).toBe(answers.length);
  });

  test('vylúčené odpovede nesú dôvod vylúčenia', () => {
    const withUnknown = [
      { ...answers[0], isUnknown: true, score: 0 },
      { ...answers[1], wasSkipped: true, score: 0, skipReason: 'test' },
      ...answers.slice(2),
    ];
    const t = buildAuditTrail(resultFor(questions, withUnknown), withUnknown, questions);
    const steps = t.steps.filter((s) => s.kind === 'answer') as Extract<AuditStep, { kind: 'answer' }>[];
    const unknown = steps.find((s) => s.excluded === 'unknown');
    const skipped = steps.find((s) => s.excluded === 'skipped');
    expect(unknown?.excludedReasonSk).toBeTruthy();
    expect(unknown?.score).toBeNull();
    expect(skipped?.excludedReasonSk).toBe('test');
    // Vylúčená odpoveď sa nesmie objaviť medzi položkami kategórie.
    for (const step of t.steps) {
      if (step.kind !== 'category') continue;
      expect(step.items.some((i) => i.questionId === unknown?.id)).toBe(false);
      expect(step.items.some((i) => i.questionId === skipped?.id)).toBe(false);
    }
  });

  test('obmedzenia trailu sú priznané, nie zamlčané', () => {
    expect(trail.limitationsSk.length).toBeGreaterThan(0);
    expect(trail.limitationsSk.join(' ')).toContain('/r/{hash}');
  });
});
