import type { ScoringConfig, ScenarioValues } from '@/types';

export const scoringConfig: ScoringConfig = {
  version: '1.5',
  diiMethodologyVersion: 'DII v3 (Eurostat isoc_e_dii, prieskum 2025)',
  categoryWeights: {
    A: 0.20,
    B: 0.20,
    C: 0.15,
    D: 0.15,
    E: 0.20,
    F: 0.10,
  },
  maturityThresholds: [20, 40, 60, 80],
  riskThresholds: [15, 35, 60],
  securityPenaltyThreshold: 30,
  securityPenaltyMaxFactor: 0.30,
  unknownAnswerExclusionThreshold: 0.50,
  unknownAnswerMediumThreshold: 0.25,
  // DII v3/2025 má 12 indikátorov. Pri prechode na v4 (prieskum december
  // 2026) sa zmení počet aj mapovanie — hodnota tu je preto, aby sa nemusela
  // hľadať po engine a aby bolo pri revízii zjavné, čo všetko na nej visí.
  diiTotalIndicators: 12,
  diiLevelCutoffs: [3, 6, 9],
  diiConfidenceMinIndicators: { high: 10, medium: 6 },
  aiConfidenceMinAnswers: 2,
  pilotCriteria: {
    cronbachAlphaMin: 0.80,
    completionRateMin: 0.85,
    unknownAnswerRateMax: 0.10,
    orsToCorrelationMin: 0.50,
    minPilotSampleSize: 200,
    itemDiscriminationMin: 0.30,
  },
};

export const maturityLabels: Record<number, string> = {
  0: 'Digitálny nováčik',
  1: 'Začiatočník',
  2: 'Rozvíjajúci sa',
  3: 'Pokročilý',
  4: 'Digitálny líder',
};

export const diiLevelLabels: Record<string, string> = {
  very_low: 'Veľmi nízka digitálna intenzita',
  low: 'Nízka digitálna intenzita',
  high: 'Vysoká digitálna intenzita',
  very_high: 'Veľmi vysoká digitálna intenzita',
};

// AI & Automatizácia Readiness — prierezový index (rovnaká logika ako TDRI),
// počítaný z otázok naprieč kategóriami A/F/DII označených 'ai_readiness'.
export const aiReadinessThresholds = [25, 55, 80];

export const aiReadinessLabels: Record<string, string> = {
  ziadna: 'Bez využitia AI',
  experimentalna: 'Experimentálne využitie AI',
  pokrocila: 'Pokročilé využitie AI',
  strategicka: 'AI ako súčasť stratégie',
};

export const riskLevelLabels: Record<string, string> = {
  low: 'Dobre riadené',
  medium: 'Vyžaduje pozornosť',
  high: 'Vyžaduje okamžitú akciu',
  critical: 'Ohrozenie prevádzky',
};

export const categoryNames: Record<string, string> = {
  A: 'Procesy a digitalizácia práce',
  B: 'Systémy a integrácie',
  C: 'Dáta a reporting',
  D: 'Infraštruktúra a cloud',
  E: 'Bezpečnosť a technologický dlh',
  F: 'Governance a ľudia',
};

/**
 * Sila dôkazu o riziku — oddelená od jeho závažnosti.
 *
 * Závažnosť už je zapečená v `maxPenalty` (kritické faktory ho majú 15,
 * stredné 4–6), takže ju netreba počítať druhýkrát. Predtým sa násobilo
 * oboje naraz a vznikla inverzia: potvrdené stredné riziko dostalo 0,6×
 * maxPenalty, kým to isté riziko iba ODVODENÉ z nízkeho skóre dostalo 0,8×.
 * Priznanie problému teda skórovalo lepšie než dohad — a zlepšenie odpovede
 * vedelo index rizika zvýšiť.
 *
 * Poradie confirmed > inferred_strong > inferred_moderate platí pre každú
 * závažnosť; stráži to test.
 */
export const riskConfidenceMultipliers = {
  /** Otázka priamo spustila flag_risk — firma problém potvrdila. */
  confirmed: 1.0,
  /** Nepotvrdené, ale skóre súvisiacich otázok je veľmi nízke. */
  inferred_strong: 0.7,
  /** Nepotvrdené, skóre je stredné. */
  inferred_moderate: 0.35,
} as const;

/** Hranice priemerného skóre, od ktorých sa riziko odvodzuje. */
export const riskInferenceThresholds: [number, number] = [30, 60];

