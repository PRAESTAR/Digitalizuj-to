import type {
  Answer,
  Question,
  ORSScore,
  CategoryScore,
  TDRIScore,
  RiskFactor,
  DIIScore,
  AIReadinessScore,
  Recommendations,
  Recommendation,
  Strength,
} from '@/types';
import { isValidAnswer } from '@/engines/scoringEngine';
import { getRiskLevel } from '@/engines/riskEngine';
import { riskRecommendations } from '@/data/riskRecommendations';
import { riskRecommendationGates } from '@/data/scoringConfig';

/**
 * Skóre kategórie len ak je MERANÁ — nemeraná kategória nespúšťa žiadne
 * odporúčanie ani strength (nezmerané nie je nula: bez merania niet nálezu).
 */
function measuredScore(
  cats: Record<string, CategoryScore>,
  key: string
): number | null {
  const cat = cats[key];
  return cat && cat.measured && cat.score !== null ? cat.score : null;
}

/**
 * Priorita zo skutočných polí. Predtým bola v každom pravidle napísaná
 * natvrdo, takže sa dala zmeniť urgency/impact/effort bez toho, aby sa
 * poradie v roadmape pohlo.
 */
function priority(urgency: number, impact: number, effort: number): number {
  return Math.round(((urgency * impact) / effort) * 10) / 10;
}

/* ────────────────────────────────────────────────────────────────────────
   Faktová vrstva — answer-level a firmografické podmienky.

   Parametre `answers`/`questions` boli dovtedy prijímané a nevyužité, takže
   pravidlá bežali čisto na kategóriovom skóre: trojosobovej firme sa
   odporúčal ERP a firme bez servera migrácia do cloudu.

   Kľúčová sémantika, zhodná so scoringom v1.5: NEPLATNÁ ODPOVEĎ NIKDY
   NESPLNÍ PODMIENKU. „Neviem" ani preskočené nie sú zistenie, takže bránu
   neotvoria — rovnako, ako nevstupujú do skóre.
   ──────────────────────────────────────────────────────────────────────── */

const SIZE_ORDER = ['micro', 'small', 'medium', 'large'];

interface Facts {
  /** Hodnota prvej otázky zo zoznamu, ktorá má platnú odpoveď (alias indikatívny/komplexný). */
  value(ids: string[]): string | null;
  /** Vybrané hodnoty multi_select otázky; null = nemerané. */
  selected(ids: string[]): string[] | null;
  /** Veľkosť firmy je aspoň `min`. Nemeraná veľkosť → false (brána sa NEotvorí). */
  sizeAtLeast(min: string): boolean;
}

function buildFacts(answers: Answer[], questions: Question[]): Facts {
  const firstValid = (ids: string[]): Answer | undefined => {
    for (const id of ids) {
      const a = isValidAnswer(answers, id);
      if (a) return a;
    }
    return undefined;
  };

  /**
   * Otázka sa hľadá podľa DEKLAROVANÉHO KONTRAKTU (`maps_to_score`), nie
   * podľa natvrdo napísaného ID — rovnaký princíp, ktorý používa ORS.
   * Odolné voči premenovaniu otázky v databáze.
   */
  const byTag = (tag: string): Answer | undefined => {
    const ids = questions.filter(q => (q.maps_to_score ?? []).includes(tag)).map(q => q.id);
    return firstValid(ids);
  };

  return {
    value(ids) {
      const a = firstValid(ids);
      return a && typeof a.value === 'string' && a.value !== '' ? a.value : null;
    },
    selected(ids) {
      const a = firstValid(ids);
      return a && Array.isArray(a.value) ? a.value : null;
    },
    sizeAtLeast(min) {
      const a = byTag('benchmark_size');
      const v = a && typeof a.value === 'string' ? a.value : null;
      if (v === null) return false;
      const have = SIZE_ORDER.indexOf(v);
      const need = SIZE_ORDER.indexOf(min);
      return have >= 0 && need >= 0 && have >= need;
    },
  };
}

/** Odpoveď je jedna zo zadaných hodnôt. Nemeraná → false. */
const is = (f: Facts, ids: string[], vals: string[]): boolean => {
  const v = f.value(ids);
  return v !== null && vals.includes(v);
};

