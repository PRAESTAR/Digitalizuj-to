import { describe, expect, test } from 'vitest';
import { generateRecommendations } from './recommendationEngine';
import { riskRecommendations } from '@/data/riskRecommendations';
import { riskFactorDefinitions } from '@/data/scoringConfig';
import type {
  Answer, Question, ORSScore, TDRIScore, DIIScore, CategoryScore, RiskFactor,
} from '@/types';

function cat(score: number | null): CategoryScore {
  return {
    name: 'test', score, measured: score !== null, weight: 0.2,
    contribution: score, answeredQuestions: score === null ? 0 : 3,
    totalQuestions: 3, confidence: 'high',
  };
}

function ors(scores: Partial<Record<string, number | null>>, total = 45): ORSScore {
  const categories: Record<string, CategoryScore> = {};
  for (const k of ['A', 'B', 'C', 'D', 'E', 'F']) categories[k] = cat(scores[k] ?? null);
  return {
    score: total, scorePenalized: total, measuredCategories: 6,
    maturityLevel: 2, maturityLabelSk: 'Rozvíjajúci sa',
    categories, penaltyApplied: false, penaltyReason: null,
  };
}

function factor(id: string, penalty: number, severity: RiskFactor['severity'] = 'critical'): RiskFactor {
  return {
    id, name: `faktor ${id}`, severity,
    maxPenalty: riskFactorDefinitions.find(d => d.id === id)?.maxPenalty ?? 10,
    penalty, active: penalty > 0, confirmed: true, evidenceStrength: 'confirmed',
    evidence: '', sourceAnswers: [],
  };
}

function tdri(factors: RiskFactor[], score = 40): TDRIScore {
  return { score, riskLevel: 'high', riskLabelSk: 'x', factors, topRisks: factors.map(f => f.id) };
}

const noDii = { measured: false, score100: null, score12: null } as DIIScore;

function answer(questionId: string, value: string | string[], flags?: Partial<Answer>): Answer {
  return {
    questionId, value, score: 50, isUnknown: false, wasSkipped: false,
    timestamp: '2026-08-05T00:00:00.000Z', ...flags,
  };
}

function sizeQuestion(id = 'cx_02'): Question {
  return {
    id, category: 'meta', dimension: 'size', weight: 0,
    maps_to_score: ['benchmark_size'], allow_unknown: false, branching_rules: [],
    evidence_type: 'self_reported', maps_to_risk: [], maps_to_roi_model: [],
    question_sk: 'Veľkosť?', question_type: 'single_choice',
  } as unknown as Question;
}

const ids = (rs: { id: string }[]) => rs.map(r => r.id);

describe('answer-level a firmografické podmienky', () => {
  test('ERP sa neodporúča mikrofirme, ale odporúča sa malej', () => {
    const o = ors({ A: 30 });
    const micro = generateRecommendations(
      [answer('cx_02', 'micro')], [sizeQuestion()], o, tdri([]), noDii
    );
    expect(ids(micro.strategicInitiatives)).not.toContain('rec_str_erp');

    const small = generateRecommendations(
      [answer('cx_02', 'small')], [sizeQuestion()], o, tdri([]), noDii
    );
    expect(ids(small.strategicInitiatives)).toContain('rec_str_erp');
  });

  test('neznáma veľkosť bránu neotvorí — nemerané nie je splnené', () => {
    const r = generateRecommendations([], [sizeQuestion()], ors({ A: 30 }), tdri([]), noDii);
    expect(ids(r.strategicInitiatives)).not.toContain('rec_str_erp');
  });

  test('„Neviem" sa nesmie počítať ako odpoveď', () => {
    const r = generateRecommendations(
      [answer('cx_02', 'large', { isUnknown: true })],
      [sizeQuestion()], ors({ A: 30 }), tdri([]), noDii
    );
    expect(ids(r.strategicInitiatives)).not.toContain('rec_str_erp');
  });

  test('migrácia do cloudu len firme, ktorá v cloude nie je', () => {
    const o = ors({ D: 30 });
    const onprem = generateRecommendations([answer('cx_D02', 'onprem')], [], o, tdri([]), noDii);
    expect(ids(onprem.strategicInitiatives)).toContain('rec_str_cloud_migration');

    const hybrid = generateRecommendations([answer('cx_D02', 'hybrid')], [], o, tdri([]), noDii);
    expect(ids(hybrid.strategicInitiatives)).not.toContain('rec_str_cloud_migration');
  });
});