export const riskFactorDefinitions = [
  { id: 'RF01', name: 'Out-of-support core OS/DB', maxPenalty: 15, severity: 'critical' as const },
  { id: 'RF02', name: 'Chýbajúce zálohy core dát', maxPenalty: 15, severity: 'critical' as const },
  { id: 'RF03', name: 'Zálohy existujú, ale netestované', maxPenalty: 8, severity: 'high' as const },
  { id: 'RF04', name: 'Chýbajúci patch management', maxPenalty: 10, severity: 'critical' as const },
  { id: 'RF05', name: 'Absencia MFA na kritických systémoch', maxPenalty: 10, severity: 'critical' as const },
  { id: 'RF06', name: 'Single point of failure (infraštruktúra)', maxPenalty: 8, severity: 'high' as const },
  { id: 'RF07', name: 'Single point of failure (ľudia)', maxPenalty: 8, severity: 'high' as const },
  { id: 'RF08', name: 'Nezdokumentované/neowned systémy', maxPenalty: 5, severity: 'medium' as const },
  { id: 'RF09', name: 'Žiadny BC/DR plán', maxPenalty: 7, severity: 'high' as const },
  { id: 'RF10', name: 'Žiadny asset inventory', maxPenalty: 4, severity: 'medium' as const },
  { id: 'RF11', name: 'Žiadne logovanie/monitoring', maxPenalty: 5, severity: 'medium' as const },
  { id: 'RF12', name: 'Out-of-support aplikácie (nie core)', maxPenalty: 5, severity: 'medium' as const },
  { id: 'RF13', name: 'Nepripravenosť na povinnú e-fakturáciu (od 1.1.2027)', maxPenalty: 6, severity: 'medium' as const },
  { id: 'RF14', name: 'Nepripravenosť na NIS2 (ak sa firmu týka)', maxPenalty: 6, severity: 'medium' as const },
];

/**
 * Súčet všetkých maxPenalty — menovateľ normalizácie TDRI.
 *
 * POČÍTA sa z definícií, nikdy sa nepíše ako literál: pri pridaní pätnásteho
 * faktora by inak strop ticho vyskočil a pásma by prestali sedieť.
 *
 * Bez normalizácie bolo TDRI 100 nedosiahnuteľné — reálne maximum bolo ~93
 * (a v dokumentácii sa uvádzali dokonca dve rôzne čísla, 93,4 a 86,2), takže
 * pásmo „kritické 61–100" bolo fakticky 61–93.
 */
export const tdriMaxPenaltySum = riskFactorDefinitions.reduce((s, d) => s + d.maxPenalty, 0);

/**
 * Dva stupne naliehavosti pre rizikové odporúčania.
 *
 * `immediate` mieri do roadmapy 0–3 mesiace, `medium` do 3–12 mesiacov.
 * Prahy sú na normalizovanej škále (po delení tdriMaxPenaltySum). Stredné
 * riziká sa dovtedy do odporúčaní nedostali vôbec: ich maximum bolo 4,0 pri
 * jedinom gate 5, takže RF08/RF10/RF11/RF12 boli matematicky nedosiahnuteľné.
 */
export const riskRecommendationGates = { immediate: 5, medium: 2.5 } as const;

// Hodinová cena práce pre ROI výpočet — už sa nepýtame firmu (citlivý údaj, zbytočná
// záťaž respondenta); vždy používame priemer IT/telekomunikačného sektora SR, keďže
// procesy, ktoré appka pomáha automatizovať, typicky rieši alebo zastrešuje IT/technický
// tím a nástroj cielime na rozhodovanie o digitalizačných investíciách.
// Zdroj: Eurostat lc_lci_lev 2025 — SK, NACE J (Informácie a komunikácia), celková cena
// práce vrátane odvodov zamestnávateľa (D1_D4_MD5 = 30,8 €/h; z toho mzdy D11 = 22,4 €/h,
// nemzdové náklady 8,4 €/h). Kontrolný súčet: Trexima ISCP priemer IT profesií (vývojári,
// analytici, programátori) ~2 933 €/mes. hrubého × odvodový multiplikátor 1,362 ≈ 23 €/h
// (wages-only) — rádovo konzistentné s Eurostat D11. Revízia: ročne (aprílová publikácia
// Eurostatu, dataset lc_lci_lev).
export const defaultHourlyCostEur = 30.8;

