// ============================================
// digitalizuj.to — Core Type Definitions
// ============================================

// --- Question Types ---

export type QuestionType =
  | 'single_choice'
  | 'multi_select'
  | 'yes_no'
  | 'numeric_input'
  | 'numeric_bands'
  | 'maturity_scale';

export interface QuestionOption {
  value: string;
  label: string;
  score: number;
}

export interface NumericBand {
  min: number;
  max: number;
  label: string;
  value: string;
}

export interface BranchingRule {
  condition: string;
  action: 'skip' | 'include' | 'flag_risk';
  target: string | string[];
  reason: string;
}

export interface Question {
  id: string;
  category: string;
  dimension: string;
  question_sk: string;
  question_type: QuestionType;
  weight: number;
  options?: QuestionOption[];
  bands?: NumericBand[];
  max_score?: number;
  scoring_note?: string;
  branching_rules: BranchingRule[];
  evidence_type: string;
  maps_to_score: string[];
  maps_to_risk: string[];
  maps_to_roi_model: string[];
  tooltip?: string | null;
  allow_unknown: boolean;
  // Psychometric metadata (populated after pilot validation)
  discrimination?: number | null;  // Item-Total correlation or IRT discrimination param
  difficulty?: number | null;      // Mean score / max score (0-1)
  pilotN?: number | null;          // Sample size from pilot validation
}

export interface QuizModule {
  id: string;
  name: string;
  category: string;
  questions: Question[];
}

export interface QuizDefinition {
  id: string;
  name: string;
  description: string;
  max_questions?: number;
  questions?: Question[];
  modules?: QuizModule[];
}

export interface QuestionBank {
  version: string;
  last_updated: string;
  indicative_quiz: QuizDefinition;
  complex_quiz: QuizDefinition;
}

// --- Answer Types ---

export interface Answer {
  questionId: string;
  value: string | string[];
  score: number;
  isUnknown: boolean;
  wasSkipped: boolean;
  skipReason?: string;
  timestamp: string;
}

// --- Assessment Types ---

export type AssessmentType = 'indicative' | 'complex';
export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed';

export interface Respondent {
  sector: string;
  employeeCountBand: 'micro' | 'small' | 'medium' | 'large' | '';
  revenueBand?: string;
}

export interface Assessment {
  id: string;
  type: AssessmentType;
  status: AssessmentStatus;
  createdAt: string;
  completedAt?: string;
  respondent: Respondent;
  answers: Answer[];
  currentQuestionIndex: number;
  skippedQuestions: Set<string>;
  riskFlags: Set<string>;
  result?: ResultSnapshot;
}

// --- Score Types ---

/**
 * Stav jedného z 12 oficiálnych DII v3/2025 indikátorov — audit trail
 * per-indikátorovej agregácie (mapovanie v data/diiIndicators.json).
 */
export interface DIIIndicator {
  code: string; // 'DII1' … 'DII12'
  nameSk: string;
  status: 'met' | 'not_met' | 'unmeasured';
  /** Kritériové otázky s platnou odpoveďou, z ktorých status vychádza. */
  sourceQuestions: string[];
}

/**
 * DII skóre s per-indikátorovou agregáciou. score12 je EXTRAPOLÁCIA
 * (splnené / merané × 12) — nemerané indikátory skóre nefabrikujú,
 * pokrytie priznáva measuredIndicators + confidence. measured=false
 * (žiadny meraný indikátor) ⇒ score/level polia sú null.
 */
export interface DIIScore {
  /** Jemná metrika: priemer skóre platných odpovedí namapovaných otázok. */
  score100: number | null;
  /** Extrapolovaný odhad na Eurostat škále 0–12. */
  score12: number | null;
  measured: boolean;
  measuredIndicators: number; // 0–12
  metIndicators: number; // 0–12, podmnožina meraných
  confidence: 'high' | 'medium' | 'low';
  level: 'very_low' | 'low' | 'high' | 'very_high' | null;
  levelLabelSk: string | null;
  /** Vždy 12 riadkov — po jednom pre každý v3/2025 indikátor. */
  indicators: DIIIndicator[];
}

/**
 * Skóre ODRM kategórie. measured=false (žiadna platná odpoveď) ⇒
 * score/contribution sú null a kategória NEVSTUPUJE do váženého ORS —
 * nezmerané nie je nula (vzor AIReadinessScore).
 */
