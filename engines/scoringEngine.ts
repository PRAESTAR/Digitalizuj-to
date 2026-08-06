import type { Answer, DIIScore, DIIIndicator, ORSScore, CategoryScore, Question } from '@/types';
import { scoringConfig, maturityLabels, diiLevelLabels, categoryNames } from '@/data/scoringConfig';
import { diiIndicators, excludedDiiQuestionIds, mappedDiiQuestionIds, type DiiCriterion } from '@/data/diiIndicators';

/**
 * Platná odpoveď = existuje a nie je Neviem ani preskočená. Nemerané sa
 * nikde nefabrikuje na nulu — otázka bez platnej odpovede jednoducho
 * nevstupuje do agregácie (indikátor/kategória ostáva nemeraná).
 *
 * Exportované, aby rovnakú definíciu používal aj `recommendationEngine`
 * — keby si každý engine držal vlastnú, časom sa rozídu a odporúčania by
 * sa spúšťali nad dátami, ktoré skóre považuje za nemerané.
 */
export function isValidAnswer(answers: Answer[], questionId: string): Answer | undefined {
  return validAnswer(answers, questionId);
}

function validAnswer(answers: Answer[], questionId: string): Answer | undefined {
  const a = answers.find(ans => ans.questionId === questionId);
  return a && !a.isUnknown && !a.wasSkipped ? a : undefined;
}

function criterionMet(criterion: DiiCriterion, answer: Answer): boolean {
  if ('minScore' in criterion.metWhen) {
    return answer.score >= criterion.metWhen.minScore;
  }
  const values = Array.isArray(answer.value) ? answer.value : [answer.value];
  return criterion.metWhen.anyOfValues.some(v => values.includes(v));
}

/**
 * Per-indikátorová DII agregácia podľa DII v3/2025 (Eurostat isoc_e_dii).
 *
 * Mapovanie otázok na 12 indikátorov žije v data/diiIndicators.json.
 * Indikátor je meraný, ak má aspoň jedna kritériová otázka platnú odpoveď;
 * splnený, ak ľubovoľné kritérium sedí. score12 = extrapolácia
 * round(splnené / merané × 12); score100 je jemná metrika (priemer skóre
 * platných odpovedí namapovaných otázok). Otázky s 'dii' tagom mimo v3
 * zoznamu (excludedDiiQuestionIds) do DII nevstupujú — striktný v3 režim.
 */
export function calculateDII(
  answers: Answer[],
  questions: Question[]
): DIIScore {
  const questionIds = new Set(questions.map(q => q.id));

  const indicators: DIIIndicator[] = diiIndicators.map(def => {
    const sourceQuestions: string[] = [];
    let met = false;
    for (const criterion of def.criteria) {
      if (!questionIds.has(criterion.questionId)) continue;
      const answer = validAnswer(answers, criterion.questionId);
      if (!answer) continue;
      sourceQuestions.push(criterion.questionId);
      if (criterionMet(criterion, answer)) met = true;
    }
    const measured = sourceQuestions.length > 0;
    return {
      code: def.code,
      nameSk: def.nameSk,
      status: measured ? (met ? 'met' : 'not_met') : 'unmeasured',
      sourceQuestions,
    };
  });

  const measuredIndicators = indicators.filter(i => i.status !== 'unmeasured').length;
  const metIndicators = indicators.filter(i => i.status === 'met').length;

  // Confidence z pokrytia indikátorov (nie otázok): ≥10 = high, ≥6 = medium,
  // ≥1 = low; 0 meraných = nemerané DII (žiadne skóre, žiadne percentily).
  const confidence: DIIScore['confidence'] =
    measuredIndicators >= 10 ? 'high' : measuredIndicators >= 6 ? 'medium' : 'low';

  if (measuredIndicators === 0) {
    return {
      score100: null,
      score12: null,
      measured: false,
      measuredIndicators: 0,
      metIndicators: 0,
      confidence: 'low',
      level: null,
      levelLabelSk: null,
      indicators,
    };
  }

  const score12 = Math.round((metIndicators / measuredIndicators) * 12);

  // Jemná metrika 0–100: priemer len cez platné odpovede NAMAPOVANÝCH otázok
  // (vylúčené 'dii' otázky mimo v3 sa nepriemerujú).
  const mappedAnswers = answers.filter(a => {
    if (!mappedDiiQuestionIds.has(a.questionId) || excludedDiiQuestionIds.has(a.questionId)) return false;
    if (!questionIds.has(a.questionId)) return false;
    return !a.isUnknown && !a.wasSkipped;
  });
  const score100 = mappedAnswers.length > 0
    ? Math.round((mappedAnswers.reduce((sum, a) => sum + a.score, 0) / mappedAnswers.length) * 10) / 10
    : null;

  let level: NonNullable<DIIScore['level']>;
  if (score12 <= 3) level = 'very_low';
  else if (score12 <= 6) level = 'low';
  else if (score12 <= 9) level = 'high';
  else level = 'very_high';

  return {
    score100,
    score12,
    measured: true,
    measuredIndicators,
    metIndicators,
    confidence,
    level,
    levelLabelSk: diiLevelLabels[level],
    indicators,
  };
}

