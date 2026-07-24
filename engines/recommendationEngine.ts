import type {
  Answer,
  Question,
  ORSScore,
  TDRIScore,
  DIIScore,
  Recommendations,
  Recommendation,
  Strength,
} from '@/types';

export function generateRecommendations(
  answers: Answer[],
  questions: Question[],
  ors: ORSScore,
  tdri: TDRIScore,
  dii: DIIScore
): Recommendations {
  const criticalRisks = generateCriticalRisks(tdri);
  const quickWins = generateQuickWins(ors, answers, questions);
  const strategic = generateStrategic(ors, answers, questions);
  const longTerm = generateLongTerm(ors, dii, answers);
  const strengths = generateStrengths(ors, tdri, dii);

  // Build roadmap
  const roadmap = {
    immediate0_3m: [
      ...criticalRisks.map(r => r.id),
      ...quickWins.slice(0, 3).map(r => r.id),
    ],
    medium3_12m: strategic.slice(0, 3).map(r => r.id),
    longTerm12mPlus: longTerm.map(r => r.id),
  };

  return {
    strengths,
    criticalRisks,
    quickWins: quickWins.slice(0, 5),
    strategicInitiatives: strategic.slice(0, 3),
    longTermInitiatives: longTerm,
    roadmap,
  };
}

function generateCriticalRisks(tdri: TDRIScore): Recommendation[] {
  const recs: Recommendation[] = [];

  const riskRecommendations: Record<string, { title: string; desc: string }> = {
    RF01: {
      title: 'Migrácia z nepodporovaného OS/systému',
      desc: 'Naplánujte migráciu na podporovanú verziu. Systém mimo podpory nedostáva bezpečnostné záplaty a ohrozuje celú infraštruktúru.',
    },
    RF02: {
      title: 'Okamžite nasaďte zálohovanie',
      desc: 'Implementujte zálohovanie kritických dát s off-site kópiou. Bez záloh je firma existenčne ohrozená pri akejkoľvek havárii.',
    },
    RF03: {
      title: 'Otestujte obnovu zo zálohy',
      desc: 'Naplánujte a vykonajte test obnovy. Zálohy bez testovania sú nespoľahlivé — nevíte, či fungujú, kým ich nepotrebujete.',
    },
    RF04: {
      title: 'Zaveďte pravidelný patch management',
      desc: 'Nastavte pravidelný cyklus aktualizácií. Neaktualizované systémy sú najčastejšia príčina bezpečnostných incidentov.',
    },
    RF05: {
      title: 'Nasaďte MFA na kritických systémoch',
      desc: 'Implementujte viacfaktorové overenie minimálne na e-mail, VPN a admin rozhrania. Je to najefektívnejšia bezpečnostná investícia.',
    },
    RF07: {
      title: 'Eliminujte závislosť na jednom človeku',
      desc: 'Zdokumentujte kritické znalosti a zabezpečte cross-training. Závislosť na jednej osobe je prevádzkové riziko.',
    },
    RF09: {
      title: 'Vytvorte BC/DR plán',
      desc: 'Pripravte aspoň základný plán kontinuity a obnovy po havárii. Otestujte ho, aby ste vedeli že funguje.',
    },
  };

  for (const factor of tdri.factors) {
    if (!factor.active || factor.penalty < 5) continue;

    const template = riskRecommendations[factor.id];
    if (!template) continue;

    recs.push({
      id: `rec_risk_${factor.id}`,
      type: 'critical_risk',
      category: 'E',
      titleSk: template.title,
      descriptionSk: template.desc,
      urgency: factor.severity === 'critical' ? 5 : 4,
      impact: factor.severity === 'critical' ? 5 : 4,
      effort: 2,
      priorityScore: (factor.severity === 'critical' ? 5 : 4) * 5 / 2,
      horizon: '0-3 mesiace',
      triggeredBy: [factor.id],
      sourceAnswers: factor.sourceAnswers,
      expectedOutcome: `Zníženie rizika: ${factor.name}`,
    });
  }

  return recs.sort((a, b) => b.priorityScore - a.priorityScore);
}