export interface CategoryScore {
  name: string;
  score: number | null;
  measured: boolean;
  weight: number;
  contribution: number | null;
  answeredQuestions: number;
  totalQuestions: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * ORS s renormalizáciou cez merané kategórie: skóre = vážený priemer
 * len cez kategórie s measured=true (súčet váh meraných v menovateli).
 * Žiadna meraná kategória ⇒ score/scorePenalized/maturity sú null.
 */
export interface ORSScore {
  score: number | null;
  scorePenalized: number | null;
  measuredCategories: number; // 0–6
  maturityLevel: number | null;
  maturityLabelSk: string | null;
  categories: Record<string, CategoryScore>;
  penaltyApplied: boolean;
  penaltyReason: string | null;
}

export interface RiskFactor {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium';
  maxPenalty: number;
  penalty: number;
  active: boolean;
  evidence: string;
  sourceAnswers: string[];
}

/**
 * AI & Automatizácia Readiness — prierezový index (rovnaká architektúra ako TDRI):
 * počíta sa z otázok naprieč kategóriami A/F/DII označených 'ai_readiness',
 * nie je jednou zo 6 ODRM kategórií ani nemení radar/benchmark.
 */
export interface AIReadinessScore {
  score: number | null;
  measured: boolean;
  level: 'ziadna' | 'experimentalna' | 'pokrocila' | 'strategicka';
  levelLabelSk: string;
  confidence: 'low' | 'medium' | 'high';
  answeredQuestions: number;
  totalQuestions: number;
}

export interface TDRIScore {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskLabelSk: string;
  factors: RiskFactor[];
  topRisks: string[];
}

export interface ScenarioValues {
  conservative: number;
  mid: number;
  optimistic: number;
}

export interface CalculationAuditEntry {
  process: string;
  frequencyYearly: number;
  timePerCaseH: number;
  manualShare: number;
  automatableShare: number;
  savedHours: number;
  errorCostHours: number;
  dataSource: string;
}

/** Jeden bod na krivke kumulatívnej úspory (mesiac 0 = štart, hodnoty v EUR). */
export interface SavingsCurvePoint {
  month: number;
  conservative: number;
  mid: number;
  optimistic: number;
}

/**
 * Časová projekcia kumulatívnej úspory pre 3 scenáre — lineárny nábeh
 * k plnému ročnému run-rate počas `rampUpMonths[scenár]` mesiacov, potom
 * lineárny rast pri plnej mesačnej sadzbe. Zjednodušený, ilustratívny model
 * (nie empiricky kalibrovaná adopčná krivka) — pozri disclaimers.
 */
export interface SavingsProjection {
  horizonMonths: number;
  rampUpMonths: ScenarioValues;
  points: SavingsCurvePoint[];
}

export interface BusinessImpact {
  timeSavings: {
    hoursPerYear: ScenarioValues;
    mdPerYear: ScenarioValues;
  };
  errorCostReduction: {
    errorsPreventedPerYear: number;
    reworkHoursSaved: ScenarioValues;
    eurSaved: ScenarioValues;
  };
  financialImpact: {
    eurPerYear: ScenarioValues;
    confidence: number;
    confidenceLabelSk: string;
  };
  savingsProjection: SavingsProjection;
  riskReduction: {
    currentLevel: string;
    potentialLevel: string;
    keyMitigations: string[];
  };
  opportunityGap: {
    descriptionSk: string;
    gapPercentage: number;
    benchmarkComparisonSk: string;
  };
  disclaimers: string[];
  calculationAudit: CalculationAuditEntry[];
}

export interface BenchmarkComparison {
  /** Chýba (undefined), keď percentil nie je vyčísliteľný — UI ho nevykreslí. */
  percentile?: number;
  /** null = porovnanie nedostupné (nemerané skóre alebo chýbajúce referenčné dáta). */
  gap: number | null;
  labelSk: string;
  disclaimer?: string;
}

export interface BenchmarkResults {
  /** Domáci trh porovnania — odvodený od jazykovej mutácie (sk→SK, cs→CZ,
   *  en→EU27). Staré uložené výsledky pole nemajú; fallback je SK. */
  homeMarket?: 'SK' | 'CZ' | 'EU27';
  diiVsSk: BenchmarkComparison;
  diiVsEu: BenchmarkComparison;
  diiVsSector: BenchmarkComparison & { sector: string };
  orsVsSector: BenchmarkComparison;
}

export interface Recommendation {
  id: string;
  type: 'critical_risk' | 'quick_win' | 'strategic' | 'long_term';
  category: string;
  titleSk: string;
  descriptionSk: string;
  urgency: number;
  impact: number;
  effort: number;
  priorityScore: number;
  horizon: string;
  triggeredBy: string[];
  sourceAnswers: string[];
  expectedOutcome?: string;
}

export interface Strength {
  category: string;
  descriptionSk: string;
}

export interface Recommendations {
  strengths: Strength[];
  criticalRisks: Recommendation[];
  quickWins: Recommendation[];
  strategicInitiatives: Recommendation[];
  longTermInitiatives: Recommendation[];
  roadmap: {
    immediate0_3m: string[];
    medium3_12m: string[];
    longTerm12mPlus: string[];
  };
}

export interface ModelVersionInfo {
  questionBankVersion: string;
  scoringConfigVersion: string;
  benchmarkDataVersion: string;
  diiMethodologyVersion: string;
  computedAt: string;
}

export interface ResultSnapshot {
  assessmentId: string;
  modelVersion: ModelVersionInfo;
  dii: DIIScore;
  ors: ORSScore;
  tdri: TDRIScore;
  aiReadiness: AIReadinessScore;
  businessImpact: BusinessImpact;
  benchmarks: BenchmarkResults;
  recommendations: Recommendations;
}

// --- Customer Zone (peer snapshots) ---

/**
 * Anonymized snapshot of a single completed assessment.
 * Used for peer benchmarking. Never contains PII or per-question answers.
 */
export interface PeerSnapshot {
  hash: string;                  // 12-char hex hash, URL-safe id
  /**
   * Verzia schémy snapshotu. Absentuje = legacy v1 (pred per-indikátorovým
   * DII a N/A kategóriami): diiScore12 bol hrubý prepočet priemeru, N/A
   * kategórie boli ticho uložené ako 0 — UI ich zobrazuje s poznámkou
   * o staršej metodike. v2 = extrapolované DII + nullable kategórie.
   */
  schemaVersion?: 2;
  sector: string;                // sector key (e.g. "manufacturing")
  sizeBand: 'micro' | 'small' | 'medium' | 'large';
  country: 'SK';
  diiScore100: number | null;    // 0–100; null = DII nemerané (len v2)
  diiScore12: number | null;     // 0–12; v2 = extrapolovaný odhad, v1 = raw prepočet
  /** Počet meraných DII indikátorov (0–12) — nesie „priznanie“ odhadu (len v2). */
  diiMeasured?: number;
  orsScore: number | null;       // 0–100; v2 = renormalizovaný cez merané kategórie
  tdriScore: number;             // 0–100 (higher = worse)
  businessImpactEur: number;     // mid scenario, EUR/year
  completedAt: string;           // ISO date
  // Per-category breakdown (procesy, systémy, dáta, infra, security, governance)
  // null = kategória nemeraná (len v2; v1 ukladalo N/A ako 0 bez rozlíšenia)
  orsCategories: {
    procesy: number | null;
    systemy: number | null;
    data: number | null;
    infra: number | null;
    security: number | null;
    governance: number | null;
  };
}

// --- Config Types ---

export interface PilotAcceptanceCriteria {
  cronbachAlphaMin: number;         // ≥ 0.80
  completionRateMin: number;        // ≥ 0.85
  unknownAnswerRateMax: number;     // ≤ 0.10 per question
  orsToCorrelationMin: number;  // target ORS-DII correlation
  minPilotSampleSize: number;       // ≥ 200
  itemDiscriminationMin: number;    // ≥ 0.30
}

export interface ScoringConfig {
  version: string;
  diiMethodologyVersion: string;
  categoryWeights: Record<string, number>;
  maturityThresholds: number[];
  riskThresholds: number[];
  securityPenaltyThreshold: number;
  securityPenaltyMaxFactor: number;
  unknownAnswerExclusionThreshold: number;
  pilotCriteria: PilotAcceptanceCriteria;
}
