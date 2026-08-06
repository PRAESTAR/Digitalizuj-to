import type { Answer, BusinessImpact, CalculationAuditEntry, Question, ScenarioValues, SavingsProjection, ScenarioDisplayPolicy } from '@/types';
import {
  defaultHourlyCostEur,
  processBenchmarks,
  manualShareFromMaturity,
  assumedMaturityLevel,
  manualShareWhenSelfReportedManual,
  processKeyFromAnswerValue,
  invoicingVolumeFromBand,
  adminFteFromBand,
  workingHoursPerFteYear,
  adminAgendaShareOfFte,
  governanceScenarioGates,
  investmentIntentGates,
  realizationRates,
  rampUpMonthsByScenario,
  savingsProjectionHorizonMonths,
} from '@/data/scoringConfig';

interface ROIInputs {
  /** null = veľkosť firmy nebola uvedená — engine ju priznane predpokladá. */
  employeeCountBand: string | null;
  /**
   * Zrelosť procesov 0–4 z `ind_03`/`cx_A01`. `null` = neuvedená alebo
   * mimo domény — engine ju potom priznane predpokladá, nedosádza ticho.
   */
  maturityLevel: number | null;
  manualProcesses: string[];
  /**
   * Respondent VÝSLOVNE vybral „Žiadny — všetko máme digitalizované".
   *
   * Bez tohto rozlíšenia bol prázdny `manualProcesses` nerozoznateľný od
   * nezodpovedanej otázky a engine spadol na tri benchmarkové defaulty.
   * Dôsledok bol obrátený: firma, ktorá priznala jeden ručný proces, dostala
   * NIŽŠÍ odhad úspor (1 940 €/rok) než firma, ktorá tvrdila, že ručné nemá
   * nič (3 203 €/rok z troch PREDPOKLADANÝCH procesov).
   *
   * Nastavuje sa len pri hodnote 'none' — nerozpoznaná hodnota procesu
   * znamená rozbité mapovanie, nie neexistujúcu ručnú prácu, a tam majú
   * defaulty nastúpiť ďalej.
   */
  noManualProcesses: boolean;
  /** null = objem fakturácie neuvedený (vrátane „Neviem"). */
  invoicingVolumeBand: string | null;
  /** null = počet administratívnych pracovníkov neuvedený. */
  adminHeadcountBand: string | null;
  /** null = kategória F (governance) nemeraná — disclaimer sa nevyhodnocuje. */
  categoryScoreF: number | null;
  /**
   * Zámer investovať 0–10. `null` = otázka nezodpovedaná alebo „Neviem" —
   * bránu vtedy neposúva ani jedným smerom, nevedomosť nie je dôkaz o nechuti.
   */
  investmentIntent: number | null;
}

/**
 * Politika zobrazenia scenárov (ROI_MODEL §5.3).
 *
 * Skladá sa z DVOCH nezávislých brán a platí tá prísnejšia:
 *
 *  - **governance** (ORS kategória F) — či firma vie zmenu zorganizovať,
 *  - **zámer investovať** (0–10) — či to vôbec chce.
 *
 * Do 6. 8. 2026 existovala len prvá a slúžila ako zástupný ukazovateľ oboch.
 * To bola tichá chyba: governance je kapacita, nie vôľa. Firma s výbornou
 * organizáciou a nulovou chuťou investovať nezrealizuje nič — a dostávala
 * optimistický scenár. Rovnako odhodlaná firma bez pripravenosti ho dostane
 * len vtedy, ak obstojí aj v governance.
 *
 * Priemerovať brány by bolo horšie než ich minimum: silná stránka by kryla
 * slabú, hoci úsporu obmedzuje práve tá slabá.
 */
