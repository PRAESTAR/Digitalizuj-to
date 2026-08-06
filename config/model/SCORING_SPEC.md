# digitalizuj.to — Scoring Specification

> Verzia: 2.0 (prepísané podľa reálnej implementácie pre release 1.0.0; nahrádza 1.0-MVP + poznámku k 1.2-MVP)
> Dátum: 2026-07-24
>
> **Prečo revízia:** Verzia 1.0-MVP opisovala per-indikátorovú DII agregáciu a ďalšie mechanizmy, ktoré `engines/scoringEngine.ts` neimplementuje. Tento dokument opisuje presne to, čo kód počíta, vrátane známych aproximácií — tie sú explicitne označené, nie skryté.

---

## 1. Prehľad výstupov

Systém produkuje **5 nezávislých výstupov**:

| # | Výstup | Rozsah | Smer | Účel |
|---|--------|--------|------|------|
| 1 | DII-Compatible Score | 0–100 (+ prepočet 0–12) | vyššie = lepšie | EU benchmark |
| 2 | Operational Readiness Score | 0–100 | vyššie = lepšie | Reálna zrelosť (6 kategórií) |
| 3 | AI & Automatizácia Readiness | 0–100 (alebo nezmerané) | vyššie = lepšie | Prierezový index, mimo ORS kategórií |
| 4 | Technical Debt & Risk Index | 0–100 | vyššie = horšie | Rizikový profil |
| 5 | Business Impact Potential | hodiny/MD/€ | odhad dopadu | ROI odhad (detail v `ROI_MODEL.md`) |

---

## 2. DII-Compatible Score

Implementácia: `engines/scoringEngine.ts` → `calculateDII(answers, questions)`.

### 2.1 Vstup

Všetky odpovede na otázky, kde `question.maps_to_score` obsahuje `"dii"`, s vylúčením `isUnknown`/`wasSkipped`.

### 2.2 Výpočet — skutočný (plochý priemer, nie per-indikátor)

```
diiAnswers = answers.filter(a => question(a).maps_to_score.includes('dii') && !a.isUnknown && !a.wasSkipped)

Ak diiAnswers.length === 0:
  → { score100: 0, score12: 0, pureBinary: 0, level: 'very_low', indicators: [] }
  (POZOR: toto je fabrikované najhoršie skóre pre nezmeraný stav, nie explicitné N/A — známa aproximácia, viď §2.4)

score100 = priemer(a.score pre a in diiAnswers)      // JEDNODUCHÝ priemer cez VŠETKY odpovedané "dii" otázky
score12  = round(score100 / 100 × 12)
pureBinary = min(12, počet(a.score >= 50 pre a in diiAnswers))   // JEDNOTNÝ prah 50 pre všetky otázky

level: score12 ≤ 3 → 'very_low' | ≤ 6 → 'low' | ≤ 9 → 'high' | inak → 'very_high'
```

**Aproximácia oproti oficiálnemu Eurostat DII:**
- Eurostat DII je súčet **12 binárnych indikátorov**, každý s vlastným prahom (napr. AI a big data majú prah "áno" pri nižšej sofistikovanosti než pripojenie/cloud). Táto implementácia namiesto toho **spriemeruje všetky otázky označené `"dii"`** bez ohľadu na to, koľko otázok meria ktorý indikátor — otázka pokrytá 2 otázkami má väčšiu váhu než otázka pokrytá 1 otázkou.
- `pureBinary` používa **jednotný prah 50** pre všetky otázky namiesto indikátor-špecifických prahov, ktoré Eurostat metodika reálne používa pre niektoré premenné (viď `METHODOLOGY.md` §2.1 pre oficiálny zoznam 12 premenných DII v3/2025).
- Dôsledok: `score12`/`pureBinary` sú **DII-kompatibilné, nie DII-identické** — pri benchmark porovnaní (`BENCHMARK_SPEC.md`) sa preto zobrazuje explicitný disclaimer.

### 2.3 Explainability (skutočný tvar `DIIScore`)

```ts
interface DIIIndicator {
  id: string;        // ID otázky (NIE "DII1".."DII12" — nie je per-indikátorové mapovanie)
  name: string;       // question.dimension
  score: number;
  binary: boolean;    // score >= 50
  sourceAnswers: string[];
}

interface DIIScore {
  score100: number;
  score12: number;
  pureBinary: number;
  level: 'very_low' | 'low' | 'high' | 'very_high';
  levelLabelSk: string;
  indicators: DIIIndicator[];   // jeden záznam na KAŽDÚ "dii" odpoveď, nie na 12 indikátorov
}
```

