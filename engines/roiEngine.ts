import type { Answer, BusinessImpact, CalculationAuditEntry, Question } from '@/types';
import {
  hourlyCostMap,
  processBenchmarks,
  manualShareFromMaturity,
} from '@/data/scoringConfig';

interface ROIInputs {
  employeeCountBand: string;
  hourlyCostBand: string;
  maturityLevel: number;
  manualProcesses: string[];
  invoicingVolumeBand: string;
  adminHeadcountBand: string;
  categoryScoreF: number;
}

export function calculateBusinessImpact(
  answers: Answer[],
  questions: Question[],
  inputs: ROIInputs
): BusinessImpact {
  const hourlyCost = hourlyCostMap[inputs.hourlyCostBand] || hourlyCostMap.medium;
  const manualShare = manualShareFromMaturity[inputs.maturityLevel] ?? 0.65;
  const sizeBand = inputs.employeeCountBand || 'small';

  const auditEntries: CalculationAuditEntry[] = [];
  let totalSavedHours = 0;
  let totalErrorCostHours = 0;
  let totalErrorsPreventable = 0;
  let selfReportedCount = 0;
  let totalInputs = 0;

  // Calculate per-process savings (including error cost model)
  const relevantProcesses = getRelevantProcesses(inputs.manualProcesses, answers);

  for (const proc of relevantProcesses) {
    const benchmark = processBenchmarks[proc];
    if (!benchmark) continue;

    const freqMonthly = benchmark.frequencyPerMonth[sizeBand] || benchmark.frequencyPerMonth.small;
    const freqYearly = freqMonthly * 12;
    const timePerCaseH = benchmark.timePerUnitMinutes / 60;
    const automatableShare = benchmark.automatableShare;

    const savedHours = freqYearly * timePerCaseH * manualShare * automatableShare;
    totalSavedHours += savedHours;

    // Error cost model: errors + rework time that automation prevents
    const errorsPerYear = freqYearly * benchmark.errorRate * manualShare;
    const reworkHoursPerYear = errorsPerYear * (benchmark.reworkMinutesPerError / 60);
    const preventableErrors = errorsPerYear * automatableShare;
    totalErrorCostHours += reworkHoursPerYear * automatableShare;
    totalErrorsPreventable += preventableErrors;

    const isFromAnswer = inputs.manualProcesses.includes(proc);
    totalInputs++;
    if (isFromAnswer) selfReportedCount++;

    auditEntries.push({
      process: proc,
      frequencyYearly: freqYearly,
      timePerCaseH: Math.round(timePerCaseH * 100) / 100,
      manualShare,
      automatableShare,
      savedHours: Math.round(savedHours),
      errorCostHours: Math.round(reworkHoursPerYear * automatableShare * 10) / 10,
      dataSource: isFromAnswer ? 'mix (process: self-reported, volumes: benchmark)' : 'benchmark',
    });
  }

  // If no specific processes, estimate from general maturity
  if (relevantProcesses.length === 0) {
    const defaultProcs = ['invoicing', 'reporting', 'approval_workflows'];
    for (const proc of defaultProcs) {
      const benchmark = processBenchmarks[proc];
      if (!benchmark) continue;

      const freqMonthly = benchmark.frequencyPerMonth[sizeBand] || benchmark.frequencyPerMonth.small;
      const freqYearly = freqMonthly * 12;
      const timePerCaseH = benchmark.timePerUnitMinutes / 60;
      const automatableShare = benchmark.automatableShare;
      const savedHours = freqYearly * timePerCaseH * manualShare * automatableShare;
      totalSavedHours += savedHours;

      const errorsPerYear = freqYearly * benchmark.errorRate * manualShare;
      const reworkHoursPerYear = errorsPerYear * (benchmark.reworkMinutesPerError / 60);
      totalErrorCostHours += reworkHoursPerYear * automatableShare;
      totalErrorsPreventable += errorsPerYear * automatableShare;

      auditEntries.push({
        process: proc,
        frequencyYearly: freqYearly,
        timePerCaseH: Math.round(timePerCaseH * 100) / 100,
        manualShare,
        automatableShare,
        savedHours: Math.round(savedHours),
        errorCostHours: Math.round(reworkHoursPerYear * automatableShare * 10) / 10,
        dataSource: 'benchmark (žiadne self-reported dáta o procesoch)',
      });
    }
  }

  // Scenarios with realization rates (applied to both time savings and error cost reduction)
  const conservativeRate = 0.40;
  const midRate = 0.65;
  const optimisticRate = 0.85;

  const hoursConservative = Math.round(totalSavedHours * conservativeRate);
  const hoursMid = Math.round(totalSavedHours * midRate);
  const hoursOptimistic = Math.round(totalSavedHours * optimisticRate);

  const errorHoursConservative = Math.round(totalErrorCostHours * conservativeRate);
  const errorHoursMid = Math.round(totalErrorCostHours * midRate);
  const errorHoursOptimistic = Math.round(totalErrorCostHours * optimisticRate);

  // Confidence
  const dataCompleteness = totalInputs > 0 ? selfReportedCount / totalInputs : 0;
  const confidence = Math.round(
    (dataCompleteness * 0.8 + (1 - dataCompleteness) * 0.3) * 100
  ) / 100;

  let confidenceLabel: string;
  if (confidence >= 0.7) confidenceLabel = 'Vysoká — prevažne self-reported dáta';
  else if (confidence >= 0.4) confidenceLabel = 'Stredná — čiastočne self-reported, čiastočne benchmark';
  else confidenceLabel = 'Nízka — prevažne benchmarkové odhady';

  // Risk reduction
  const currentRiskLevel = inputs.maturityLevel <= 1 ? 'vysoké' : inputs.maturityLevel <= 2 ? 'stredné' : 'nízke';
  const potentialRiskLevel = 'nízke';
  const mitigations = generateMitigations(answers, questions);

  // Opportunity gap
  const gapPercentage = Math.max(0, Math.round((1 - inputs.maturityLevel / 4) * 100));

  // Governance adjustment for displayed scenario
  const governanceNote = inputs.categoryScoreF < 50
    ? 'Nízka organizačná pripravenosť znižuje pravdepodobnosť realizácie plného potenciálu.'
    : '';

  const disclaimers = [
    'Odhad je založený na kombinácii self-reported dát a sektorových benchmarkov.',
    'Reálny dopad závisí od kvality implementácie a organizačnej pripravenosti.',
    `Hodinová cena práce: ${hourlyCost} €/hod (${inputs.hourlyCostBand === 'medium' ? 'benchmark hodnota' : 'z odpovede'}).`,
    'Konzervatívny scenár predpokladá 40% realizáciu identifikovaného potenciálu.',
    'Odhad chýb a reworku vychádza zo sektorových benchmarkov chybovosti procesov.',
  ];
  if (governanceNote) disclaimers.push(governanceNote);

  // Total financial impact = time savings + error cost reduction
  const totalConservative = (hoursConservative + errorHoursConservative) * hourlyCost;
  const totalMid = (hoursMid + errorHoursMid) * hourlyCost;
  const totalOptimistic = (hoursOptimistic + errorHoursOptimistic) * hourlyCost;

  return {
    timeSavings: {
      hoursPerYear: {
        conservative: hoursConservative,
        mid: hoursMid,
        optimistic: hoursOptimistic,
      },
      mdPerYear: {
        conservative: Math.round(hoursConservative / 8 * 10) / 10,
        mid: Math.round(hoursMid / 8 * 10) / 10,
        optimistic: Math.round(hoursOptimistic / 8 * 10) / 10,
      },
    },
    errorCostReduction: {
      errorsPreventedPerYear: Math.round(totalErrorsPreventable),
      reworkHoursSaved: {
        conservative: errorHoursConservative,
        mid: errorHoursMid,
        optimistic: errorHoursOptimistic,
      },
      eurSaved: {
        conservative: errorHoursConservative * hourlyCost,
        mid: errorHoursMid * hourlyCost,
        optimistic: errorHoursOptimistic * hourlyCost,
      },
    },
    financialImpact: {
      eurPerYear: {
        conservative: totalConservative,
        mid: totalMid,
        optimistic: totalOptimistic,
      },
      confidence,
      confidenceLabelSk: confidenceLabel,
    },
    riskReduction: {
      currentLevel: currentRiskLevel,
      potentialLevel: potentialRiskLevel,
      keyMitigations: mitigations,
    },
    opportunityGap: {
      descriptionSk: `Firma využíva približne ${100 - gapPercentage}% svojho digitalizačného potenciálu.`,
      gapPercentage,
      benchmarkComparisonSk: gapPercentage > 30
        ? 'Výrazný priestor na zlepšenie oproti priemeru'
        : gapPercentage > 15
        ? 'Mierny priestor na zlepšenie'
        : 'Blízko optimálneho stavu',
    },
    disclaimers,
    calculationAudit: auditEntries,
  };
}