function generateQuickWins(
  ors: ORSScore,
  answers: Answer[],
  questions: Question[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const cats = ors.categories;

  if (cats['A'] && cats['A'].score < 40) {
    recs.push({
      id: 'rec_qw_process_auto',
      type: 'quick_win',
      category: 'A',
      titleSk: 'Digitalizujte kľúčové procesy',
      descriptionSk: 'Začnite s najčastejšími procesmi — fakturácia, schvaľovanie, reporting. Aj jednoduchá automatizácia ušetrí hodiny týždenne.',
      urgency: 4, impact: 4, effort: 2,
      priorityScore: 8,
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (cats['B'] && cats['B'].score < 40) {
    recs.push({
      id: 'rec_qw_integration',
      type: 'quick_win',
      category: 'B',
      titleSk: 'Prepojte najpoužívanejšie systémy',
      descriptionSk: 'Aj jednoduchý connector medzi dvoma systémami zníži ručný prepis a chybovosť. Začnite s najčastejšie používanou dvojicou.',
      urgency: 3, impact: 4, effort: 2,
      priorityScore: 6,
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (cats['C'] && cats['C'].score < 30) {
    recs.push({
      id: 'rec_qw_reporting',
      type: 'quick_win',
      category: 'C',
      titleSk: 'Nastavte automatizované reporty',
      descriptionSk: 'Využite reporting možnosti existujúcich systémov. Nemusíte kupovať BI — začnite s tým čo máte.',
      urgency: 3, impact: 3, effort: 1,
      priorityScore: 9,
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (cats['F'] && cats['F'].score < 30) {
    recs.push({
      id: 'rec_qw_ownership',
      type: 'quick_win',
      category: 'F',
      titleSk: 'Určite zodpovednú osobu za digitalizáciu',
      descriptionSk: 'Bez jasného vlastníctva sa digitalizácia neudeje. Stačí jedna osoba s mandátom a základným rozpočtom.',
      urgency: 3, impact: 3, effort: 1,
      priorityScore: 9,
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (cats['E'] && cats['E'].score < 50) {
    recs.push({
      id: 'rec_qw_security_basics',
      type: 'quick_win',
      category: 'E',
      titleSk: 'Zabezpečte základnú kybernetickú hygienu',
      descriptionSk: 'MFA, zálohy, patching — tieto tri veci dramaticky znížia vaše riziko. Implementácia je rýchla a lacná.',
      urgency: 5, impact: 5, effort: 1,
      priorityScore: 25,
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  return recs.sort((a, b) => b.priorityScore - a.priorityScore);
}

function generateStrategic(
  ors: ORSScore,
  answers: Answer[],
  questions: Question[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const cats = ors.categories;

  if (cats['A'] && cats['A'].score < 50) {
    recs.push({
      id: 'rec_str_erp',
      type: 'strategic',
      category: 'A',
      titleSk: 'Implementujte integrovaný podnikový systém',
      descriptionSk: 'ERP alebo integrovaný systém pre riadenie kľúčových procesov (objednávky, fakturácia, sklad, výroba).',
      urgency: 3, impact: 5, effort: 4,
      priorityScore: 3.75,
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (cats['B'] && cats['B'].score < 50) {
    recs.push({
      id: 'rec_str_integration',
      type: 'strategic',
      category: 'B',
      titleSk: 'Vytvorte integračnú stratégiu',
      descriptionSk: 'Definujte source of truth pre kľúčové dáta a prepojte systémy. Eliminujte dvojitý zápis a CSV chaos.',
      urgency: 3, impact: 4, effort: 3,
      priorityScore: 4,
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (cats['E'] && cats['E'].score < 50) {
    recs.push({
      id: 'rec_str_security',
      type: 'strategic',
      category: 'E',
      titleSk: 'Vypracujte bezpečnostnú stratégiu',
      descriptionSk: 'Bezpečnostná politika, incident response plán, pravidelný audit a školenia zamestnancov.',
      urgency: 4, impact: 4, effort: 3,
      priorityScore: 5.3,
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (cats['F'] && cats['F'].score < 40) {
    recs.push({
      id: 'rec_str_roadmap',
      type: 'strategic',
      category: 'F',
      titleSk: 'Vytvorte digitalizačnú roadmapu',
      descriptionSk: 'Strategický plán s prioritami, rozpočtom, KPI a časovým rámcom. Základ pre systematickú digitalizáciu.',
      urgency: 3, impact: 4, effort: 2,
      priorityScore: 6,
      horizon: '3-6 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  return recs.sort((a, b) => b.priorityScore - a.priorityScore);
}

function generateLongTerm(
  ors: ORSScore,
  dii: DIIScore,
  answers: Answer[]
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (ors.scorePenalized > 60) {
    const aiAnswer = answers.find(a => ['cx_DII03'].includes(a.questionId));
    // Odporúčanie len pri explicitnom "nevyužívame AI" — chýbajúca alebo "Neviem"
    // odpoveď nie je dôkaz o nevyužívaní.
    if (aiAnswer && !aiAnswer.isUnknown && aiAnswer.value === 'none') {
      recs.push({
        id: 'rec_lt_ai',
        type: 'long_term',
        category: 'B',
        titleSk: 'Zvážte pilotné nasadenie AI',
        descriptionSk: 'Máte dostatočnú digitálnu základňu pre experimentovanie s AI — automatizácia repetitívnych úloh, chatboty, prediktívna analytika.',
        urgency: 2, impact: 4, effort: 3,
        priorityScore: 2.7,
        horizon: '12+ mesiacov',
        triggeredBy: [], sourceAnswers: [],
      });
    }
  }

  if (ors.scorePenalized > 70) {
    recs.push({
      id: 'rec_lt_transformation',
      type: 'long_term',
      category: 'F',
      titleSk: 'Digitálna transformácia business modelu',
      descriptionSk: 'Máte silnú digitálnu základňu — zvážte, ako digitalizácia môže zmeniť váš business model, nie len optimalizovať existujúce procesy.',
      urgency: 1, impact: 5, effort: 5,
      priorityScore: 1,
      horizon: '12+ mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  return recs;
}

function generateStrengths(
  ors: ORSScore,
  tdri: TDRIScore,
  dii: DIIScore
): Strength[] {
  const strengths: Strength[] = [];

  for (const [cat, data] of Object.entries(ors.categories)) {
    if (data.score >= 70) {
      strengths.push({
        category: cat,
        descriptionSk: `${data.name}: Nadpriemerná úroveň (${Math.round(data.score)}/100)`,
      });
    }
  }

  if (tdri.score <= 15) {
    strengths.push({
      category: 'E',
      descriptionSk: 'Nízky technologický dlh — dobre riadená infraštruktúra a bezpečnosť',
    });
  }

  if (dii.score100 >= 75) {
    strengths.push({
      category: 'DII',
      descriptionSk: 'Vysoká digitálna intenzita — aktívne využívanie digitálnych nástrojov',
    });
  }

  return strengths;
}