describe('mŕtve pásma skóre', () => {
  test('kategória D už generuje odporúčanie', () => {
    const r = generateRecommendations(
      [answer('cx_D06', 'no'), answer('cx_D02', 'onprem')], [], ors({ D: 25 }), tdri([]), noDii
    );
    expect(ids(r.quickWins)).toContain('rec_qw_remote_access');
    expect(ids(r.strategicInitiatives)).toContain('rec_str_cloud_migration');
  });

  test('kategória C v pásme 30–49 už nie je bez odporúčania', () => {
    const r = generateRecommendations(
      [answer('cx_02', 'medium')], [sizeQuestion()], ors({ C: 40 }), tdri([]), noDii
    );
    // quick win má prah 30, takže tu nepadne — nastúpi strategické
    expect(ids(r.quickWins)).not.toContain('rec_qw_reporting');
    expect(ids(r.strategicInitiatives)).toContain('rec_str_bi');
  });
});

describe('regulačný kontext', () => {
  test('e-fakturácia sa odporučí bez ohľadu na skóre kategórie', () => {
    const r = generateRecommendations([answer('cx_DII02b', 'pdf')], [], ors({}), tdri([]), noDii);
    const rec = r.quickWins.find(x => x.id === 'rec_qw_einvoicing_2027');
    expect(rec).toBeDefined();
    expect(rec!.descriptionSk).toContain('1. 1. 2027');
  });

  test('firme s automatizovanou fakturáciou sa neodporučí', () => {
    const r = generateRecommendations([answer('cx_DII02b', 'full_auto')], [], ors({}), tdri([]), noDii);
    expect(ids(r.quickWins)).not.toContain('rec_qw_einvoicing_2027');
  });

  test('žiadne nedoložiteľné štatistiky v textoch', () => {
    const r = generateRecommendations(
      [], [], ors({ A: 20, B: 20, C: 20, D: 20, E: 20, F: 20 }),
      tdri([factor('RF05', 9)]), noDii
    );
    const texty = [...r.quickWins, ...r.criticalRisks, ...r.strategicInitiatives]
      .flatMap(x => [x.descriptionSk, x.expectedOutcome ?? '']).join(' ');
    expect(texty).not.toMatch(/93 ?%/);
    expect(texty).not.toMatch(/80 ?% ?redukc/i);
  });
});

describe('priorityScore', () => {
  test('počíta sa z urgency × impact / effort', () => {
    const r = generateRecommendations([], [], ors({ E: 20 }), tdri([]), noDii);
    const qw = r.quickWins.find(x => x.id === 'rec_qw_security_basics')!;
    expect(qw.priorityScore).toBe((qw.urgency * qw.impact) / qw.effort);
  });

  test('platí pre každé vygenerované odporúčanie', () => {
    const r = generateRecommendations(
      [answer('cx_02', 'large'), answer('cx_D06', 'no'), answer('cx_D02', 'onprem')],
      [sizeQuestion()],
      ors({ A: 20, B: 20, C: 20, D: 20, E: 20, F: 20 }),
      tdri([factor('RF01', 9)]), noDii
    );
    for (const rec of [...r.criticalRisks, ...r.quickWins, ...r.strategicInitiatives, ...r.longTermInitiatives]) {
      expect(rec.priorityScore, rec.id).toBeCloseTo((rec.urgency * rec.impact) / rec.effort, 1);
    }
  });
});

