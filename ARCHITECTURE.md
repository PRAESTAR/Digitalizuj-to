# digitalizuj.to — Technical Architecture

> Verzia: 1.1-MVP (revízia; pôvodná 1.0-MVP z 2026-04-08)
> Dátum: 2026-07-24
>
> Rýchly prehľad s diagramami (Mermaid) je v [`README.md`](README.md#architektura) — tento dokument je hlbší technický detail (dátový model, výpočtové vzorce).

---

## 1. Technologický stack

| Vrstva | Technológia | Dôvod |
|--------|------------|-------|
| Frontend | Next.js 16 + TypeScript 5 | App Router, SSR/CSR, React ekosystém |
| UI | React 19 | Komponentový model |
| Styling | Tailwind CSS 4 | Rýchly vývoj, konzistentný dizajn |
| Charting | Recharts 3 | Radar/hexagon chart, responzívne |
| State | React Context + useReducer | Stačí pre MVP, žiadna externá závislosť |
| Dáta | JSON/TS-based (in-memory) | Pre MVP nie je potrebná databáza |
| Export | Client-side PDF (html2canvas/jsPDF) | Jednoduchý export |

**Rozhodnutie:** Pre MVP je databáza overkill. Otázky, scoring a benchmarky sú v JSON/TS súboroch. Stav sa drží v pamäti (React state) a voliteľne v `localStorage` (trvalé odkazy). Pre produkciu sa pridá Supabase/PostgreSQL.

---

## 2. Architektúra modulov

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Landing  │  │  Quiz    │  │ Results  │  │ Export  │ │
│  │  Page    │  │  Flow    │  │Dashboard │  │  Page   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │            │              │            │       │
│  ┌──────┴────────────┴──────────────┴────────────┴──┐   │
│  │              Assessment Context (State)           │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                    ENGINE LAYER                          │
│  ┌──────────────┐  ┌────┴─────────┐  ┌──────────────┐  │
│  │  Question    │  │   Scoring    │  │  Benchmark   │  │
│  │  Engine      │  │   Engine     │  │  Engine      │  │
│  │              │  │              │  │              │  │
│  │ - loadQuiz   │  │ - calcDII    │  │ - compare    │  │
│  │ - getNext    │  │ - calcORS    │  │ - percentile │  │
│  │ - evalBranch │  │ - calcTDRI   │  │ - gapAnalysis│  │
│  │ - isComplete │  │ - calcROI    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Risk        │  │  ROI         │  │  Recommend-  │  │
│  │  Engine      │  │  Engine      │  │  ation Engine│  │
│  │              │  │              │  │              │  │
│  │ - evalRisks  │  │ - calcImpact │  │ - generate   │  │
│  │ - flagCrit   │  │ - scenarios  │  │ - prioritize │  │
│  │ - aggregate  │  │ - confidence │  │ - roadmap    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐                                      │
│  │  AI Readiness│  (prierezový index — rovnaký princíp │
│  │  Engine      │   ako Risk Engine, nie 7. kategória  │
│  │ - calcAI     │   ODRM; pozri METHODOLOGY.md §5.4)   │
│  └──────────────┘                                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Explainability Layer                  │   │
│  │  - auditTrail() - explainScore() - traceAnswer() │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                    DATA LAYER                            │
│  ┌──────────────┐  ┌────┴─────────┐  ┌──────────────┐  │
│  │ QUESTION_    │  │  SCORING     │  │  BENCHMARK   │  │
│  │ BANK.json    │  │  _CONFIG     │  │  _DATA       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Dátový model

### 3.1 Entity

```typescript
// Assessment — hlavná entita hodnotenia
interface Assessment {
  id: string;
  type: 'indicative' | 'complex';
  status: 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  respondent: Respondent;
  answers: Answer[];
  result?: ResultSnapshot;
}

// Respondent — informácie o firme
interface Respondent {
  sector: string;
  employeeCountBand: 'micro' | 'small' | 'medium' | 'large';
  revenueBand?: string;
}

// Organization — rozšírené info (pre budúcnosť)
interface Organization {
  id: string;
  name?: string;
  sector: string;
  employeeCount?: number;
  country: string;
}

// Question — definícia otázky (z JSON)
interface Question {
  id: string;
  category: string;
  dimension: string;
  question_sk: string;
  question_type: QuestionType;
  weight: number;
  options?: QuestionOption[];
  bands?: NumericBand[];       // pole existuje v type systéme, ale UI ho nečíta — nepoužívané
  max_score?: number;
  scoring_note?: string;       // magic string "Invertované" prepína multi_select scoring
  branching_rules: BranchingRule[];
  evidence_type: string;
  maps_to_score: string[];
  maps_to_risk: string[];
  maps_to_roi_model: string[]; // popisné — roiEngine v skutočnosti číta podľa natvrdo napísaných ID
  tooltip?: string | null;
  allow_unknown: boolean;
}

// Iba tieto dva typy sú implementované v QuestionCard.tsx.
// 'yes_no', 'numeric_input', 'numeric_bands', 'maturity_scale' NIE SÚ podporené v UI.
type QuestionType = 'single_choice' | 'multi_select';

interface QuestionOption {
  value: string;
  label: string;
  score: number;
}

// Answer — odpoveď na otázku
interface Answer {
  questionId: string;
  value: string | string[];
  score: number;
  isUnknown: boolean;
  wasSkipped: boolean;
  skipReason?: string;
  timestamp: string;
}

// BranchingRule
interface BranchingRule {
  condition: string;
  action: 'skip' | 'include' | 'flag_risk';
  target: string | string[];
  reason: string;
}

// ScoreDimension
interface ScoreDimension {
  id: string;
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  confidence: 'high' | 'medium' | 'low';
}

// BenchmarkMetric
interface BenchmarkMetric {
  country: string;
  sector?: string;
  sizeBand?: string;
  metric: string;
  value: number;
  source: string;
  version: string;
}

// RoiAssumption
interface RoiAssumption {
  process: string;
  frequencyYearly: number;
  timePerCaseH: number;
  manualShare: number;
  automatableShare: number;
  dataSource: 'self_reported' | 'benchmark_sector' | 'benchmark_default';
}

// ResultSnapshot — kompletný výsledok (reálny tvar, types/index.ts)
interface ResultSnapshot {
  assessmentId: string;
  modelVersion: ModelVersionInfo;   // questionBank/scoringConfig/benchmarkData verzie + timestamp
  dii: DIIScore;
  ors: ORSScore;
  tdri: TDRIScore;
  aiReadiness: AIReadinessScore;     // pozri METHODOLOGY.md §5.4
  businessImpact: BusinessImpact;
  benchmarks: BenchmarkResults;
  recommendations: Recommendations;
}
// Pozn.: samostatný globálny "AuditTrail" typ neexistuje — auditovateľnosť je
// implementovaná užšie, len pre Business Impact (pozri §6 nižšie).

// Recommendation (reálne camelCase polia, nie snake_case)
interface Recommendation {
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
```

---

## 4. Scoring Pipeline

```
Odpovede → Normalizácia → Kategorizácia → Agregácia → Penalizácia → Výsledok

1. NORMALIZÁCIA
   Pre každú odpoveď:
   - Získaj raw score z opcie
   - Normalizuj na 0-100

2. KATEGORIZÁCIA
   Pre každú odpoveď:
   - Priraď ku kategóriám podľa maps_to_score
   - Priraď k risk faktorom podľa maps_to_risk
   - Priraď k ROI modelu podľa maps_to_roi_model

3. AGREGÁCIA
   Pre DII:
   - Agreguj DII indikátory → DII score
   Pre ORS:
   - Vážený priemer per kategória → kategóriové skóre
   - Vážený priemer kategórií → ORS
   Pre TDRI:
   - Vyhodnoť risk faktory → TDRI
   Pre ROI:
   - Spočítaj impact per proces → Business Impact

4. PENALIZÁCIA
   - Ak E < 30 → penalizuj ORS
   
5. VÝSLEDOK
   - Zostav ResultSnapshot
   - Generuj odporúčania
   - Porovnaj benchmarky
```

---

## 5. Question Engine

### 5.1 Životný cyklus

```
loadQuiz(type) → getNextQuestion() → submitAnswer() → evaluateBranching() → repeat/complete

getNextQuestion():
  1. Získaj zoznam všetkých otázok pre daný quiz
  2. Odfiltruj už zodpovedané
  3. Odfiltruj preskočené (branching)
  4. Vráť prvú neodpovedanú

evaluateBranching(questionId, answer):
  1. Získaj branching_rules pre otázku
  2. Pre každé pravidlo:
     a. Vyhodnoť condition
     b. Ak match: vykonaj action (skip/include/flag_risk)
  3. Aktualizuj skip list a risk flags
```

### 5.2 Condition evaluátor

Podmienky v branching_rules sa vyhodnocujú cez jednoduchý expression evaluátor:

```typescript
evaluateCondition(condition: string, answer: Answer): boolean
// Podporované operácie:
// value == 'x'
// value != 'x'
// selected_count <= N
// selected.includes('x')
// !selected.includes('x')
```

---

## 6. Explainability mechanizmus

Každý výpočet je auditovateľný:

```typescript
interface AuditTrail {
  answers: AuditAnswer[];
  scoringConfig: {
    categoryWeights: Record<string, number>;
    version: string;
  };
  benchmarkVersion: string;
  calculationSteps: CalculationStep[];
}

interface CalculationStep {
  type: 'dii' | 'ors_category' | 'ors_total' | 'tdri' | 'roi';
  input: Record<string, any>;
  output: number;
  formula: string;
  explanation: string;
}
```

---

## 7. Štruktúra súborov

```
digitalizuj/
├── METHODOLOGY.md
├── SCORING_SPEC.md
├── BENCHMARK_SPEC.md
├── ROI_MODEL.md
├── ARCHITECTURE.md
├── QUESTION_BANK.json
├── RECOMMENDATION_RULES.md
├── RESULT_MODEL.json
├── README.md
└── src/
    ├── app/
    │   ├── layout.tsx          # Root layout
    │   ├── page.tsx            # Landing page
    │   ├── quiz/
    │   │   └── page.tsx        # Quiz flow
    │   └── results/
    │       └── page.tsx        # Results dashboard
    ├── components/
    │   ├── quiz/
    │   │   ├── QuizSelector.tsx
    │   │   ├── QuestionCard.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── SingleChoice.tsx
    │   │   ├── MultiSelect.tsx
    │   │   └── QuizComplete.tsx
    │   ├── results/
    │   │   ├── ExecutiveSummary.tsx
    │   │   ├── RadarChart.tsx
    │   │   ├── ScoreCards.tsx
    │   │   ├── RiskPanel.tsx
    │   │   ├── BusinessImpact.tsx
    │   │   ├── Recommendations.tsx
    │   │   ├── BenchmarkComparison.tsx
    │   │   └── AuditTrail.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Tooltip.tsx
    │       └── Badge.tsx
    ├── engines/
    │   ├── questionEngine.ts
    │   ├── scoringEngine.ts
    │   ├── riskEngine.ts
    │   ├── roiEngine.ts
    │   ├── benchmarkEngine.ts
    │   └── recommendationEngine.ts
    ├── data/
    │   ├── questionBank.ts     # Typed import of JSON
    │   ├── scoringConfig.ts    # Weights, thresholds
    │   └── benchmarkData.ts    # Benchmark datasets
    ├── context/
    │   └── AssessmentContext.tsx
    └── types/
        └── index.ts            # All TypeScript interfaces
```

---

## 8. Budúce rozšírenia (mimo MVP)

| Feature | Technológia | Priorita |
|---------|------------|----------|
| Persistencia | Supabase / PostgreSQL | Vysoká |
| Autentifikácia | NextAuth.js | Stredná |
| PDF export | Puppeteer server-side | Stredná |
| Admin panel | Next.js + Supabase admin | Stredná |
| API | Next.js API routes | Nízka |
| Multi-tenant | Row-level security | Nízka |
| CRM integrácia | Webhook / Zapier | Nízka |
