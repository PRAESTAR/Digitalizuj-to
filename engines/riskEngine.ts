import type { Answer, TDRIScore, RiskFactor, Question } from '@/types';
import { riskFactorDefinitions, riskLevelLabels } from '@/data/scoringConfig';

/**
 * Calculate Technical Debt & Risk Index.
 * Independent index (0-100, higher = worse).
 */
export function calculateTDRI(
  answers: Answer[],
  questions: Question[],
  riskFlags: Set<string>
): TDRIScore {
  const factors: RiskFactor[] = riskFactorDefinitions.map(def => {
    const isActive = riskFlags.has(def.id);

    // Find source answers that map to this risk
    const sourceAnswers = answers
      .filter(a => {
        const q = questions.find(q => q.id === a.questionId);
        return q && q.maps_to_risk.includes(def.id);
      })
      .map(a => a.questionId);

    // Calculate penalty
    let penalty = 0;
    let evidence = '';

    if (isActive) {
      const severityMultiplier = def.severity === 'critical' ? 1.0
        : def.severity === 'high' ? 0.8
        : 0.6;
      penalty = def.maxPenalty * severityMultiplier;
      evidence = getEvidenceForRisk(def.id, answers, questions);
    } else if (sourceAnswers.length > 0) {
      // Check from answer scores — partial risk.
      // "Neviem"/preskočené odpovede nevypovedajú o riziku (skóre 0 je artefakt, nie zistenie)
      // a informačné otázky bez bodovateľných možností (všetky options score 0) sa vylučujú —
      // inak by každá odpoveď aktivovala penaltu (napr. cx_B02 → RF06 pre všetkých respondentov).
      const relevantAnswers = answers.filter(a => {
        if (!sourceAnswers.includes(a.questionId) || a.isUnknown || a.wasSkipped) return false;
        const q = questions.find(q => q.id === a.questionId);
        return !!q?.options?.some(o => o.score > 0);
      });
      const avgScore = relevantAnswers.length > 0
        ? relevantAnswers.reduce((s, a) => s + a.score, 0) / relevantAnswers.length
        : 100;

      if (avgScore < 30) {
        penalty = def.maxPenalty * 0.8;
        evidence = `Nízke skóre v súvisiacich otázkach (${Math.round(avgScore)}/100)`;
      } else if (avgScore < 60) {
        penalty = def.maxPenalty * 0.3;
        evidence = `Stredné skóre v súvisiacich otázkach (${Math.round(avgScore)}/100)`;
      }
    }

    return {
      id: def.id,
      name: def.name,
      severity: def.severity,
      maxPenalty: def.maxPenalty,
      penalty: Math.round(penalty * 10) / 10,
      active: isActive || penalty > 0,
      evidence,
      sourceAnswers,
    };
  });

  const totalPenalty = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.penalty, 0)
  );

  const score = Math.round(totalPenalty);

  let riskLevel: TDRIScore['riskLevel'];
  if (score <= 15) riskLevel = 'low';
  else if (score <= 35) riskLevel = 'medium';
  else if (score <= 60) riskLevel = 'high';
  else riskLevel = 'critical';

  const topRisks = factors
    .filter(f => f.active)
    .sort((a, b) => b.penalty - a.penalty)
    .slice(0, 5)
    .map(f => f.id);

  return {
    score,
    riskLevel,
    riskLabelSk: riskLevelLabels[riskLevel],
    factors,
    topRisks,
  };
}

function getEvidenceForRisk(
  riskId: string,
  answers: Answer[],
  questions: Question[]
): string {
  const evidenceMap: Record<string, string> = {
    RF01: 'Core systém/OS je mimo podpory (end-of-life)',
    RF02: 'Chýbajúce zálohy kritických dát',
    RF03: 'Zálohy nie sú pravidelne testované obnovou',
    RF04: 'Chýbajúci alebo ad-hoc patch management',
    RF05: 'MFA nie je nasadené na kritických systémoch',
    RF06: 'Identifikovaný single point of failure v infraštruktúre',
    RF07: 'Kritická závislosť na jednej osobe pre IT systémy',
    RF08: 'Systémy bez jasného vlastníctva alebo dokumentácie',
    RF09: 'Neexistuje BC/DR plán',
    RF10: 'Neexistuje asset inventory',
    RF11: 'Žiadne logovanie alebo monitoring systémov',
    RF12: 'Používanie aplikácií mimo podpory',
  };

  return evidenceMap[riskId] || 'Identifikované riziko na základe odpovedí';
}
