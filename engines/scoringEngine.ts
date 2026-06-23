import type { Answer, DIIScore, ORSScore, CategoryScore, Question } from '@/types';
import { scoringConfig, maturityLabels, diiLevelLabels, categoryNames } from '@/data/scoringConfig';

/**
 * Calculate DII-Compatible Score from answers.
 * Maps questions tagged with "dii" to a 0-100 score and 0-12 scale.
 */
export function calculateDII(
  answers: Answer[],
  questions: Question[]
): DIIScore {
  const diiAnswers = answers.filter(a => {
    const q = questions.find(q => q.id === a.questionId);
    return q && q.maps_to_score.includes('dii') && !a.isUnknown && !a.wasSkipped;
  });

  if (diiAnswers.length === 0) {
    return {
      score100: 0,
      score12: 0,
      pureBinary: 0,
      level: 'very_low',
      levelLabelSk: diiLevelLabels.very_low,
      indicators: [],
    };
  }

  const totalScore = diiAnswers.reduce((sum, a) => sum + a.score, 0);
  const score100 = totalScore / diiAnswers.length;
  const score12 = Math.round((score100 / 100) * 12);
  const pureBinary = diiAnswers.filter(a => a.score >= 50).length;

  let level: DIIScore['level'];
  if (score12 <= 3) level = 'very_low';
  else if (score12 <= 6) level = 'low';
  else if (score12 <= 9) level = 'high';
  else level = 'very_high';

  const indicators = diiAnswers.map(a => {
    const q = questions.find(q => q.id === a.questionId)!;
    return {
      id: q.id,
      name: q.dimension,
      score: a.score,
      binary: a.score >= 50,
      sourceAnswers: [a.questionId],
    };
  });

  return {
    score100: Math.round(score100 * 10) / 10,
    score12,
    pureBinary: Math.min(pureBinary, 12),
    level,
    levelLabelSk: diiLevelLabels[level],
    indicators,
  };
}

/**
 * Calculate Operational Readiness Score from answers.
 * Weighted average of 6 categories (A-F).
 */
export function calculateORS(
  answers: Answer[],
  questions: Question[]
): ORSScore {
  const categories: Record<string, CategoryScore> = {};
  const validCategories = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (const cat of validCategories) {
    const catQuestions = questions.filter(q => q.category === cat);
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

    const catScore = totalWeight > 0 ? score / totalWeight : 0;
    const unknownRatio = catQuestions.length > 0
      ? 1 - catAnswers.length / catQuestions.length
      : 1;

    let confidence: CategoryScore['confidence'];
    if (unknownRatio > scoringConfig.unknownAnswerExclusionThreshold) confidence = 'low';
    else if (unknownRatio > 0.25) confidence = 'medium';
    else confidence = 'high';

    categories[cat] = {
      name: categoryNames[cat],
      score: Math.round(catScore * 10) / 10,
      weight: scoringConfig.categoryWeights[cat],
      contribution: Math.round(catScore * scoringConfig.categoryWeights[cat] * 10) / 10,
      answeredQuestions: catAnswers.length,
      totalQuestions: catQuestions.length,
      confidence,
    };
  }

  // Weighted average
  let orsScore = 0;
  for (const cat of validCategories) {
    orsScore += categories[cat].contribution;
  }
  orsScore = Math.round(orsScore * 10) / 10;

  // Security penalty (category E)
  let penaltyApplied = false;
  let penaltyReason: string | null = null;
  let scorePenalized = orsScore;

  const securityScore = categories['E']?.score ?? 0;
  if (securityScore < scoringConfig.securityPenaltyThreshold) {
    const factor = 1 - scoringConfig.securityPenaltyMaxFactor +
      scoringConfig.securityPenaltyMaxFactor * (securityScore / scoringConfig.securityPenaltyThreshold);
    scorePenalized = Math.round(orsScore * factor * 10) / 10;
    penaltyApplied = true;
    penaltyReason = `Kritický bezpečnostný stav (E: ${securityScore}/100) — penalizácia ${Math.round((1 - factor) * 100)}%`;
  }

  // Maturity level
  const thresholds = scoringConfig.maturityThresholds;
  let maturityLevel = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (scorePenalized > thresholds[i]) maturityLevel = i + 1;
  }

  return {
    score: orsScore,
    scorePenalized,
    maturityLevel,
    maturityLabelSk: maturityLabels[maturityLevel],
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