---

## 3. Operational Readiness Score (ORS)

Implementácia: `calculateORS(answers, questions)`.

### 3.1 Kategóriové skóre

Pre každú z kategórií `A`–`F`:

```
catQuestions = questions.filter(q => q.category === cat)
catAnswers   = answers na catQuestions, vylúčené isUnknown/wasSkipped

catScore = Σ(answer.score × question.weight) / Σ(question.weight)   // 0 ak catAnswers je prázdne

unknownRatio = 1 − catAnswers.length / catQuestions.length   // 1 ak catQuestions je prázdne
confidence:
  unknownRatio > 0.50 (scoringConfig.unknownAnswerExclusionThreshold) → 'low'
  unknownRatio > 0.25 (natvrdo v kóde)                                → 'medium'
  inak                                                                 → 'high'
```

**Známa medzera:** Prázdna/plne preskočená kategória dostane `catScore = 0` (nie N/A) a jej plná váha sa aj tak započíta do súčtu ORS — reálny dopad: firma s celou kategóriou F preskočenou vetvením má strop ORS 90/100, nie 100/100. `CategoryScore.score` je v type systéme `number` (nie `number | null`), takže "nezmerané" a "namerané 0" sú momentálne nerozlíšiteľné vo výstupe.

### 3.2 Celkové ORS

```
orsScore = Σ (round(catScore × 10)/10 × categoryWeights[cat])   // každá kontribúcia sa zaokrúhli PRED súčtom

Default váhy (scoringConfig.categoryWeights):
  A (Procesy):                20 %
  B (Systémy/Integrácie):     20 %
  C (Dáta/Reporting):         15 %
  D (Infraštruktúra/Cloud):   15 %
  E (Bezpečnosť/Tech dlh):    20 %
  F (Governance/Ľudia):       10 %
```

Predbežné zaokrúhlenie po kategóriách (nie na konci) môže posunúť výsledné ORS až o ~0,3 boda oproti presnému váhovanému súčtu — zriedka relevantné, výnimka sú hraničné hodnoty pri prahoch maturity levelu alebo bezpečnostnej penalizácie.

### 3.3 Maturity Level

| Penalizované ORS | Level | Label SK |
|-------------------|-------|----------|
| ≤ 20 | 0 | Digitálny nováčik |
| 21–40 | 1 | Začiatočník |
| 41–60 | 2 | Rozvíjajúci sa |
| 61–80 | 3 | Pokročilý |
| 81–100 | 4 | Digitálny líder |

Hranice sú **prísne `>`** (napr. presne 20.0 = level 0, 20.1 = level 1). Level sa počíta zo **`scorePenalized`** (po bezpečnostnej penalizácii), nie zo surového ORS.

### 3.4 Bezpečnostná penalizácia (kategória E)

```
Ak categories['E'].answeredQuestions > 0  A ZÁROVEŇ  categories['E'].score < 30:
  factor = 0.7 + 0.3 × (E.score / 30)
  scorePenalized = orsScore × factor       // max penalizácia −30 % pri E = 0

Inak:
  scorePenalized = orsScore   (žiadna penalizácia — vrátane prípadu, keď E nebola vôbec meraná)
```

**Zmena oproti pôvodnej špecifikácii (release 1.0.0):** penalizácia sa aplikuje **iba ak bola kategória E reálne meraná** (aspoň 1 zodpovedaná otázka). Predtým sa nemeraná E (skóre 0 "defaultom") penalizovala maximálnou sadzbou −30 %, čo bolo nesprávne — indikatívny kvíz bez bezpečnostných otázok by inak vždy dostal plnú penalizáciu bez jediného dôkazu o probléme.

### 3.5 Explainability

```json
{
  "score": 54.2,
  "scorePenalized": 54.2,
  "maturityLevel": 2,
  "maturityLabelSk": "Rozvíjajúci sa",
  "categories": {
    "A": { "name": "...", "score": 45, "weight": 0.20, "contribution": 9.0, "answeredQuestions": 4, "totalQuestions": 5, "confidence": "high" }
  },
  "penaltyApplied": false,
  "penaltyReason": null
}
```

---

## 4. AI & Automatizácia Readiness Index