/**
 * Calculate Operational Readiness Score from answers.
 *
 * Vážený priemer meraných kategórií A–F s renormalizáciou: nemeraná
 * kategória (žiadna platná odpoveď) má score null a NEVSTUPUJE do súčtu
 * ani do menovateľa váh — nezmerané nie je nula. Dôsledok: skóre vypovedá
 * o tom, čo sa meralo; pokrytie komunikuje measuredCategories + confidence.
 */
export function calculateORS(
  answers: Answer[],
  questions: Question[]
): ORSScore {
  const categories: Record<string, CategoryScore> = {};
  const validCategories = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (const cat of validCategories) {
    // Výber podľa deklarovaného kontraktu maps_to_score (ors_A…ors_F), nie
    // podľa q.category: category je organizačné pole modulu — cez neho by do
    // skóre vstupovali aj čisto risk-flag/DII otázky (cx_B02 so 6/7 nulovými
    // možnosťami, cx_B06_ecommerce) a strácali by sa deklarované sekundárne
    // príspevky duálne tagovaných otázok (napr. server age → ors_D aj ors_E).
    const catQuestions = questions.filter(q => (q.maps_to_score ?? []).includes(`ors_${cat}`));
    const catAnswers = answers.filter(a => {
      const q = catQuestions.find(q => q.id === a.questionId);
      return q && !a.isUnknown && !a.wasSkipped;
    });

    let score = 0;
    let totalWeight = 0;

    for (const ans of catAnswers) {
      const q = catQuestions.find(q => q.id === ans.questionId)!;
      score += ans.score * q.weight;
      totalWeight += q.weight;
    }

    const measured = catAnswers.length > 0 && totalWeight > 0;
    const catScore = measured ? score / totalWeight : null;
    const unknownRatio = catQuestions.length > 0
      ? 1 - catAnswers.length / catQuestions.length
      : 1;

    let confidence: CategoryScore['confidence'];
    if (unknownRatio > scoringConfig.unknownAnswerExclusionThreshold) confidence = 'low';
    else if (unknownRatio > 0.25) confidence = 'medium';
    else confidence = 'high';

    categories[cat] = {
      name: categoryNames[cat],
      score: catScore !== null ? Math.round(catScore * 10) / 10 : null,
      measured,
      weight: scoringConfig.categoryWeights[cat],
      contribution: catScore !== null
        ? Math.round(catScore * scoringConfig.categoryWeights[cat] * 10) / 10
        : null,
      answeredQuestions: catAnswers.length,
      totalQuestions: catQuestions.length,
      confidence,
    };
  }

  // Renormalizovaný vážený priemer: len merané kategórie, menovateľ = súčet
  // ich váh. (Pôvodný súčet contribution s implicitným menovateľom 1.0
  // trestal nemerané kategórie ako nulové — fantómový strop skóre.)
  const measuredCats = validCategories.filter(cat => categories[cat].measured);
  const measuredCategories = measuredCats.length;

  let orsScore: number | null = null;
  if (measuredCategories > 0) {
    let weightedSum = 0;
    let weightSum = 0;
    for (const cat of measuredCats) {
      weightedSum += (categories[cat].score as number) * categories[cat].weight;
      weightSum += categories[cat].weight;
    }
    orsScore = Math.round((weightedSum / weightSum) * 10) / 10;
  }

  // Security penalty (category E)
  let penaltyApplied = false;
  let penaltyReason: string | null = null;
  let scorePenalized = orsScore;

  // Penalizácia sa aplikuje len na MERANÚ kategóriu E — bez zodpovedaných
  // bezpečnostných otázok by sa penalizoval nezmeraný stav (E=0 by nebolo zistenie, ale artefakt).
  const securityMeasured = categories['E']?.measured ?? false;
  const securityScore = categories['E']?.score ?? null;
  if (
    orsScore !== null &&
    securityMeasured &&
    securityScore !== null &&
    securityScore < scoringConfig.securityPenaltyThreshold
  ) {
    const factor = 1 - scoringConfig.securityPenaltyMaxFactor +
      scoringConfig.securityPenaltyMaxFactor * (securityScore / scoringConfig.securityPenaltyThreshold);
    scorePenalized = Math.round(orsScore * factor * 10) / 10;
    penaltyApplied = true;
    penaltyReason = `Kritický bezpečnostný stav (E: ${securityScore}/100) — penalizácia ${Math.round((1 - factor) * 100)}%`;
  }

  // Maturity level — len pri meranom ORS
  let maturityLevel: number | null = null;
  if (scorePenalized !== null) {
    const thresholds = scoringConfig.maturityThresholds;
    maturityLevel = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (scorePenalized > thresholds[i]) maturityLevel = i + 1;
    }
  }

  return {
    score: orsScore,
    scorePenalized,
    measuredCategories,
    maturityLevel,
    maturityLabelSk: maturityLevel !== null ? maturityLabels[maturityLevel] : null,
    categories,
    penaltyApplied,
    penaltyReason,
  };
}

/**
 * Get the maturity level number (0-4) from a maturity scale answer.
 */
export function getMaturityLevel(answers: Answer[], questionId: string): number {
  const answer = answers.find(a => a.questionId === questionId);
  if (!answer || answer.isUnknown) return -1;
  const val = typeof answer.value === 'string' ? parseInt(answer.value) : -1;
  return isNaN(val) ? -1 : val;
}
