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

export interface DIIIndicator {
  id: string;
  name: string;
  score: number;
  binary: boolean;
  sourceAnswers: string[];
}

export interface DIIScore {
  score100: number;
  score12: number;
  pureBinary: number;
  level: 'very_low' | 'low' | 'high' | 'very_high';
  levelLabelSk: string;
  indicators: DIIIndicator[];
}

export interface CategoryScore {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  answeredQuestions: number;
  totalQuestions: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ORSScore {
  score: number;
  scorePenalized: number;
  maturityLevel: number;
  maturityLabelSk: string;
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
  percentile?: number;
  gap: number;
  labelSk: string;
  disclaimer?: string;
}

export interface BenchmarkResults {
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
  sector: string;                // sector key (e.g. "manufacturing")
  sizeBand: 'micro' | 'small' | 'medium' | 'large';
  country: 'SK';
  diiScore100: number;           // 0–100
  diiScore12: number;            // 0–12 (DII raw mapping)
  orsScore: number;              // 0–100
  tdriScore: number;             // 0–100 (higher = worse)
  businessImpactEur: number;     // mid scenario, EUR/year
  completedAt: string;           // ISO date
  // Per-category breakdown (procesy, systémy, dáta, infra, security, governance)
  orsCategories: {
    procesy: number;
    systemy: number;
    data: number;
    infra: number;
    security: number;
    governance: number;
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