function resolveScenarioPolicy(
  f: number | null,
  sizeBandAssumed: boolean,
  intent: number | null
): ScenarioDisplayPolicy {
  if (sizeBandAssumed) {
    return {
      gate: 'restricted',
      recommendedScenario: 'conservative',
      visibleScenarios: ['conservative', 'mid'],
      governanceScoreF: f,
      reasonSk:
        'Veľkosť firmy nebola uvedená, takže objemy procesov stoja na predpoklade — optimistický scenár by predstieral presnosť, ktorú vstupy nemajú.',
    };
  }
  // Nezmeraná governance je prísnejšia než akýkoľvek zámer — bez nej sa
  // organizačná pripravenosť nedá doložiť vôbec.
  if (f === null) {
    return {
      gate: 'unmeasured',
      recommendedScenario: 'conservative',
      visibleScenarios: ['conservative', 'mid'],
      governanceScoreF: null,
      reasonSk:
        'Governance (kategória F) nebola zmeraná — optimistický scenár sa nezobrazuje, pretože organizačnú pripravenosť nevieme doložiť.',
    };
  }

  const govGate: ScenarioDisplayPolicy['gate'] =
    f >= governanceScenarioGates.high ? 'high'
      : f >= governanceScenarioGates.standard ? 'standard'
        : 'restricted';

  // Nezistený zámer bránu neposúva ani jedným smerom — nevedomosť nie je
  // dôkaz o nechuti, rovnako ako pri rizikách.
  const intentGate: ScenarioDisplayPolicy['gate'] | null =
    intent === null ? null
      : intent >= investmentIntentGates.high ? 'high'
        : intent >= investmentIntentGates.standard ? 'standard'
          : 'restricted';

  const RANK = { restricted: 0, standard: 1, high: 2 } as const;
  const gate = intentGate !== null && RANK[intentGate] < RANK[govGate] ? intentGate : govGate;
  const limitedByIntent = intentGate !== null && RANK[intentGate] < RANK[govGate];

  const govText = `organizačná pripravenosť (F ${Math.round(f)}/100)`;
  const intentText = intent !== null ? `zámer investovať ${intent}/10` : null;

  if (gate === 'restricted') {
    return {
      gate,
      recommendedScenario: 'conservative',
      visibleScenarios: ['conservative', 'mid'],
      governanceScoreF: f,
      reasonSk: limitedByIntent
        ? `Nízky ${intentText} znižuje pravdepodobnosť, že sa potenciál naozaj zrealizuje — optimistický scenár sa preto nezobrazuje, hoci ${govText} by ho pripúšťala.`
        : `Nízka ${govText} znižuje pravdepodobnosť realizácie plného potenciálu — optimistický scenár sa preto nezobrazuje.`,
    };
  }

  const detail = intentText ? `${govText} a ${intentText}` : govText;
  return {
    gate,
    recommendedScenario: 'mid',
    visibleScenarios: ['conservative', 'mid', 'optimistic'],
    governanceScoreF: f,
    reasonSk: gate === 'high'
      ? `Vysoká pripravenosť aj odhodlanie — ${detail}. Firma má reálnu šancu dosiahnuť aj optimistický scenár.`
      : `Priemerná pripravenosť — ${detail}. Realistický scenár je primeraný odhad.`,
  };
}

