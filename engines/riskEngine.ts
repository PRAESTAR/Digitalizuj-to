import type { Answer, TDRIScore, RiskFactor, Question } from '@/types';
import {
  riskFactorDefinitions,
  riskLevelLabels,
  riskConfidenceMultipliers,
  riskInferenceThresholds,
  tdriMaxPenaltySum,
  scoringConfig,
} from '@/data/scoringConfig';

/**
 * Sila dôkazu o riziku. Oddelená od závažnosti, ktorá už je v `maxPenalty`.
 */
export type EvidenceStrength = 'confirmed' | 'inferred_strong' | 'inferred_moderate' | 'none';

/**
 * Pásmo rizika zo skóre. Exportované, aby prahy nežili duplicitne aj inde —
 * `recommendationEngine` a UI si ich predtým prepisovali natvrdo.
 */
export function getRiskLevel(score: number): TDRIScore['riskLevel'] {
  const [low, medium, high] = scoringConfig.riskThresholds;
  if (score <= low) return 'low';
  if (score <= medium) return 'medium';
  if (score <= high) return 'high';
  return 'critical';
}

/**
 * Calculate Technical Debt & Risk Index.
 * Independent index (0-100, higher = worse).
 *
 * Penalta faktora = maxPenalty × dôveryhodnosť dôkazu, normalizovaná na
 * súčet všetkých maxPenalty. Dve zmeny oproti pôvodnému výpočtu:
 *
 * 1. Závažnosť sa už nenásobí druhýkrát. Bola v maxPenalty aj v samostatnom
 *    severity multiplikátore, čo vyrábalo inverziu — potvrdené stredné riziko
 *    (0,6×) skórovalo nižšie než to isté riziko len odvodené z nízkeho skóre
 *    (0,8×). Zlepšenie odpovede tak vedelo index rizika zvýšiť.
 * 2. Skóre sa normalizuje na dosiahnuteľných 100. Predtým bol reálny strop
 *    ~93, takže pásmo „kritické 61–100" bolo fakticky 61–93.
 *
 * POZNÁMKA k porovnateľnosti kvízov: indikatívny kvíz nemá zdroje pre časť
 * faktorov, takže jeho TDRI je systematicky nižšie než z komplexného. Menovateľ
 * je zámerne spoločný — vlastný menovateľ pre indikatívny by síce zlepšil
 * čitateľnosť, ale rozbil by porovnateľnosť s uloženými a peer výsledkami.
 */
export function calculateTDRI(
  answers: Answer[],
  questions: Question[],
  riskFlags: Set<string>
): TDRIScore {
  const [strongBelow, moderateBelow] = riskInferenceThresholds;

  const factors: RiskFactor[] = riskFactorDefinitions.map(def => {
    const confirmed = riskFlags.has(def.id);

    // Find source answers that map to this risk
    const sourceAnswers = answers
      .filter(a => {
        const q = questions.find(q => q.id === a.questionId);
        return q && q.maps_to_risk.includes(def.id);
      })
      .map(a => a.questionId);

    let strength: EvidenceStrength = 'none';
    let evidence = '';

    if (confirmed) {
      strength = 'confirmed';
      evidence = getEvidenceForRisk(def.id);
    } else if (sourceAnswers.length > 0) {
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

      if (avgScore < strongBelow) {
        strength = 'inferred_strong';
        evidence = `Nízke skóre v súvisiacich otázkach (${Math.round(avgScore)}/100)`;
      } else if (avgScore < moderateBelow) {
        strength = 'inferred_moderate';
        evidence = `Stredné skóre v súvisiacich otázkach (${Math.round(avgScore)}/100)`;
      }
    }

    const rawPenalty = strength === 'none'
      ? 0
      : def.maxPenalty * riskConfidenceMultipliers[strength];
    // Normalizácia na spoločnú škálu 0–100 — aj per faktor, inak by gate
    // v recommendationEngine žil na inej škále než samotné skóre.
    const penalty = Math.round((rawPenalty / tdriMaxPenaltySum) * 100 * 10) / 10;

    return {
      id: def.id,
      name: def.name,
      severity: def.severity,
      maxPenalty: def.maxPenalty,
      penalty,
      active: strength !== 'none',
      confirmed,
      evidenceStrength: strength,
      evidence,
      sourceAnswers,
    };
  });

  // Math.min zostáva ako poistka pre prípad, že by sa normalizácia rozišla
  // s definíciami — pri korektných dátach je nedosiahnuteľná.
  const totalPenalty = Math.min(100, factors.reduce((sum, f) => sum + f.penalty, 0));
  const score = Math.round(totalPenalty);
  const riskLevel = getRiskLevel(score);

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

function getEvidenceForRisk(riskId: string): string {
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
    RF13: 'Nepripravenosť na povinnú e-fakturáciu od 1.1.2027',
    RF14: 'Nepripravenosť na NIS2 (zákon č. 366/2024 Z.z.)',
  };

  return evidenceMap[riskId] || 'Identifikované riziko na základe odpovedí';
}