export function generateRecommendations(
  answers: Answer[],
  questions: Question[],
  ors: ORSScore,
  tdri: TDRIScore,
  dii: DIIScore,
  aiReadiness?: AIReadinessScore
): Recommendations {
  const facts = buildFacts(answers, questions);

  const criticalRisks = generateCriticalRisks(tdri);
  const riskMitigations = generateRiskMitigations(tdri);
  let quickWins = generateQuickWins(ors, facts);
  const strategic = generateStrategic(ors, facts);

  const aiRec = generateAIRecommendation(aiReadiness);
  if (aiRec) {
    if (aiRec.type === 'quick_win') quickWins.push(aiRec);
    else strategic.push(aiRec);
    strategic.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Potlačenie duplicít: quick win, ktorého tému už pokrýva konkrétne
  // rizikové odporúčanie, by v tej istej bunke roadmapy hovoril to isté
  // inými slovami. Rieši sa až tu, aby generateQuickWins zostal čistou
  // funkciou skóre a nemusel poznať TDRI.
  const coveredRisks = new Set(criticalRisks.flatMap(r => r.triggeredBy));
  quickWins = quickWins.filter(qw => {
    const covers = QW_COVERED_BY_RISKS[qw.id];
    return !covers || !covers.some(rf => coveredRisks.has(rf));
  });
  quickWins.sort((a, b) => b.priorityScore - a.priorityScore);

  const longTerm = generateLongTerm(ors, dii, answers);
  const strengths = generateStrengths(ors, tdri, dii, aiReadiness);

  const topQuickWins = quickWins.slice(0, 5);
  const topStrategic = strategic.slice(0, 3);

  const roadmap = {
    immediate0_3m: [
      ...criticalRisks.map(r => r.id),
      ...topQuickWins.slice(0, 3).map(r => r.id),
    ],
    // Stredné riziká idú pred strategické iniciatívy — sú to konkrétne
    // nálezy, nie zámery. Strop drží bunku čitateľnou.
    medium3_12m: [...riskMitigations.map(r => r.id), ...topStrategic.map(r => r.id)].slice(0, 6),
    longTerm12mPlus: longTerm.map(r => r.id),
  };

  return {
    strengths,
    criticalRisks,
    riskMitigations,
    quickWins: topQuickWins,
    strategicInitiatives: topStrategic,
    longTermInitiatives: longTerm,
    roadmap,
  };
}

/** Ktoré rizikové faktory pokrývajú tému quick winu (viď potlačenie duplicít). */
const QW_COVERED_BY_RISKS: Record<string, string[]> = {
  // Základná hygiena = MFA + zálohy (vrátane netestovaných) + patching.
  rec_qw_security_basics: ['RF02', 'RF03', 'RF04', 'RF05'],
};

const SEVERITY_RANK: Record<RiskFactor['severity'], number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

/**
 * Odporúčanie z rizikového faktora. Šablóny žijú v `data/riskRecommendations.ts`,
 * takže sa k nim dostane aj build validátor — predtým boli zapečené v tele
 * tejto funkcie a RF06 v nich chýbala, hoci prechádzala cez gate.
 */
function riskToRecommendation(
  factor: RiskFactor,
  type: 'critical_risk' | 'risk_mitigation',
  horizon: string
): Recommendation {
  const t = riskRecommendations[factor.id];
  // Poistka: faktor nad prahom bez šablóny by inak zmizol a používateľ by
  // videl top riziko bez akejkoľvek akcie. Build to zachytí skôr (validátor),
  // toto je druhá záchranná sieť.
  const template = t ?? {
    category: 'E',
    title: `Riešte riziko: ${factor.name}`,
    desc: 'Tento nález vyplynul z vašich odpovedí. Konkrétny postup pre neho zatiaľ nemáme spracovaný — odporúčame ho prebrať s vaším IT partnerom.',
    expectedOutcome: `Zníženie rizika: ${factor.name}`,
    urgency: factor.severity === 'critical' ? 5 : factor.severity === 'high' ? 4 : 3,
    impact: factor.severity === 'critical' ? 5 : factor.severity === 'high' ? 4 : 3,
    effort: 3,
  };

  return {
    id: `rec_risk_${factor.id}`,
    type,
    category: template.category,
    titleSk: template.title,
    descriptionSk: template.desc,
    urgency: template.urgency,
    impact: template.impact,
    effort: template.effort,
    priorityScore: priority(template.urgency, template.impact, template.effort),
    horizon,
    triggeredBy: [factor.id],
    sourceAnswers: factor.sourceAnswers,
    expectedOutcome: template.expectedOutcome,
  };
}

/** Radenie rizík: najprv závažnosť, až potom priorita v rámci nej. */
function sortRisks(recs: Recommendation[], tdri: TDRIScore): Recommendation[] {
  const severityOf = (r: Recommendation): number => {
    const f = tdri.factors.find(x => r.triggeredBy.includes(x.id));
    return f ? SEVERITY_RANK[f.severity] : 0;
  };
  return recs.sort(
    (a, b) => severityOf(b) - severityOf(a) || b.priorityScore - a.priorityScore
  );
}

function generateCriticalRisks(tdri: TDRIScore): Recommendation[] {
  const recs = tdri.factors
    .filter(f => f.active && f.penalty >= riskRecommendationGates.immediate)
    .map(f => riskToRecommendation(f, 'critical_risk', '0-3 mesiace'));

  // Test obnovy nemá zmysel, kým zálohy neexistujú — jedna odpoveď
  // („nezálohujeme") aktivuje oba faktory naraz a rady by si protirečili.
  const hasBackupGap = recs.some(r => r.triggeredBy.includes('RF02'));
  const filtered = hasBackupGap ? recs.filter(r => !r.triggeredBy.includes('RF03')) : recs;

  return sortRisks(filtered, tdri);
}

/**
 * Stredne závažné riziká do horizontu 3–12 mesiacov. Bez tohto stupňa sa
 * do odporúčaní nedostali vôbec: ich penalta je pod prahom pre okamžité
 * riziká, takže RF08/RF10/RF11/RF12 boli matematicky nedosiahnuteľné.
 */
function generateRiskMitigations(tdri: TDRIScore): Recommendation[] {
  const recs = tdri.factors
    .filter(
      f =>
        f.active &&
        f.penalty >= riskRecommendationGates.medium &&
        f.penalty < riskRecommendationGates.immediate
    )
    .map(f => riskToRecommendation(f, 'risk_mitigation', '3-12 mesiacov'));

  return sortRisks(recs, tdri).slice(0, 4);
}

function generateQuickWins(ors: ORSScore, f: Facts): Recommendation[] {
  const recs: Recommendation[] = [];
  const cats = ors.categories;
  const scoreA = measuredScore(cats, 'A');
  const scoreB = measuredScore(cats, 'B');
  const scoreC = measuredScore(cats, 'C');
  const scoreD = measuredScore(cats, 'D');
  const scoreE = measuredScore(cats, 'E');
  const scoreF = measuredScore(cats, 'F');

  if (scoreA !== null && scoreA < 40) {
    recs.push({
      id: 'rec_qw_process_auto',
      type: 'quick_win',
      category: 'A',
      titleSk: 'Digitalizujte kľúčové procesy',
      descriptionSk: 'Začnite s najčastejšími procesmi — fakturácia, schvaľovanie, reporting. Aj jednoduchá automatizácia ušetrí hodiny týždenne.',
      urgency: 4, impact: 4, effort: 2,
      priorityScore: priority(4, 4, 2),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  // Compliance, nie zrelosť — termín platí bez ohľadu na skóre kategórie.
  if (is(f, ['cx_DII02b'], ['paper', 'pdf'])) {
    recs.push({
      id: 'rec_qw_einvoicing_2027',
      type: 'quick_win',
      category: 'A',
      titleSk: 'Pripravte sa na povinnú elektronickú fakturáciu',
      descriptionSk: 'Od 1. 1. 2027 je pre B2B transakcie povinná štruktúrovaná elektronická faktúra (Peppol, norma EN 16931) — PDF poslané e-mailom nestačí. Overte, či to váš fakturačný systém zvládne, prípadne naplánujte jeho výmenu; termín je zákonný a neposúva sa.',
      urgency: 4, impact: 3, effort: 3,
      priorityScore: priority(4, 3, 3),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: ['cx_DII02b'],
      expectedOutcome: 'Fakturácia spĺňa požiadavky účinné od 1. 1. 2027',
    });
  }

  if (scoreB !== null && scoreB < 40) {
    recs.push({
      id: 'rec_qw_integration',
      type: 'quick_win',
      category: 'B',
      titleSk: 'Prepojte najpoužívanejšie systémy',
      descriptionSk: 'Aj jednoduchý connector medzi dvoma systémami zníži ručný prepis a chybovosť. Začnite s najčastejšie používanou dvojicou.',
      urgency: 3, impact: 4, effort: 2,
      priorityScore: priority(3, 4, 2),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (scoreC !== null && scoreC < 30) {
    recs.push({
      id: 'rec_qw_reporting',
      type: 'quick_win',
      category: 'C',
      titleSk: 'Nastavte automatizované reporty',
      descriptionSk: 'Využite reporting možnosti existujúcich systémov. Nemusíte kupovať BI — začnite s tým čo máte.',
      urgency: 3, impact: 3, effort: 1,
      priorityScore: priority(3, 3, 1),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  // Kategória D nemala doteraz žiadne odporúčanie pri žiadnom skóre.
  if (scoreD !== null && scoreD < 40 && is(f, ['cx_D06'], ['no', 'partial'])) {
    recs.push({
      id: 'rec_qw_remote_access',
      type: 'quick_win',
      category: 'D',
      titleSk: 'Umožnite plnohodnotnú prácu na diaľku',
      descriptionSk: 'Nasaďte VPN alebo cloudové nástroje tak, aby sa ku kľúčovým systémom dalo dostať aj mimo kancelárie. Zvyšuje to odolnosť prevádzky pri výpadku pracoviska a je to podmienka pre väčšinu ďalších krokov digitalizácie.',
      urgency: 3, impact: 3, effort: 2,
      priorityScore: priority(3, 3, 2),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: ['cx_D06'],
    });
  }

  if (scoreF !== null && scoreF < 30) {
    recs.push({
      id: 'rec_qw_ownership',
      type: 'quick_win',
      category: 'F',
      titleSk: 'Určite zodpovednú osobu za digitalizáciu',
      descriptionSk: 'Bez jasného vlastníctva sa digitalizácia neudeje. Stačí jedna osoba s mandátom a základným rozpočtom.',
      urgency: 3, impact: 3, effort: 1,
      priorityScore: priority(3, 3, 1),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (scoreE !== null && scoreE < 50) {
    recs.push({
      id: 'rec_qw_security_basics',
      type: 'quick_win',
      category: 'E',
      titleSk: 'Zabezpečte základnú kybernetickú hygienu',
      descriptionSk: 'MFA, zálohy a pravidelné aktualizácie sú tri opatrenia s najlepším pomerom prínosu k náročnosti. Implementácia je rýchla a lacná.',
      urgency: 5, impact: 5, effort: 1,
      priorityScore: priority(5, 5, 1),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  return recs.sort((a, b) => b.priorityScore - a.priorityScore);
}

function generateStrategic(ors: ORSScore, f: Facts): Recommendation[] {
  const recs: Recommendation[] = [];
  const cats = ors.categories;
  const scoreA = measuredScore(cats, 'A');
  const scoreB = measuredScore(cats, 'B');
  const scoreC = measuredScore(cats, 'C');
  const scoreD = measuredScore(cats, 'D');
  const scoreE = measuredScore(cats, 'E');
  const scoreF = measuredScore(cats, 'F');

  // ERP má zmysel až od určitej veľkosti — trojosobovej firme sa dovtedy
  // odporúčal tiež, lebo pravidlo bežalo len na skóre.
  if (scoreA !== null && scoreA < 50 && f.sizeAtLeast('small')) {
    recs.push({
      id: 'rec_str_erp',
      type: 'strategic',
      category: 'A',
      titleSk: 'Implementujte integrovaný podnikový systém',
      descriptionSk: 'ERP alebo integrovaný systém pre riadenie kľúčových procesov (objednávky, fakturácia, sklad, výroba).',
      urgency: 3, impact: 5, effort: 4,
      priorityScore: priority(3, 5, 4),
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (scoreB !== null && scoreB < 50) {
    recs.push({
      id: 'rec_str_integration',
      type: 'strategic',
      category: 'B',
      titleSk: 'Vytvorte integračnú stratégiu',
      descriptionSk: 'Definujte source of truth pre kľúčové dáta a prepojte systémy. Eliminujte dvojitý zápis a CSV chaos.',
      urgency: 3, impact: 4, effort: 3,
      priorityScore: priority(3, 4, 3),
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  // Pásmo C 30–49 nemalo dovtedy žiadne odporúčanie: quick win končil pri 30,
  // strategické pravidlo neexistovalo.
  if (scoreC !== null && scoreC < 50 && f.sizeAtLeast('medium')) {
    recs.push({
      id: 'rec_str_bi',
      type: 'strategic',
      category: 'C',
      titleSk: 'Nasaďte reportingový alebo BI nástroj',
      descriptionSk: 'Pri vašej veľkosti už ručne skladané výkazy stoja viac času, než koľko by stál nástroj. Vyberte si podľa toho, kde dáta reálne vznikajú, a začnite jedným okruhom — napríklad predajom alebo výrobou.',
      urgency: 3, impact: 4, effort: 3,
      priorityScore: priority(3, 4, 3),
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  // Migrácia do cloudu sa neodporúča firme, ktorá už hybrid alebo cloud má.
  if (scoreD !== null && scoreD < 40 && is(f, ['cx_D02', 'ind_08'], ['onprem', 'hosted'])) {
    recs.push({
      id: 'rec_str_cloud_migration',
      type: 'strategic',
      category: 'D',
      titleSk: 'Pripravte migračný plán do cloudu alebo hybrid modelu',
      descriptionSk: 'Vlastný server viaže kapitál, údržbu aj zodpovednosť za obnovu na vás. Vyhodnoťte po systémoch, čo presunúť do cloudu, v akom poradí a s akým dopadom na náklady a bezpečnosť — migrácia naraz je najdrahšia cesta.',
      urgency: 3, impact: 4, effort: 4,
      priorityScore: priority(3, 4, 4),
      horizon: '6-12 mesiacov',
      triggeredBy: [], sourceAnswers: ['cx_D02'],
    });
  }

  if (scoreE !== null && scoreE < 50) {
    recs.push({
      id: 'rec_str_security',
      type: 'strategic',
      category: 'E',
      titleSk: 'Vypracujte bezpečnostnú stratégiu',
      descriptionSk: 'Nad rámec základnej hygieny: bezpečnostná politika, plán riešenia incidentov, pravidelný audit a školenia zamestnancov. Ak vaša firma spadá pod NIS2 (zákon č. 366/2024 Z. z.), časť z toho je priamo povinná — overte si zaradenie podľa sektora a veľkosti.',
      urgency: 4, impact: 4, effort: 3,
      priorityScore: priority(4, 4, 3),
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  if (scoreF !== null && scoreF < 40) {
    recs.push({
      id: 'rec_str_roadmap',
      type: 'strategic',
      category: 'F',
      titleSk: 'Vytvorte digitalizačnú roadmapu',
      descriptionSk: 'Strategický plán s prioritami, rozpočtom, KPI a časovým rámcom. Základ pre systematickú digitalizáciu.',
      urgency: 3, impact: 4, effort: 2,
      priorityScore: priority(3, 4, 2),
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

  if (ors.scorePenalized !== null && ors.scorePenalized > 60) {
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
        priorityScore: priority(2, 4, 3),
        horizon: '12+ mesiacov',
        triggeredBy: [], sourceAnswers: [],
      });
    }
  }

  if (ors.scorePenalized !== null && ors.scorePenalized > 70) {
    recs.push({
      id: 'rec_lt_transformation',
      type: 'long_term',
      category: 'F',
      titleSk: 'Digitálna transformácia business modelu',
      descriptionSk: 'Máte silnú digitálnu základňu — zvážte, ako digitalizácia môže zmeniť váš business model, nie len optimalizovať existujúce procesy.',
      urgency: 1, impact: 5, effort: 5,
      priorityScore: priority(1, 5, 5),
      horizon: '12+ mesiacov',
      triggeredBy: [], sourceAnswers: [],
    });
  }

  return recs;
}

function generateAIRecommendation(aiReadiness?: AIReadinessScore): Recommendation | null {
  if (!aiReadiness || !aiReadiness.measured || aiReadiness.score === null) return null;

  if (aiReadiness.score <= 25) {
    return {
      id: 'rec_ai_start',
      type: 'quick_win',
      category: 'AI',
      titleSk: 'Začnite experimentovať s AI nástrojmi',
      descriptionSk: 'Nasaďte AI asistenta (napr. ChatGPT, Copilot) na jeden konkrétny opakujúci sa proces — reporting, odpovede zákazníkom, sumarizácia dokumentov. Rýchly, lacný spôsob ako overiť prínos bez veľkej investície.',
      urgency: 3, impact: 4, effort: 1,
      priorityScore: priority(3, 4, 1),
      horizon: '0-3 mesiace',
      triggeredBy: [], sourceAnswers: [],
      expectedOutcome: 'Prvá overená AI aplikácia a základ pre ďalšie kroky',
    };
  }

  if (aiReadiness.score <= 55) {
    return {
      id: 'rec_ai_scale',
      type: 'strategic',
      category: 'AI',
      titleSk: 'Rozšírte AI z experimentov do produkcie',
      descriptionSk: 'Vyberte 2-3 procesy s najvyšším potenciálom (fakturácia, zákaznícka podpora, reporting) a nasaďte AI produkčne s meraním prínosu. Zaveďte aj základné pravidlá používania.',
      urgency: 3, impact: 4, effort: 3,
      priorityScore: priority(3, 4, 3),
      horizon: '3-12 mesiacov',
      triggeredBy: [], sourceAnswers: [],
      expectedOutcome: 'AI ako súčasť bežnej prevádzky, nie len experiment',
    };
  }

  return {
    id: 'rec_ai_govern',
    type: 'strategic',
    category: 'AI',
    titleSk: 'Formalizujte AI governance',
    descriptionSk: 'Máte solídne využitie AI — doplňte formálnu politiku (dátová bezpečnosť, zodpovedná osoba, školenia), aby rast využitia AI nepredbehol riadenie rizík.',
    urgency: 2, impact: 3, effort: 2,
    priorityScore: priority(2, 3, 2),
    horizon: '3-12 mesiacov',
    triggeredBy: [], sourceAnswers: [],
    expectedOutcome: 'Bezpečné a riadené škálovanie AI naprieč firmou',
  };
}

function generateStrengths(
  ors: ORSScore,
  tdri: TDRIScore,
  dii: DIIScore,
  aiReadiness?: AIReadinessScore
): Strength[] {
  const strengths: Strength[] = [];

  for (const [cat, data] of Object.entries(ors.categories)) {
    if (data.measured && data.score !== null && data.score >= 70) {
      strengths.push({
        category: cat,
        descriptionSk: `${data.name}: Nadpriemerná úroveň (${Math.round(data.score)}/100)`,
      });
    }
  }

  // Pásmo, nie číslo — prah je jeden, v konfigurácii.
  if (getRiskLevel(tdri.score) === 'low') {
    strengths.push({
      category: 'E',
      descriptionSk: 'Nízky technologický dlh — dobre riadená infraštruktúra a bezpečnosť',
    });
  }

  if (dii.measured && dii.score100 !== null && dii.score100 >= 75) {
    strengths.push({
      category: 'DII',
      descriptionSk: 'Vysoká digitálna intenzita — aktívne využívanie digitálnych nástrojov',
    });
  }

  if (aiReadiness?.measured && aiReadiness.score !== null && aiReadiness.score >= 70) {
    strengths.push({
      category: 'AI',
      descriptionSk: 'Vyspelé využitie AI — firma je v tejto oblasti pred väčšinou trhu',
    });
  }

  return strengths;
}