function getRelevantProcesses(manualProcesses: string[], answers: Answer[]): string[] {
  if (manualProcesses.length > 0) {
    return manualProcesses.filter(p => processBenchmarks[p]);
  }
  return [];
}

function generateMitigations(answers: Answer[], questions: Question[]): string[] {
  const mitigations: string[] = [];

  for (const ans of answers) {
    const q = questions.find(q => q.id === ans.questionId);
    if (!q) continue;

    if (q.maps_to_risk.includes('RF05') && ans.score < 50) {
      mitigations.push('Nasadenie MFA zníži riziko neoprávneného prístupu');
    }
    if (q.maps_to_risk.includes('RF02') && ans.score < 50) {
      mitigations.push('Implementácia záloh zníži riziko dátovej straty');
    }
    if (q.maps_to_risk.includes('RF04') && ans.score < 50) {
      mitigations.push('Pravidelný patching zníži riziko bezpečnostných incidentov');
    }
    if (q.maps_to_risk.includes('RF09') && ans.score < 50) {
      mitigations.push('BC/DR plán zabezpečí kontinuitu prevádzky');
    }
  }

  return [...new Set(mitigations)].slice(0, 5);
}

/**
 * Extract ROI inputs from answers.
 */
export function extractROIInputs(
  answers: Answer[],
  questions: Question[],
  categoryScoreF: number
): ROIInputs {
  const getAnswerValue = (qId: string): string => {
    const ans = answers.find(a => a.questionId === qId);
    return ans && typeof ans.value === 'string' ? ans.value : '';
  };

  const getMultiSelectValues = (qId: string): string[] => {
    const ans = answers.find(a => a.questionId === qId);
    return ans && Array.isArray(ans.value) ? ans.value : [];
  };

  // Find maturity level from process questions
  let maturityLevel = 2; // default
  const processQ = answers.find(a =>
    ['ind_03', 'cx_A01'].includes(a.questionId) && !a.isUnknown
  );
  if (processQ && typeof processQ.value === 'string') {
    const parsed = parseInt(processQ.value);
    if (!isNaN(parsed)) maturityLevel = parsed;
  }

  // Manual processes
  const manualProcs = getMultiSelectValues('cx_A05') || getMultiSelectValues('ind_05') || [];

  return {
    employeeCountBand: getAnswerValue('ind_02') || getAnswerValue('cx_02') || 'small',
    hourlyCostBand: getAnswerValue('ind_15') || getAnswerValue('cx_ROI01') || 'medium',
    maturityLevel,
    manualProcesses: manualProcs.filter(p => p !== 'none'),
    invoicingVolumeBand: getAnswerValue('cx_ROI03') || 'medium',
    adminHeadcountBand: getAnswerValue('cx_ROI02') || '4_10',
    categoryScoreF,
  };
}
