import { describe, expect, test } from 'vitest';
import { calculateDII, calculateORS } from './scoringEngine';
import { calculateTDRI } from './riskEngine';
import { calculateAIReadiness } from './aiReadinessEngine';
import { generateRecommendations } from './recommendationEngine';
import { getQuizQuestions, calculateAnswerScore } from './questionEngine';
import type { Answer, Question, Recommendation } from '@/types';

/**
 * Roadmapa musí byť zobraziteľná — každé ID v nej sa musí dať rozviazať.
 *
 * `components/results/Recommendations.tsx` do 7. 8. 2026 roadmapu ignoroval
 * a každá bunka si vyberala zo zoznamov sama. Dôsledok: **`riskMitigations`
 * sa počítali a nikdy nezobrazili**, a s nimi aj rozhodnutie enginu, že
 * stredné riziká idú PRED strategické iniciatívy.
 *
 * Komponent odteraz vykresľuje `roadmap` a ID rozväzuje cez mapu všetkých
 * zoznamov. Tento test stráži predpoklad, na ktorom to stojí: v roadmape
 * nesmie byť ID, ktoré v žiadnom zozname nie je — inak by položka ticho
 * zmizla, presne ako predtým.
 */

function answersFor(questions: Question[], seed: number): Answer[] {
  let s = seed;
  return questions.map((q) => {
    const opts = q.options ?? [];
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const value = q.question_type === 'multi_select'
      ? opts.filter((_, i) => ((s >> i) & 1) === 1).map(o => o.value)
      : opts[s % Math.max(1, opts.length)]?.value ?? '';
    return {
      questionId: q.id, value, score: calculateAnswerScore(q, value),
      isUnknown: false, wasSkipped: false, timestamp: '2026-08-07T00:00:00.000Z',
    };
  });
}

function recsFor(questions: Question[], seed: number) {
  const answers = answersFor(questions, seed);
  const dii = calculateDII(answers, questions);
  const ors = calculateORS(answers, questions);
  const tdri = calculateTDRI(answers, questions, new Set<string>());
  const ai = calculateAIReadiness(answers, questions);
  return generateRecommendations(answers, questions, ors, tdri, dii, ai);
}

const allOf = (r: ReturnType<typeof recsFor>): Recommendation[] => [
  ...r.criticalRisks,
  ...(r.riskMitigations ?? []),
  ...r.quickWins,
  ...r.strategicInitiatives,
  ...(r.longTermInitiatives ?? []),
];

const questions = getQuizQuestions('complex');
const SWEEP = 300;

describe('roadmapa je zobraziteľná', () => {
  test('každé ID v roadmape sa dá rozviazať na odporúčanie', () => {
    for (let seed = 0; seed < SWEEP; seed++) {
      const r = recsFor(questions, seed);
      const ids = new Set(allOf(r).map(x => x.id));
      const roadmapIds = [
        ...r.roadmap.immediate0_3m,
        ...r.roadmap.medium3_12m,
        ...r.roadmap.longTerm12mPlus,
      ];
      const orphans = roadmapIds.filter(id => !ids.has(id));
      expect(orphans, `seed ${seed}: ${orphans.join(', ')}`).toEqual([]);
    }
  });

  test('žiadna položka roadmapy sa neopakuje v dvoch horizontoch', () => {
    for (let seed = 0; seed < SWEEP; seed++) {
      const r = recsFor(questions, seed);
      const all = [
        ...r.roadmap.immediate0_3m,
        ...r.roadmap.medium3_12m,
        ...r.roadmap.longTerm12mPlus,
      ];
      expect(new Set(all).size, `seed ${seed}`).toBe(all.length);
    }
  });

  test('vygenerované riskMitigations sa v roadmape naozaj objavia', () => {
    let seen = 0;
    for (let seed = 0; seed < SWEEP; seed++) {
      const r = recsFor(questions, seed);
      const mitigations = r.riskMitigations ?? [];
      if (mitigations.length === 0) continue;
      seen++;
      // Engine ich vkladá do stredného horizontu PRED strategické iniciatívy;
      // strop 6 môže časť odrezať, ale prvé musia prejsť.
      const inMedium = mitigations.filter(m => r.roadmap.medium3_12m.includes(m.id));
      expect(inMedium.length, `seed ${seed}`).toBeGreaterThan(0);
    }
    // Keby stredné riziká nikdy nevznikli, test by nič netestoval.
    expect(seen, 'riskMitigations nevznikli ani raz').toBeGreaterThan(0);
  });

  test('stredné riziká stoja v roadmape pred strategickými iniciatívami', () => {
    for (let seed = 0; seed < SWEEP; seed++) {
      const r = recsFor(questions, seed);
      const mitigationIds = new Set((r.riskMitigations ?? []).map(x => x.id));
      const strategicIds = new Set(r.strategicInitiatives.map(x => x.id));
      const order = r.roadmap.medium3_12m;
      const lastMitigation = order.reduce((acc, id, i) => (mitigationIds.has(id) ? i : acc), -1);
      const firstStrategic = order.findIndex(id => strategicIds.has(id));
      if (lastMitigation === -1 || firstStrategic === -1) continue;
      expect(lastMitigation, `seed ${seed}`).toBeLessThan(firstStrategic);
    }
  });
});
