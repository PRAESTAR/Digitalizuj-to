import type { Answer, Question, AIReadinessScore } from '@/types';
import { aiReadinessThresholds, aiReadinessLabels, scoringConfig } from '@/data/scoringConfig';

/**
 * Calculate the AI & Automatizácia Readiness index.
 *
 * Architecturally mirrors TDRI: an independent cross-cutting index computed
 * from questions tagged 'ai_readiness' (spread across categories A, F and
 * the DII layer), NOT one of the 6 ODRM maturity categories — the radar
 * chart and benchmark data are unaffected.
 *
 * Unmeasured state (no answered ai_readiness questions) returns score: null
 * rather than 0, so an unmeasured firm isn't shown as "no AI usage".
 */
export function calculateAIReadiness(
  answers: Answer[],
  questions: Question[]
): AIReadinessScore {
  const aiQuestions = questions.filter(q => q.maps_to_score.includes('ai_readiness'));
  const aiAnswers = answers.filter(a => {
    const q = aiQuestions.find(q => q.id === a.questionId);
    return q && !a.isUnknown && !a.wasSkipped;
  });

  if (aiAnswers.length === 0) {
    return {
      score: null,
      measured: false,
      level: 'ziadna',
      levelLabelSk: aiReadinessLabels.ziadna,
      confidence: 'low',
      answeredQuestions: 0,
      totalQuestions: aiQuestions.length,
    };
  }

  let weighted = 0;
  let totalWeight = 0;
  for (const a of aiAnswers) {
    const q = aiQuestions.find(q => q.id === a.questionId)!;
    weighted += a.score * q.weight;
    totalWeight += q.weight;
  }
  const score = totalWeight > 0 ? Math.round((weighted / totalWeight) * 10) / 10 : 0;

  const [t1, t2, t3] = aiReadinessThresholds;
  let level: AIReadinessScore['level'];
  if (score <= t1) level = 'ziadna';
  else if (score <= t2) level = 'experimentalna';
  else if (score <= t3) level = 'pokrocila';
  else level = 'strategicka';

  const confidence: AIReadinessScore['confidence'] =
    aiAnswers.length >= aiQuestions.length
      ? 'high'
      : aiAnswers.length >= scoringConfig.aiConfidenceMinAnswers ? 'medium' : 'low';

  return {
    score,
    measured: true,
    level,
    levelLabelSk: aiReadinessLabels[level],
    confidence,
    answeredQuestions: aiAnswers.length,
    totalQuestions: aiQuestions.length,
  };
}