Implementácia: `engines/aiReadinessEngine.ts` → `calculateAIReadiness(answers, questions)`. Architektonicky rovnaký princíp ako TDRI (§5) — **prierezový index naprieč otázkami, nie 7. ORS kategória**.

```
aiQuestions = questions.filter(q => q.maps_to_score.includes('ai_readiness'))
aiAnswers   = answers na aiQuestions, vylúčené isUnknown/wasSkipped

Ak aiAnswers.length === 0:
  → { score: null, measured: false, level: 'ziadna', confidence: 'low' }

score = Σ(answer.score × question.weight) / Σ(question.weight)

level: score ≤ 25 → 'ziadna' | ≤ 55 → 'experimentalna' | ≤ 80 → 'pokrocila' | inak → 'strategicka'
confidence: answeredCount >= totalTaggedCount → 'high' | answeredCount >= 2 → 'medium' | inak → 'low'
```

Na rozdiel od DII/ORS **vracia `score: null` (nie 0) pri nezmeranom stave** — toto je referenčná implementácia správneho N/A správania, ktorú §2.2 a §3.1 zatiaľ nemajú (sledované v `IMPROVEMENT_CHECKLIST.md` P0).

Zdrojové otázky (aktuálne): `ind_15_ai`, `cx_DII03`, `cx_A06_ai_automation`, `cx_F07_ai_governance`.

---

## 5. Technical Debt & Risk Index (TDRI)

Implementácia: `engines/riskEngine.ts` → `calculateTDRI(answers, questions, riskFlags)`.

### 5.1 Princíp

Samostatný penalizačný index (0–100, vyššie = horšie), nezávislý od ORS.

### 5.2 Risk faktory

14 faktorov definovaných v `data/scoringConfig.ts` (`riskFactorDefinitions`) — tabuľka RF01–RF14 s `maxPenalty` a `severity` je v `QUESTION_BANK_GUIDE.md` §7 (jeden zdroj pravdy pre obe strany — otázky aj scoring).

### 5.3 Výpočet penalty per faktor

```
Ak riskFlags obsahuje factor.id (aktivované cez flag_risk branching):
  penalty = maxPenalty × severityMultiplier
  severityMultiplier: critical → 1.0 | high → 0.8 | medium → 0.6

Inak, ak existujú odpovede na otázky s maps_to_risk obsahujúcim factor.id:
  relevantAnswers = tieto odpovede, vylúčené isUnknown/wasSkipped A vylúčené otázky,
                    kde VŠETKY možnosti majú score 0 (čisto informačné otázky)
  avgScore = priemer(relevantAnswers.score), alebo 100 ak žiadne nezostali

  avgScore < 30  → penalty = maxPenalty × 0.8
  avgScore < 60  → penalty = maxPenalty × 0.3
  inak           → penalty = 0
```

**Poznámka k verzii 1.0.0:** čiastočná cesta teraz vylučuje "Neviem"/preskočené odpovede a otázky bez bodovateľných možností (predtým napr. informačná otázka `cx_B02` — "ktorý systém je najkritickejší", všetky možnosti `score: 0` — aktivovala RF06 na 80 % penalizácie pre **každého** respondenta komplexného kvízu bez ohľadu na odpoveď).

### 5.4 Súčet a pásma

```
totalPenalty = min(100, Σ penalty[rf])

score: 0–15 → 'low' ("Dobre riadené") | 16–35 → 'medium' | 36–60 → 'high' | 61–100 → 'critical'
```

**Známa medzera:** so severity multiplikátormi je reálne dosiahnuteľné maximum súčtu ≈ 93.4 (50×1.0 kritických + 31×0.8 vysokých + 31×0.6 stredných), nie 100 — `min(100, …)` je teda technicky nedosiahnuteľný strop a pásmo `critical` (61–100) je v praxi zúžené na 61–93.4.

`topRisks` = top 5 aktívnych faktorov podľa `penalty` zostupne.

---

## 6. Business Impact Potential

Detailná špecifikácia (vzorce, scenáre, confidence, zdroje hodinovej ceny práce) je v `ROI_MODEL.md`. Skrátene:

- Vstupy: veľkosť firmy, zoznam manuálnych procesov (alebo benchmark default), maturity level kategórie A, ROI meta-otázky (`cx_ROI02`, `cx_ROI03`).
- Hodinová cena práce je od verzie 1.0.0 **vždy fixný benchmark** (priemer SR/IT sektora podľa aktuálnej konfigurácie), otázka na ňu bola z dotazníka odstránená — dôvod a presný zdroj v `ROI_MODEL.md` §6.3 a §7.
- Výstup: 3 scenáre (konzervatívny/reálny/optimistický), confidence 0–1, disclaimery, per-proces audit trail.

