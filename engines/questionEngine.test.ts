import { describe, expect, test } from 'vitest';
import { evaluateBranching, getProgress } from './questionEngine';
import { calculateORS } from './scoringEngine';
import type { Answer, Question, BranchingRule } from '@/types';

function q(partial: Partial<Question> & { id: string }): Question {
  return {
    category: 'D',
    dimension: 'test',
    weight: 1,
    maps_to_score: ['ors_D'],
    allow_unknown: true,
    branching_rules: [],
    evidence_type: 'self_reported',
    maps_to_risk: [],
    maps_to_roi_model: [],
    question_sk: 'test',
    question_type: 'single_choice',
    options: [
      { value: 'yes', label: 'áno', score: 100 },
      { value: 'no', label: 'nie', score: 0 },
    ],
    ...partial,
  } as unknown as Question;
}

function answer(questionId: string, value: string | string[], flags?: Partial<Answer>): Answer {
  return {
    questionId, value, score: 0, isUnknown: false, wasSkipped: false,
    timestamp: '2026-08-05T00:00:00.000Z', ...flags,
  };
}

const rule = (extra: Partial<BranchingRule> = {}): BranchingRule => ({
  condition: "value == 'no'",
  action: 'skip',
  target: 'q_next',
  reason: 'nemá zmysel bez predchádzajúcej',
  ...extra,
});

describe('evaluateBranching — politika pri „Neviem"', () => {
  test('bez on_unknown sa pravidlo pri Neviem neuplatní (doterajšie správanie)', () => {
    const r = evaluateBranching(q({ id: 'q1', branching_rules: [rule()] }), answer('q1', '', { isUnknown: true }));
    expect(r.skip).toEqual([]);
  });

  test('on_unknown: apply preskočí nadväzujúcu otázku', () => {
    const r = evaluateBranching(
      q({ id: 'q1', branching_rules: [rule({ on_unknown: 'apply' })] }),
      answer('q1', '', { isUnknown: true })
    );
    expect(r.skip.map(s => s.target)).toEqual(['q_next']);
  });

  test('riziko sa pri Neviem nepriznáva ani s apply — nevedomosť nie je dôkaz', () => {
    const r = evaluateBranching(
      q({ id: 'q1', branching_rules: [rule({ action: 'flag_risk', target: 'RF02', on_unknown: 'apply' })] }),
      answer('q1', '', { isUnknown: true })
    );
    expect(r.riskFlags).toEqual([]);
  });

  test('bežná odpoveď funguje ako doteraz a nesie dôvod skipu', () => {
    const r = evaluateBranching(q({ id: 'q1', branching_rules: [rule()] }), answer('q1', 'no'));
    expect(r.skip).toEqual([{ target: 'q_next', reason: 'nemá zmysel bez predchádzajúcej' }]);
  });
});

describe('getProgress — preskočené sa nerátajú ako zodpovedané', () => {
  test('syntetická odpoveď za preskočenú otázku neposúva ukazovateľ', () => {
    const questions = [q({ id: 'a' }), q({ id: 'b' }), q({ id: 'c' })];
    const answers = [answer('a', 'yes'), answer('b', '', { wasSkipped: true })];
    const p = getProgress(questions, answers, new Set(['b']));
    expect(p.current).toBe(1);
    expect(p.total).toBe(2); // preskočená vypadla aj z menovateľa
    expect(p.percentage).toBe(50);
  });
});

describe('unknownRatio — spoľahlivosť z položených otázok', () => {
  const questions = [
    q({ id: 'd1', category: 'D' }), q({ id: 'd2', category: 'D' }),
    q({ id: 'd3', category: 'D' }), q({ id: 'd4', category: 'D' }),
  ];

  test('odpovedané na všetko položené = vysoká spoľahlivosť aj pri vetvení', () => {
    // Dve otázky zodpovedané, dve preskočené vetvením — respondent nič nezanedbal.
    const answers = [
      answer('d1', 'yes', { score: 100 }), answer('d2', 'yes', { score: 100 }),
      answer('d3', '', { wasSkipped: true }), answer('d4', '', { wasSkipped: true }),
    ];
    const ors = calculateORS(answers, questions);
    expect(ors.categories['D'].confidence).toBe('high');
  });

  test('„Neviem" spoľahlivosť znižuje', () => {
    const answers = [
      answer('d1', 'yes', { score: 100 }),
      answer('d2', '', { isUnknown: true }),
      answer('d3', '', { isUnknown: true }),
      answer('d4', '', { isUnknown: true }),
    ];
    const ors = calculateORS(answers, questions);
    expect(ors.categories['D'].confidence).toBe('low');
  });
});