// Procesné benchmarky sú interné expertné odhady (frekvencie, časy, automatizovateľnosť) —
// zatiaľ bez externého zdroja; každý výstup ROI ich označuje ako benchmark v audit traile.
// TODO (checklist): doplniť zdroje (APQC/procesné štúdie) alebo kalibrovať z vlastných dát.
export const processBenchmarks: Record<string, {
  frequencyPerMonth: Record<string, number>;
  timePerUnitMinutes: number;
  automatableShare: number;
  errorRate: number;
  reworkMinutesPerError: number;
  exceptionRate: number;
}> = {
  invoicing: {
    frequencyPerMonth: { micro: 20, small: 50, medium: 200, large: 500 },
    timePerUnitMinutes: 15,
    automatableShare: 0.70,
    errorRate: 0.05,
    reworkMinutesPerError: 25,
    exceptionRate: 0.08,
  },
  reporting: {
    frequencyPerMonth: { micro: 2, small: 4, medium: 12, large: 30 },
    timePerUnitMinutes: 60,
    automatableShare: 0.80,
    errorRate: 0.08,
    reworkMinutesPerError: 45,
    exceptionRate: 0.05,
  },
  approval_workflows: {
    frequencyPerMonth: { micro: 10, small: 20, medium: 60, large: 150 },
    timePerUnitMinutes: 30,
    automatableShare: 0.75,
    errorRate: 0.02,
    reworkMinutesPerError: 20,
    exceptionRate: 0.10,
  },
  order_processing: {
    frequencyPerMonth: { micro: 15, small: 30, medium: 150, large: 400 },
    timePerUnitMinutes: 20,
    automatableShare: 0.60,
    errorRate: 0.03,
    reworkMinutesPerError: 30,
    exceptionRate: 0.07,
  },
  hr_onboarding: {
    frequencyPerMonth: { micro: 0.5, small: 1, medium: 4, large: 10 },
    timePerUnitMinutes: 480,
    automatableShare: 0.40,
    errorRate: 0.10,
    reworkMinutesPerError: 120,
    exceptionRate: 0.15,
  },
  // Tri procesy, ktoré sa v cx_A05 dali označiť, ale benchmark pre ne
  // neexistoval — respondent ich označil za ručné a z ROI ticho vypadli.
  // Frekvencie, časy, automatizovateľnosť a chybovosť sú z ROI_MODEL §2.2;
  // hodnoty pre mikrofirmy a rework/exception sú expertný odhad odvodený
  // pomerom, ktorý držia ostatné záznamy (micro ≈ 0,4 × small).
  inventory_management: {
    frequencyPerMonth: { micro: 8, small: 20, medium: 100, large: 300 },
    timePerUnitMinutes: 10,
    automatableShare: 0.65,
    errorRate: 0.04,
    reworkMinutesPerError: 20,
    exceptionRate: 0.09,
  },
  field_service: {
    frequencyPerMonth: { micro: 16, small: 40, medium: 200, large: 600 },
    timePerUnitMinutes: 12,
    automatableShare: 0.35,
    errorRate: 0.05,
    reworkMinutesPerError: 25,
    exceptionRate: 0.12,
  },
  purchasing: {
    frequencyPerMonth: { micro: 6, small: 15, medium: 60, large: 180 },
    timePerUnitMinutes: 25,
    automatableShare: 0.55,
    errorRate: 0.04,
    reworkMinutesPerError: 30,
    exceptionRate: 0.08,
  },
};

/**
 * Väzba hodnoty odpovede cx_A05 na kľúč v `processBenchmarks`.
 *
 * Bez nej sa väzba držala len zhodou názvov, takže tri hodnoty (sklad, servis,
 * nákup) nemali benchmark a ticho z ROI vypadli — respondent ich označil za
 * ručné a vo výsledku sa neprejavili.
 */
export const processKeyFromAnswerValue: Record<string, string> = {
  invoicing: 'invoicing',
  hr_onboarding: 'hr_onboarding',
  reporting: 'reporting',
  warehouse: 'inventory_management',
  service: 'field_service',
  purchasing: 'purchasing',
};

/**
 * Stredy pásiem cx_ROI03 (faktúry vydané + prijaté za mesiac).
 * Pásma sa čítajú ako [0,50], (50,200], (200,500], (500,∞); pri otvorenom
 * hornom pásme je kotva konzervatívna, nie extrapolácia.
 */