---

## 7. Scoring otázok — spoločné pravidlá

### 7.1 Normalizácia odpovede

| Typ otázky | Normalizácia |
|------------|-------------|
| `single_choice` | Priamo `option.score` (0–100), žiadna ďalšia transformácia. |
| `multi_select` (normálny) | `min(100, round(Σ vybraných option.score / max_score × 100))`. |
| `multi_select` (invertovaný, `scoring_note` obsahuje "Invertované") | `max(0, 100 + Σ vybraných option.score)` — možnosti majú záporné skóre. |

Typy `numeric_input`, `numeric_bands`, `conditional_matrix` spomínané v pôvodnej dokumentácii **nie sú implementované** — `QuestionCard.tsx` podporuje výhradne `single_choice` a `multi_select`.

### 7.2 Váha a mapovanie otázky

- `weight`: relatívna dôležitosť v rámci kategórie pri váhovanom priemere (default `1.0`).
- `maps_to_score` (pole): DII/ORS kategória/AI Readiness bucket, do ktorých otázka prispieva — pozri `QUESTION_BANK_GUIDE.md` §6.
- `maps_to_risk` (pole): risk faktory TDRI — pozri §5.2 vyššie.
- `maps_to_roi_model` (pole): popisné pre editorov; ROI engine v skutočnosti číta hodnoty podľa natvrdo napísaných ID otázok (viď `ROI_MODEL.md`).

### 7.3 "Neviem" a preskočené otázky

- `isUnknown` aj `wasSkipped` odpovede sa **vylučujú z menovateľa** vo všetkých engine výpočtoch (DII, ORS, AI Readiness); TDRI ich vylučuje z čiastočnej (odvodenej) cesty.
- Vysoký podiel "Neviem" v kategórii znižuje `confidence` (§3.1), ale skóre sa vždy vypočíta z toho, čo je k dispozícii — žiadny "blokujúci" stav.
- Plne preskočená/nezodpovedaná kategória/bucket vracia `0` (ORS/DII) alebo `null` (AI Readiness) — nekonzistencia je známa a sledovaná (§2.2, §3.1).

---

## 8. Indikatívny vs. komplexný kvíz

Motor **nerozlišuje** typ kvízu vo výpočte — `calculateDII`/`calculateORS`/`calculateAIReadiness`/`calculateTDRI` dostávajú len `answers` a `questions`, žiadny parameter `assessmentType`. Rozdiel medzi kvízmi je čisto v tom, **koľko a ktoré otázky boli zodpovedané** (menej otázok v indikatívnom kvíze → menej dát → nižšia `confidence` na kategóriovej úrovni, ale **nie** explicitné confidence pásmo na úrovni celkového skóre ako 45 ± 15). Označenie výsledku ako orientačný/plný sa deje len na úrovni UI (typ assessmentu v `ResultSnapshot`), nie vo vzorcoch.

---

## 9. Konfigurácia

Parametre v `data/scoringConfig.ts` (**zdroj pravdy**). `config/model/scoringConfig.json` je z neho **generovaný pohľad** pre editorov modelu — runtime ho nečíta a ručná zmena v ňom nič nezmení; regeneruje sa cez `npm run config:sync` a build kontroluje zhodu (validátor #14):

```ts
{
  version: '1.4-MVP',
  diiMethodologyVersion: 'DII v3 (Eurostat isoc_e_dii, prieskum 2025)',
  categoryWeights: { A: 0.20, B: 0.20, C: 0.15, D: 0.15, E: 0.20, F: 0.10 },
  maturityThresholds: [20, 40, 60, 80],
  riskThresholds: [15, 35, 60],
  securityPenaltyThreshold: 30,
  securityPenaltyMaxFactor: 0.30,
  unknownAnswerExclusionThreshold: 0.50,
}
```

`aiReadinessThresholds` (`[25, 55, 80]`) a `aiReadinessLabels` sú definované samostatne v tom istom súbore.

Hardcoded hodnoty, ktoré **nie sú** v konfigurácii (známa medzera): DII level cutoffs (3/6/9), binárny prah 50, medium-confidence cutoff 0.25, TDRI pásma [15,35,60] sú duplicitne aj natvrdo v `riskEngine.ts` popri `scoringConfig.riskThresholds`.
