# digitalizuj.to — Recommendation Rules

> **Platí pre:** otázková banka `1.8` · scoring config `1.5` · overené 2026-08-07
>
> Dokument nemá vlastné číslo verzie — má ho model, ktorý opisuje.
> Zhodu pečiatky so zdrojmi kontroluje build (`validate-model.mjs` #16),
> takže revízia modelu bez prečítania dokumentácie zhodí build.
> História zmien modelu: [`MODEL_VERSIONS.md`](MODEL_VERSIONS.md).
> **Prečo revízia:** Pôvodná verzia 1.0-MVP popisovala plánované pravidlá (answer-level podmienky ako `invoicing == "manual"`, kategórie C/D, `benchmark_note` s konkrétnymi percentami), ktoré `engines/recommendationEngine.ts` nikdy neimplementoval. Tento dokument teraz opisuje **presne to, čo kód reálne robí** — vrátane medzier, ktoré zostávajú otvorené (označené nižšie a v `IMPROVEMENT_CHECKLIST.md`).

---

## 1. Princíp generovania odporúčaní

`generateRecommendations(answers, questions, ors, tdri, dii, aiReadiness)` vracia:

```
{
  strengths,              // Strength[]
  criticalRisks,          // Recommendation[] — z TDRI risk faktorov
  quickWins,               // Recommendation[] — top 5 podľa priorityScore
  strategicInitiatives,    // Recommendation[] — top 3 podľa priorityScore
  longTermInitiatives,     // Recommendation[] — všetky
  roadmap: { immediate0_3m, medium3_12m, longTerm12mPlus }  // string[] ID
}
```

Odporúčania sa generujú z **fixnej sady pravidiel** naviazaných na kategóriové
skóre ORS, aktívne TDRI risk faktory a AI Readiness. Od 6. 8. 2026 k tomu
pribudla **faktová vrstva** (`buildFacts`): pravidlo môže byť podmienené
konkrétnou odpoveďou alebo veľkosťou firmy. Predtým sa `answers`/`questions`
prijímali a nevyužívali, takže sa trojosobovej firme odporúčal ERP a firme bez
servera migrácia do cloudu.

Kľúčová sémantika, zhodná so scoringom: **neplatná odpoveď nikdy nesplní
podmienku.** „Neviem" ani preskočené nie sú zistenie, takže bránu neotvoria —
rovnako, ako nevstupujú do skóre.

**Pozor na dva rôzne vstupy:** faktová vrstva číta **surové** hodnoty odpovedí,
kým prahové pravidlá dostávajú kategóriové skóre ORS, ktoré je pri mikro-
a malých firmách prepočítané veľkostnou kotvou (`SCORING_SPEC.md` §13). Je to
zámer: mikrofirma na strope svojho pásma nedostane radu „zaveďte dedikovaný IT
tím", lebo nesplniteľné odporúčanie je horšie než žiadne.

---

## 2. Typy a horizonty

| Typ | Popis | Horizont v roadmape |
|-----|-------|----------------------|
| `critical_risk` | Z aktívnych TDRI risk faktorov s penaltou ≥ 5 | 0–3 mesiace |
| `quick_win` | Nízke úsilie, kategóriový prah | 0–3 mesiace |
| `strategic` | Väčšia iniciatíva, kategóriový prah | 3–12 mesiacov |
| `long_term` | Transformačné zmeny, celkové ORS | 12+ mesiacov |

### 2.1 Skutočný vzorec prioritizácie

```
priorityScore = round(urgency × impact / effort, 1)
```

Platí **rovnako pre všetky typy odporúčaní** vrátane kritických rizík
(`engines/recommendationEngine.ts`, funkcia `priority`). Šablóny rizikových
faktorov v `data/riskRecommendations.ts` nesú vlastné `urgency`/`impact`/`effort`
a `effort` sa medzi nimi líši (1 až 3), takže tvrdenie o pevnej hodnote 12,5
neplatí.

> **Oprava 7. 8. 2026.** Táto sekcia predtým opisovala stav spred 6. 8. 2026:
> `priorityScore` bol v každom pravidle napísaný natvrdo, takže sa dalo zmeniť
> `urgency`/`impact`/`effort` bez toho, aby sa poradie v roadmape pohlo.
> Odvtedy sa počíta zo skutočných polí.

**`urgency`, `impact` a `effort` sú interné poradové parametre bez deklarovanej
jednotky.** Nie sú to človekodni, eurá ani nič, čo by sa dalo overiť — slúžia
výhradne na zoradenie odporúčaní medzi sebou. Preto sa **respondentovi
nezobrazujú**: odznaky „Dopad: 3/5" a „Úsilie: 3/5" boli 7. 8. 2026
z `components/results/Recommendations.tsx` odstránené. Číslo bez jednotky
a bez kotiev nie je interpersonálne porovnateľné (Smith & Kendall 1963,
behaviorálne ukotvené škály) a jeho zobrazenie ho vydávalo za meranie.

Poradie samotné sa nemení — mení sa len to, čo je vidieť.

---

## 3. Critical Risk odporúčania

Generujú sa z `tdri.factors` — podmienka: `factor.active && factor.penalty >= 5`.

**Šablóna existuje iba pre 7 z 14 risk faktorov.** Ak faktor prejde prahom `penalty >= 5`, ale nemá šablónu (RF06, RF08, RF10, RF11, RF12, RF13, RF14), **žiadne odporúčanie sa nevygeneruje** — faktor sa napriek tomu môže zobraziť v `tdri.topRisks` ako top riziko bez zodpovedajúcej akcie.

| RF | Odporúčanie (titleSk) | Šablóna existuje? |
|----|------------------------|---------------------|
| RF01 | "Migrácia z nepodporovaného OS/systému" | ✅ |
| RF02 | "Okamžite nasaďte zálohovanie" | ✅ |
| RF03 | "Otestujte obnovu zo zálohy" | ✅ |
| RF04 | "Zaveďte pravidelný patch management" | ✅ |
| RF05 | "Nasaďte MFA na kritických systémoch" | ✅ |
| RF06 | — | ❌ chýba |
| RF07 | "Eliminujte závislosť na jednom človeku" | ✅ |
| RF08 | — | ❌ chýba |
| RF09 | "Vytvorte BC/DR plán" | ✅ |
| RF10 | — | ❌ chýba |
| RF11 | — | ❌ chýba |
| RF12 | — | ❌ chýba |
| RF13 | — | ❌ chýba |
| RF14 | — | ❌ chýba |

Všetky critical risk odporúčania majú `category: 'E'` bez ohľadu na skutočnú doménu rizika (napr. RF01/RF06 sú infraštruktúrne, RF07 je governance) — kategorizácia v UI preto vždy zoskupí tieto odporúčania pod bezpečnosť.

**Medzera:** Medium-severity faktory (max penalty 4–6) nikdy nedosiahnu prah `penalty >= 5` cez aktívnu cestu (`0.6 × maxPenalty`, max `0.6 × 6 = 3.6`) ani cez odvodenú (`0.8 × maxPenalty`, max `0.8 × 6 = 4.8`) — takže RF08/RF10/RF11/RF12/RF13/RF14 **nemôžu matematicky** vygenerovať critical-risk odporúčanie, aj keby šablónu mali.

---

## 4. Quick Win odporúčania

Fixná sada 5 pravidiel podľa kategóriového skóre + 1 nové pravidlo pre AI:

| Podmienka | ID | Odporúčanie | u / i / e | priorityScore |
|-----------|-----|-------------|-----------|----------------|
| `A.score < 40` | `rec_qw_process_auto` | "Digitalizujte kľúčové procesy" | 4/4/2 | 8 |
| `B.score < 40` | `rec_qw_integration` | "Prepojte najpoužívanejšie systémy" | 3/4/2 | 6 |
| `C.score < 30` | `rec_qw_reporting` | "Nastavte automatizované reporty" | 3/3/1 | 9 |
| `F.score < 30` | `rec_qw_ownership` | "Určite zodpovednú osobu za digitalizáciu" | 3/3/1 | 9 |
| `E.score < 50` | `rec_qw_security_basics` | "Zabezpečte základnú kybernetickú hygienu" | 5/5/1 | 25 |
| `aiReadiness.score ≤ 25` (meraná) | `rec_ai_start` | "Začnite experimentovať s AI nástrojmi" | 3/4/1 | 12 |

**Kategória D nemá žiadne quick-win pravidlo** — firma so slabou infraštruktúrou/cloudom (D < akéhokoľvek prahu) z tejto sekcie nedostane nič.

**Duplicita:** `rec_qw_security_basics` (E < 50) sa typicky spustí spolu s critical-risk odporúčaniami RF02/RF04/RF05 (tie isté oblasti — MFA, zálohy, patching) pre tú istú firmu — používateľ môže vidieť prekrývajúce sa rady v `criticalRisks` aj `quickWins` súčasne.

Zobrazuje sa top 5 podľa `priorityScore` (`.slice(0, 5)`).

---

## 5. Strategic odporúčania

Fixná sada 4 pravidiel + 2 pre AI:

| Podmienka | ID | Odporúčanie | priorityScore |
|-----------|-----|-------------|----------------|
| `A.score < 50` | `rec_str_erp` | "Implementujte integrovaný podnikový systém" | 3.75 |
| `B.score < 50` | `rec_str_integration` | "Vytvorte integračnú stratégiu" | 4 |
| `E.score < 50` | `rec_str_security` | "Vypracujte bezpečnostnú stratégiu" | 5.3 |
| `F.score < 40` | `rec_str_roadmap` | "Vytvorte digitalizačnú roadmapu" | 6 |
| `aiReadiness.score` 26–55 (meraná) | `rec_ai_scale` | "Rozšírte AI z experimentov do produkcie" | 4 |
| `aiReadiness.score` > 55 (meraná) | `rec_ai_govern` | "Formalizujte AI governance" | 3 |

**Kategórie C a D nemajú žiadne strategické pravidlo.** Zobrazuje sa top 3 podľa `priorityScore` (`.slice(0, 3)`).

---

## 6. Long-term odporúčania

| Podmienka | ID | Odporúčanie |
|-----------|-----|-------------|
| `ors.scorePenalized > 60` **a** (cx_DII03 chýba/"Neviem" **alebo** explicitne `value === 'none'`) | `rec_lt_ai` | "Zvážte pilotné nasadenie AI" |
| `ors.scorePenalized > 70` | `rec_lt_transformation` | "Digitálna transformácia business modelu" |

Vracajú sa **všetky**, nie len top N. Pôvodne dokumentované pravidlo `A > 60 && C < 40 → dátová platforma` **neexistuje** v kóde.

---

## 7. Roadmapa

```
immediate0_3m  = ID všetkých criticalRisks + top 3 quickWins
medium3_12m    = ID top 3 strategicInitiatives
longTerm12mPlus = ID všetkých longTermInitiatives
```

**Neexistuje** samostatná úroveň "risk mitigácie strednej priority" v `medium3_12m` — medium-severity riziká (RF08/RF10/RF11/RF12/RF13/RF14) sa nikam do roadmapy nedostanú (viď §3, matematicky nedosiahnuteľný prah).

---

## 8. Silné stránky (`strengths`)

| Podmienka | Text |
|-----------|------|
| Ktorákoľvek ORS kategória `score >= 70` | `"{názov kategórie}: Nadpriemerná úroveň ({skóre}/100)"` |
| `tdri.score <= 15` | "Nízky technologický dlh — dobre riadená infraštruktúra a bezpečnosť" |
| `dii.score100 >= 75` | "Vysoká digitálna intenzita — aktívne využívanie digitálnych nástrojov" |
| `aiReadiness.score >= 70` (meraná) | "Vyspelé využitie AI — firma je v tejto oblasti pred väčšinou trhu" |

---

## 9. Skutočný formát odporúčania (TypeScript, `types/index.ts`)

```ts
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

**Pole `benchmark_note` neexistuje** — pôvodná dokumentácia obsahovala nezdrojované tvrdenia ("93 % firiem má MFA") v tomto poli; boli odstránené, keďže Eurostat DII adopciu MFA nemeria a interné dáta na takéto tvrdenie zatiaľ nemáme.

Reálny príklad (critical risk):
```json
{
  "id": "rec_risk_RF05",
  "type": "critical_risk",
  "category": "E",
  "titleSk": "Nasaďte MFA na kritických systémoch",
  "descriptionSk": "Implementujte viacfaktorové overenie minimálne na e-mail, VPN a admin rozhrania. Je to najefektívnejšia bezpečnostná investícia.",
  "urgency": 5,
  "impact": 5,
  "effort": 2,
  "priorityScore": 12.5,
  "horizon": "0-3 mesiace",
  "triggeredBy": ["RF05"],
  "sourceAnswers": ["ind_10"],
  "expectedOutcome": "Zníženie rizika: Absencia MFA na kritických systémoch"
}
```

---

## 10. Roadmapa vylepšení (mimo rozsahu MVP)

Pravidlá, ktoré by dávali produkt viac na mieru konkrétnej firme, ale zatiaľ nie sú implementované (sledované v `IMPROVEMENT_CHECKLIST.md` P1):
- Answer-level podmienky (napr. `invoicing == 'manual'` → konkrétne odporúčanie na fakturáciu).
- Firmografické brány (napr. odporúčanie ERP len pre `employee_count > 20`, aby sa 3-osobovej firme neodporúčal veľký systém).
- Strategické/quick-win pravidlá pre kategórie C a D.
- Šablóny pre RF06/RF08/RF10/RF11/RF12/RF13/RF14.
- Regulačný kontext v odporúčaniach (NIS2 scope-check, termín povinnej e-fakturácie 2027).