export function calculateBusinessImpact(
  answers: Answer[],
  questions: Question[],
  inputs: ROIInputs
): BusinessImpact {
  // Hodinová cena práce sa nepýta ako otázka — vždy priemer SR (viď data/scoringConfig.ts).
  const hourlyCost = defaultHourlyCostEur;
  // Neuvedená zrelosť sa priznáva rovnako ako neuvedená veľkosť firmy:
  // počíta sa ďalej, ale s disclaimerom a zastropovanou dôveryhodnosťou.
  // Default je stredná úroveň — nie najhoršia (nafúkla by úsporu), nie
  // najlepšia (zmazala by ju).
  const maturityAssumed = inputs.maturityLevel === null;
  const maturityLevel = inputs.maturityLevel ?? assumedMaturityLevel;
  const globalManualShare = manualShareFromMaturity[maturityLevel];

  // Veľkosť firmy sa už ticho nedosádza — keď chýba, počíta sa ďalej, ale
  // priznane: disclaimer, prefix v audite a zastropovaná dôveryhodnosť.
  const sizeBandAssumed = inputs.employeeCountBand === null;
  const sizeBand = inputs.employeeCountBand ?? 'small';

  // Self-reported objem faktúr prebíja benchmarkovú frekvenciu — dve firmy
  // s desaťnásobne odlišným objemom dostávali dovtedy identické ROI.
  const selfReportedInvoiceVolume = inputs.invoicingVolumeBand
    ? invoicingVolumeFromBand[inputs.invoicingVolumeBand] ?? null
    : null;

  // Proces označený za ručný je priama evidencia a prebíja odhad z maturity.
  const selfReportedManual = new Set(
    inputs.manualProcesses.map(v => processKeyFromAnswerValue[v] ?? v)
  );
  const manualShareFor = (proc: string): number =>
    selfReportedManual.has(proc)
      ? Math.max(manualShareWhenSelfReportedManual, globalManualShare)
      : globalManualShare;
  const frequencyFor = (proc: string, benchmark: (typeof processBenchmarks)[string]): number =>
    proc === 'invoicing' && selfReportedInvoiceVolume !== null
      ? selfReportedInvoiceVolume
      : benchmark.frequencyPerMonth[sizeBand] || benchmark.frequencyPerMonth.small;

  const auditEntries: CalculationAuditEntry[] = [];
  let totalSavedHours = 0;
  let totalErrorCostHours = 0;
  let totalErrorsPreventable = 0;
  let selfReportedCount = 0;
  let totalInputs = 0;

  // Hrubé manuálne hodiny pred automatizovateľnosťou — porovnávajú sa
  // s kapacitou administratívy (viď strop nižšie).
  let grossManualHours = 0;

  // Calculate per-process savings (including error cost model)
  const relevantProcesses = getRelevantProcesses(inputs.manualProcesses);

  for (const proc of relevantProcesses) {
    const benchmark = processBenchmarks[proc];
    if (!benchmark) continue;

    const freqMonthly = frequencyFor(proc, benchmark);
    const freqYearly = freqMonthly * 12;
    const timePerCaseH = benchmark.timePerUnitMinutes / 60;
    const automatableShare = benchmark.automatableShare;
    const manualShare = manualShareFor(proc);

    const savedHours = freqYearly * timePerCaseH * manualShare * automatableShare;
    totalSavedHours += savedHours;
    grossManualHours += freqYearly * timePerCaseH * manualShare;

    // Error cost model: errors + rework time that automation prevents
    const errorsPerYear = freqYearly * benchmark.errorRate * manualShare;
    const reworkHoursPerYear = errorsPerYear * (benchmark.reworkMinutesPerError / 60);
    const preventableErrors = errorsPerYear * automatableShare;
    totalErrorCostHours += reworkHoursPerYear * automatableShare;
    totalErrorsPreventable += preventableErrors;

    totalInputs++;
    selfReportedCount++; // proces sem prišiel z odpovede, nie z defaultov

    const volumeSelfReported = proc === 'invoicing' && selfReportedInvoiceVolume !== null;
    auditEntries.push({
      process: proc,
      frequencyYearly: freqYearly,
      timePerCaseH: Math.round(timePerCaseH * 100) / 100,
      manualShare,
      automatableShare,
      savedHours: Math.round(savedHours),
      errorCostHours: Math.round(reworkHoursPerYear * automatableShare * 10) / 10,
      dataSource:
        (sizeBandAssumed ? 'predpokladaná veľkosť firmy; ' : '') +
        (volumeSelfReported
          ? 'mix (proces aj objem: self-reported, čas a automatizovateľnosť: benchmark)'
          : 'mix (proces: self-reported, objemy: benchmark)'),
    });
  }

  // Bez konkrétnych procesov sa odhaduje z celkovej zrelosti — ALE len keď
  // sa respondent nevyjadril. Kto výslovne vybral „žiadny", nemá dostať
  // úsporu z troch procesov, o ktorých práve povedal, že ručné nie sú.
  if (relevantProcesses.length === 0 && !inputs.noManualProcesses) {
    const defaultProcs = ['invoicing', 'reporting', 'approval_workflows'];
    for (const proc of defaultProcs) {
      const benchmark = processBenchmarks[proc];
      if (!benchmark) continue;

      const freqMonthly = frequencyFor(proc, benchmark);
      const freqYearly = freqMonthly * 12;
      const timePerCaseH = benchmark.timePerUnitMinutes / 60;
      const automatableShare = benchmark.automatableShare;
      const manualShare = globalManualShare;
      const savedHours = freqYearly * timePerCaseH * manualShare * automatableShare;
      totalSavedHours += savedHours;
      grossManualHours += freqYearly * timePerCaseH * manualShare;

      const errorsPerYear = freqYearly * benchmark.errorRate * manualShare;
      const reworkHoursPerYear = errorsPerYear * (benchmark.reworkMinutesPerError / 60);
      totalErrorCostHours += reworkHoursPerYear * automatableShare;
      totalErrorsPreventable += errorsPerYear * automatableShare;

      // Aj default vetva je vstup — bez tohto bol menovateľ dôveryhodnosti
      // nula a confidence uviazla na 0,3 aj pri vyplnenom objeme fakturácie.
      totalInputs++;
      const volumeSelfReported = proc === 'invoicing' && selfReportedInvoiceVolume !== null;
      if (volumeSelfReported) selfReportedCount++;

      auditEntries.push({
        process: proc,
        frequencyYearly: freqYearly,
        timePerCaseH: Math.round(timePerCaseH * 100) / 100,
        manualShare,
        automatableShare,
        savedHours: Math.round(savedHours),
        errorCostHours: Math.round(reworkHoursPerYear * automatableShare * 10) / 10,
        dataSource:
          (sizeBandAssumed ? 'predpokladaná veľkosť firmy; ' : '') +
          (volumeSelfReported
            ? 'mix (objem faktúr: self-reported, zvyšok: benchmark)'
            : 'benchmark (žiadne self-reported dáta o procesoch)'),
      });
    }
  }

  // Strop kapacitou administratívy: benchmarkové objemy nemôžu spotrebovať
  // viac hodín, než koľko ich admin tím vôbec má. Znižuje, nikdy nezvyšuje —
  // benchmark frekvencie je dôkaz o objeme, headcount len horná hranica.
  const adminCapacityHours = inputs.adminHeadcountBand
    ? (adminFteFromBand[inputs.adminHeadcountBand] ?? null) !== null
      ? adminFteFromBand[inputs.adminHeadcountBand] * workingHoursPerFteYear * adminAgendaShareOfFte
      : null
    : null;
  const capFactor =
    adminCapacityHours !== null && grossManualHours > adminCapacityHours
      ? adminCapacityHours / grossManualHours
      : 1;
  if (capFactor < 1) {
    totalSavedHours *= capFactor;
    totalErrorCostHours *= capFactor;
    totalErrorsPreventable *= capFactor;
  }
  // Headcount je vstup aj vtedy, keď strop nezasiahol — vyplnená odpoveď
  // zvyšuje dôveryhodnosť rovnako ako ostatné self-reported údaje.
  totalInputs++;
  if (inputs.adminHeadcountBand !== null) selfReportedCount++;

  // Scenarios with realization rates (applied to both time savings and error cost reduction)
  const conservativeRate = realizationRates.conservative;
  const midRate = realizationRates.mid;
  const optimisticRate = realizationRates.optimistic;

  const hoursConservative = Math.round(totalSavedHours * conservativeRate);
  const hoursMid = Math.round(totalSavedHours * midRate);
  const hoursOptimistic = Math.round(totalSavedHours * optimisticRate);

  const errorHoursConservative = Math.round(totalErrorCostHours * conservativeRate);
  const errorHoursMid = Math.round(totalErrorCostHours * midRate);
  const errorHoursOptimistic = Math.round(totalErrorCostHours * optimisticRate);

  // Confidence
  const dataCompleteness = totalInputs > 0 ? selfReportedCount / totalInputs : 0;
  const rawConfidence = Math.round(
    (dataCompleteness * 0.8 + (1 - dataCompleteness) * 0.3) * 100
  ) / 100;
  // Bez známej veľkosti firmy stoja objemy na predpoklade — self-report
  // o procesoch nesmie zvyšovať dôveru v číslo, ktorého základ je hádaný.
  const confidence = sizeBandAssumed || maturityAssumed
    ? Math.min(rawConfidence, 0.3)
    : rawConfidence;

  let confidenceLabel: string;
  if (confidence >= 0.7) confidenceLabel = 'Vysoká — prevažne self-reported dáta';
  else if (confidence >= 0.4) confidenceLabel = 'Stredná — čiastočne self-reported, čiastočne benchmark';
  else confidenceLabel = 'Nízka — prevažne benchmarkové odhady';

  // Risk reduction
  const currentRiskLevel = maturityLevel <= 1 ? 'vysoké' : maturityLevel <= 2 ? 'stredné' : 'nízke';
  const potentialRiskLevel = 'nízke';
  const mitigations = generateMitigations(answers, questions);

  // Opportunity gap
  const gapPercentage = Math.max(0, Math.round((1 - maturityLevel / 4) * 100));

  // Politika zobrazenia scenárov podľa meranej governance a známosti veľkosti.
  const displayPolicy = resolveScenarioPolicy(inputs.categoryScoreF, sizeBandAssumed, inputs.investmentIntent);
  const governanceNote = displayPolicy.gate === 'standard' || displayPolicy.gate === 'high'
    ? ''
    : displayPolicy.reasonSk;

  const disclaimers = [
    'Odhad je založený na kombinácii self-reported dát a sektorových benchmarkov.',
    'Reálny dopad závisí od kvality implementácie a organizačnej pripravenosti.',
    `Hodinová cena práce: ${hourlyCost} €/hod (priemer IT/telekomunikačného sektora SR, Eurostat 2025 — nie vstup od firmy).`,
    'Konzervatívny scenár predpokladá 40% realizáciu identifikovaného potenciálu.',
    'Odhad chýb a reworku vychádza zo sektorových benchmarkov chybovosti procesov.',
    'Krivky kumulatívnej úspory predpokladajú lineárny nábeh k plnému ročnému run-rate (3/6/9 mesiacov podľa scenára) — zjednodušený ilustratívny model, nie empiricky kalibrovaná adopčná krivka.',
  ];
  if (governanceNote) disclaimers.push(governanceNote);
  if (sizeBandAssumed) {
    // Navrch zoznamu — bez známej veľkosti sa objemy procesov môžu líšiť
    // aj niekoľkonásobne, takže je to najsilnejšia výhrada k celému číslu.
    disclaimers.unshift(
      'Veľkosť firmy nebola uvedená — objemy procesov sú počítané pre pásmo 10–49 zamestnancov. Odhad je preto len orientačný a pri inej veľkosti sa môže líšiť aj niekoľkonásobne.'
    );
  }
  if (maturityAssumed) {
    disclaimers.push(
      `Zrelosť procesov nebola zistená — počíta sa s úrovňou ${assumedMaturityLevel} z 4 (${manualShareFromMaturity[assumedMaturityLevel] * 100} % ručnej práce). Firma s výrazne inou úrovňou digitalizácie dostane odlišný odhad.`
    );
  }
  if (capFactor < 1) {
    disclaimers.push(
      `Odhad je zastropovaný kapacitou administratívy (${Math.round(adminCapacityHours!)} h/rok) — benchmarkové objemy procesov prevyšujú dostupný čas tímu.`
    );
  }

  // Total financial impact = time savings + error cost reduction
  const totalConservative = (hoursConservative + errorHoursConservative) * hourlyCost;
  const totalMid = (hoursMid + errorHoursMid) * hourlyCost;
  const totalOptimistic = (hoursOptimistic + errorHoursOptimistic) * hourlyCost;

  const savingsProjection = buildSavingsProjection({
    conservative: totalConservative,
    mid: totalMid,
    optimistic: totalOptimistic,
  });

  return {
    displayPolicy,
    inputAssumptions: {
      sizeBandAssumed,
      assumedSizeBand: sizeBandAssumed ? sizeBand : null,
      maturityAssumed,
      assumedMaturityLevel: maturityAssumed ? assumedMaturityLevel : null,
    },
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
    savingsProjection,
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

/**
 * Kumulatívna krivka úspory pre 3 scenáre: lineárny nábeh mesačnej sadzby
 * z 0 na plnú (eurPerYear / 12) počas rampUpMonthsByScenario[scenár] mesiacov,
 * potom akumulácia pri plnej mesačnej sadzbe až do horizontu.
 */
function buildSavingsProjection(eurPerYear: ScenarioValues): SavingsProjection {
  const scenarios = ['conservative', 'mid', 'optimistic'] as const;
  const monthlyRunRate: ScenarioValues = {
    conservative: eurPerYear.conservative / 12,
    mid: eurPerYear.mid / 12,
    optimistic: eurPerYear.optimistic / 12,
  };

  const cumulative: ScenarioValues = { conservative: 0, mid: 0, optimistic: 0 };
  const points: SavingsProjection['points'] = [
    { month: 0, conservative: 0, mid: 0, optimistic: 0 },
  ];

  for (let month = 1; month <= savingsProjectionHorizonMonths; month++) {
    for (const scenario of scenarios) {
      const rampMonths = rampUpMonthsByScenario[scenario];
      const rampFactor = Math.min(month / rampMonths, 1);
      cumulative[scenario] += monthlyRunRate[scenario] * rampFactor;
    }
    points.push({
      month,
      conservative: Math.round(cumulative.conservative),
      mid: Math.round(cumulative.mid),
      optimistic: Math.round(cumulative.optimistic),
    });
  }

  return {
    horizonMonths: savingsProjectionHorizonMonths,
    rampUpMonths: rampUpMonthsByScenario,
    points,
  };
}

/**
 * Hodnoty odpovede z cx_A05 na kľúče benchmarkov. Mapovanie je explicitné,
 * lebo tri hodnoty (sklad, servis, nákup) sa volajú inak než ich benchmark —
 * predtým sa spoliehalo na zhodu názvov a tie tri z výpočtu ticho vypadli.
 */
function getRelevantProcesses(manualProcesses: string[]): string[] {
  return manualProcesses
    .map(v => processKeyFromAnswerValue[v] ?? v)
    .filter(key => processBenchmarks[key]);
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
  categoryScoreF: number | null
): ROIInputs {
  /**
   * Hodnota len z PLATNEJ odpovede. „Neviem" posiela prázdny reťazec s
   * `isUnknown`, takže bez tejto kontroly by sa nerozoznalo „nevyplnené" od
   * „vyplnené" a fallback by dosadil pásmo bez akéhokoľvek signálu.
   */
  const getMeasuredAnswerValue = (qId: string): string | null => {
    const ans = answers.find(a => a.questionId === qId);
    if (!ans || ans.isUnknown || ans.wasSkipped) return null;
    return typeof ans.value === 'string' && ans.value !== '' ? ans.value : null;
  };

  const getMultiSelectValues = (qId: string): string[] => {
    const ans = answers.find(a => a.questionId === qId);
    return ans && Array.isArray(ans.value) ? ans.value : [];
  };

  // Zrelosť procesov. Doména je 0–4 (kľúče manualShareFromMaturity) a
  // validuje sa proti nej — parseInt sám prijme aj 9 alebo −3 a taká hodnota
  // by neskončila chybou, ale tichým nezmyslom: firma na „úrovni 9" by
  // spadla na fallback 0,65 (teda úroveň 1), dostala rizikovosť „nízke"
  // a medzeru 0 %. Neplatná hodnota je odteraz to isté ako chýbajúca.
  let maturityLevel: number | null = null;
  const processQ = answers.find(a =>
    ['ind_03', 'cx_A01'].includes(a.questionId) && !a.isUnknown && !a.wasSkipped
  );
  if (processQ && typeof processQ.value === 'string') {
    const parsed = parseInt(processQ.value, 10);
    if (Number.isInteger(parsed) && parsed in manualShareFromMaturity) {
      maturityLevel = parsed;
    }
  }

  // Manuálne procesy: komplexný kvíz cez cx_A05, indikatívny cez
  // ind_03c_manual (pribudol 6. 8. 2026). Dovtedy indikatívne ROI VŽDY
  // počítalo z benchmarkových defaultov, takže dve firmy s úplne odlišnou
  // mierou ručnej práce dostali rovnaký odhad úspory. Obe otázky používajú
  // ZHODNÉ hodnoty možností — benchmarky procesov sa hľadajú podľa nich.
  // Vetvy sa nikdy neprelínajú, takže spojenie zoznamov nič nezdvojí.
  const manualProcs = [
    ...getMultiSelectValues('cx_A05'),
    ...getMultiSelectValues('ind_03c_manual'),
  ];

  // Veľkosť sa validuje proti známej množine — neznáma hodnota je to isté
  // ako chýbajúca, inak by sa dostala do benchmarkového lookupu a ticho
  // spadla na 'small'.
  const KNOWN_SIZE_BANDS = ['micro', 'small', 'medium', 'large'];
  const rawSize = getMeasuredAnswerValue('ind_02') ?? getMeasuredAnswerValue('cx_02');
  const employeeCountBand = rawSize && KNOWN_SIZE_BANDS.includes(rawSize) ? rawSize : null;

  // Zámer investovať — validuje sa proti rozsahu 0–10 rovnako ako zrelosť.
  const intentRaw = getMeasuredAnswerValue('cx_F07_intent') ?? getMeasuredAnswerValue('ind_16_intent');
  const intentParsed = intentRaw !== null ? parseInt(intentRaw, 10) : NaN;
  const investmentIntent =
    Number.isInteger(intentParsed) && intentParsed >= 0 && intentParsed <= 10 ? intentParsed : null;

  return {
    employeeCountBand,
    maturityLevel,
    investmentIntent,
    manualProcesses: manualProcs.filter(p => p !== 'none'),
    noManualProcesses: manualProcs.includes('none') && manualProcs.every(p => p === 'none'),
    invoicingVolumeBand: getMeasuredAnswerValue('cx_ROI03'),
    adminHeadcountBand: getMeasuredAnswerValue('cx_ROI02'),
    categoryScoreF,
  };
}