describe('stredné riziká', () => {
  test('dostanú sa do odporúčaní s horizontom 3–12 mesiacov', () => {
    // Penalta pod prahom pre okamžité, nad prahom pre stredné.
    const r = generateRecommendations([], [], ors({}), tdri([factor('RF10', 3.6, 'medium')]), noDii);
    expect(ids(r.riskMitigations ?? [])).toContain('rec_risk_RF10');
    expect(r.riskMitigations![0].horizon).toBe('3-12 mesiacov');
    expect(r.roadmap.medium3_12m).toContain('rec_risk_RF10');
    // a nesmú spadnúť medzi kritické
    expect(ids(r.criticalRisks)).not.toContain('rec_risk_RF10');
  });

  test('faktor pod oboma prahmi negeneruje nič', () => {
    const r = generateRecommendations([], [], ors({}), tdri([factor('RF10', 1, 'medium')]), noDii);
    expect(r.riskMitigations).toEqual([]);
    expect(r.criticalRisks).toEqual([]);
  });
});

describe('duplicity a závislosti', () => {
  test('bezpečnostný quick win sa potlačí, keď to isté hovorí konkrétne riziko', () => {
    const bezRizika = generateRecommendations([], [], ors({ E: 20 }), tdri([]), noDii);
    expect(ids(bezRizika.quickWins)).toContain('rec_qw_security_basics');

    const sRizikom = generateRecommendations([], [], ors({ E: 20 }), tdri([factor('RF05', 9)]), noDii);
    expect(ids(sRizikom.quickWins)).not.toContain('rec_qw_security_basics');
    expect(ids(sRizikom.criticalRisks)).toContain('rec_risk_RF05');
  });

  test('test obnovy sa neodporúča firme, ktorá nemá zálohy', () => {
    const r = generateRecommendations(
      [], [], ors({}), tdri([factor('RF02', 13), factor('RF03', 7, 'high')]), noDii
    );
    expect(ids(r.criticalRisks)).toContain('rec_risk_RF02');
    expect(ids(r.criticalRisks)).not.toContain('rec_risk_RF03');
  });

  test('bez chýbajúcich záloh sa test obnovy odporučí', () => {
    const r = generateRecommendations([], [], ors({}), tdri([factor('RF03', 7, 'high')]), noDii);
    expect(ids(r.criticalRisks)).toContain('rec_risk_RF03');
  });
});

describe('riziká majú vlastnú kategóriu a poradie', () => {
  test('kategória ide zo šablóny, nie natvrdo E', () => {
    const r = generateRecommendations([], [], ors({}), tdri([factor('RF01', 13), factor('RF07', 7, 'high')]), noDii);
    expect(r.criticalRisks.find(x => x.triggeredBy.includes('RF01'))!.category).toBe('D');
    expect(r.criticalRisks.find(x => x.triggeredBy.includes('RF07'))!.category).toBe('F');
  });

  test('kritické riziko je pred vysokým aj pri nižšej priorite', () => {
    // RF01 (critical) má prioritu 6,3; RF03 (high) má 16 — bez radenia podľa
    // závažnosti by menej závažné vyskočilo pred kritické.
    const r = generateRecommendations([], [], ors({}), tdri([factor('RF03', 7, 'high'), factor('RF01', 13, 'critical')]), noDii);
    expect(r.criticalRisks[0].triggeredBy).toContain('RF01');
  });

  test('každý faktor v šablónach má kompletné polia', () => {
    for (const [id, t] of Object.entries(riskRecommendations)) {
      expect(t.category, id).toMatch(/^[A-F]$/);
      expect(t.title.length, id).toBeGreaterThan(5);
      expect(t.urgency, id).toBeGreaterThan(0);
      expect(t.effort, id).toBeGreaterThan(0);
    }
  });
});