export const invoicingVolumeFromBand: Record<string, number> = {
  low: 25,
  medium: 125,
  high: 350,
  very_high: 700,
};

/**
 * Kapacita administratívy z cx_ROI02. Headcount NIE JE objem — je to strop:
 * benchmarkové frekvencie procesov nemôžu spotrebovať viac hodín, než koľko
 * ich admin tím vôbec má. Preto sa ním odhad len znižuje, nikdy nezvyšuje.
 */
export const adminFteFromBand: Record<string, number> = {
  '1_3': 2,
  '4_10': 7,
  '11_30': 20,
  '30_plus': 40,
};
/** 52 × 40 h mínus dovolenka, sviatky a PN. */
export const workingHoursPerFteYear = 1700;
/** Podiel času administratívneho pracovníka, ktorý padne na modelované procesy. */
export const adminAgendaShareOfFte = 0.6;

/**
 * Proces, ktorý firma sama označila za prevažne ručný (cx_A05), je priama
 * evidencia o podiele manuálnej práce a prebíja odhad z celofiremnej maturity.
 * Je to DOLNÁ hranica, nie fixná hodnota — pri maturity 0 je globálny podiel
 * 0,90 a plochých 0,85 by najmenej zrelým firmám úsporu znížilo.
 */
export const manualShareWhenSelfReportedManual = 0.85;

/**
 * Prahy governance (ORS kategória F) pre zobrazenie scenárov — ROI_MODEL §5.3.
 * Bez doloženej organizačnej pripravenosti sa optimistický scenár nezobrazuje;
 * doteraz sa k nemu len pridával disclaimer, ktorý číslo nijako nekrotil.
 */
export const governanceScenarioGates = { high: 75, standard: 50 };

/**
 * Prahy zámeru investovať (škála 0–10 z `ind_16_intent`/`cx_F07_intent`).
 *
 * Governance meria KAPACITU realizovať, zámer meria VÔĽU. Sú to nezávislé
 * podmienky a úsporu obmedzuje tá slabšia — firma s výbornou governance
 * a nulovou chuťou investovať nezrealizuje nič, rovnako ako odhodlaná firma
 * bez organizačnej pripravenosti. Výsledná brána je preto **prísnejšia
 * z oboch**, nie ich priemer.
 *
 * Hodnoty: 8+ z 10 je jasné „áno" (horná tretina škály), 5+ je otvorenosť
 * bez záväzku, pod 5 už respondent hovorí skôr „nie" — a vtedy nemá zmysel
 * ukazovať mu scenár, ktorý predpokladá plnú realizáciu.
 */
export const investmentIntentGates = { high: 8, standard: 5 };

/**
 * Zrelosť, s ktorou sa počíta, keď ju dotazník nezistil (otázka preskočená,
 * „Neviem", alebo hodnota mimo domény 0–4).
 *
 * Stredná úroveň zámerne: najnižšia by úsporu nafúkla (90 % ručnej práce),
 * najvyššia by ju takmer zmazala (5 %). Predpoklad sa v ROI priznáva
 * disclaimerom a zastropovanou dôveryhodnosťou, rovnako ako neuvedená
 * veľkosť firmy — nedosádza sa ticho.
 */
export const assumedMaturityLevel = 2;

export const manualShareFromMaturity: Record<number, number> = {
  0: 0.90,
  1: 0.65,
  2: 0.40,
  3: 0.15,
  4: 0.05,
};

// Realizačné scenáre pre Business Impact — akú časť teoreticky identifikovaného
// potenciálu firma reálne dosiahne (viď ROI_MODEL.md §5).
export const realizationRates: ScenarioValues = {
  conservative: 0.40,
  mid: 0.65,
  optimistic: 0.85,
};

// Krivky úspory (SavingsCurveChart): počet mesiacov lineárneho nábehu k plnému
// ročnému run-rate pre daný scenár — rýchlejšia realizácia je typicky spojená
// s vyššou mierou úspešnej implementácie, preto optimistic < mid < conservative.
// Zjednodušený, ilustratívny predpoklad (nie empiricky kalibrovaná adopčná krivka).
export const rampUpMonthsByScenario: ScenarioValues = {
  conservative: 9,
  mid: 6,
  optimistic: 3,
};

// Horizont zobrazenej krivky kumulatívnej úspory.
export const savingsProjectionHorizonMonths = 24;
