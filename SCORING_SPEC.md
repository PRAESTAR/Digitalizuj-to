# digitalizuj.to — Scoring Specification

> Verzia: 2.1 (scoring v1.5 — per-indikátorové DII, nemerané ≠ 0, ORS smerovanie podľa maps_to_score)
> Dátum: 2026-08-04 (predchádzajúca revízia 2.0: 2026-07-24)
>
> **Prečo revízia:** Verzia 2.0 dokumentovala vtedajšie aproximácie (plochý priemer DII, nezmerané = 0). Scoring v1.5 obe odstránil: DII je per-indikátorová agregácia cez `data/diiIndicators.json` a nemeraný stav je všade explicitné N/A (`null` + `measured`). Dokument opisuje presne to, čo kód počíta — zostávajúce vedomé nepresnosti sú explicitne označené, nie skryté.

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

Mapovacia tabuľka `data/diiIndicators.json` (typovaný wrapper `data/diiIndicators.ts`): 12 oficiálnych indikátorov DII v3/2025 (`DII1`–`DII12`, názvy podľa `METHODOLOGY.md` §2.1), každý s kritériami `{questionId, metWhen, rationale}`. Kritérium je `{minScore}` (single_choice prah) alebo `{anyOfValues}` (multi_select výber). **Striktný v3 režim:** otázky s `"dii"` tagom, ktoré nezodpovedajú žiadnej v3/2025 premennej, sú v `excludedDiiQuestions` s dôvodom a do DII **nevstupujú** (ďalej sýtia svoje ORS kategórie; `cx_DII02b`/`cx_DII04` s kategóriou `dii` nesýtia žiadne skóre — známy stav, rekategorizácia je DB operácia). Úplnosť vynucuje `scripts/validate-model.mjs` (check #8): každá `dii` otázka musí byť namapovaná ALEBO explicitne vylúčená.

### 2.2 Výpočet — per-indikátorová agregácia s extrapoláciou

```
Pre každý z 12 indikátorov:
  platné kritériá = kritériá, ktorých otázka je v aktívnom kvíze a má platnú
                    odpoveď (nie isUnknown, nie wasSkipped)
  meraný  = aspoň 1 platné kritérium
  splnený = ľubovoľné platné kritérium sedí (minScore: answer.score ≥ prah;
            anyOfValues: prienik s hodnotami odpovede)

measuredIndicators = počet meraných; metIndicators = počet splnených

Ak measuredIndicators === 0:
  → { measured: false, score100: null, score12: null, level: null, … }
  (nezmerané NIE JE nula — žiadne percentily, benchmark vracia „Nedostupné")

score12  = round(metIndicators / measuredIndicators × 12)     // EXTRAPOLÁCIA
score100 = priemer(a.score pre platné odpovede NAMAPOVANÝCH otázok)  // jemná metrika
confidence: measuredIndicators ≥ 10 → 'high' | ≥ 6 → 'medium' | ≥ 1 → 'low'

level: score12 ≤ 3 → 'very_low' | ≤ 6 → 'low' | ≤ 9 → 'high' | inak → 'very_high'
```

**Pokrytie a vedomé nepresnosti:**
- Komplexný kvíz pokrýva **10/12**, indikatívny **8/12** indikátorov; `DII1` (podiel zamestnancov s internetom) a `DII11` (B2C podiel web predajov) sú nepokryté (`uncoveredReason` v mapovaní).
- Extrapolácia `splnené/merané × 12` sa **priznáva v UI** („odhad z N/12 meraných indikátorov") vždy, keď `measuredIndicators < 12`.
- Dva proxy riadky indikatívneho kvízu: `DII4` cez `ind_12 ≥ 50` (aktívny web negarantuje soc. siete pri stupňoch 75/100) a `DII10` cez `ind_12 ≥ 75` (e-shop negarantuje ≥ 1 % obratu) — `rationale` v mapovaní ich označuje ako PROXY.
- Sémantika skipu (v1): otázka preskočená vetvením = indikátor nemeraný. Firma bez e-shopu má `cx_B06_ecommerce` preskočený, hoci `DII10` je fakticky nesplnený — extrapolácia mierne nadhodnotí; `skipImplies: 'not_met'` je plánovaná druhá iterácia.
- `pureBinary` bol odstránený (žiadny konzument; nahrádza ho `metIndicators`).
- `score12` je extrapolovaný odhad, nie binárny Eurostat count — benchmark disclaimer ostáva (`BENCHMARK_SPEC.md`).

### 2.3 Explainability (skutočný tvar `DIIScore`)

```ts
interface DIIIndicator {
  code: string;       // 'DII1' … 'DII12'
  nameSk: string;     // presne podľa METHODOLOGY §2.1
  status: 'met' | 'not_met' | 'unmeasured';
  sourceQuestions: string[];   // kritériové otázky s platnou odpoveďou
}

interface DIIScore {
  score100: number | null;     // null = nemerané
  score12: number | null;      // extrapolovaný odhad 0–12
  measured: boolean;
  measuredIndicators: number;  // 0–12
  metIndicators: number;
  confidence: 'high' | 'medium' | 'low';
  level: 'very_low' | 'low' | 'high' | 'very_high' | null;
  levelLabelSk: string | null;
  indicators: DIIIndicator[];  // VŽDY 12 riadkov — hotový audit trail
}
```

---

## 3. Operational Readiness Score (ORS)

Implementácia: `calculateORS(answers, questions)`.

### 3.1 Kategóriové skóre

Pre každú z kategórií `A`–`F`:

```
catQuestions = questions.filter(q => q.maps_to_score.includes('ors_' + cat))
catAnswers   = answers na catQuestions, vylúčené isUnknown/wasSkipped
```

**Smerovanie podľa `maps_to_score`, nie podľa `category` (zmena v1.5):** `category` je organizačné pole modulu. Pôvodný filter `q.category === cat` (a) púšťal do skóre otázky bez `ors_*` tagu — `cx_B02` je čisto risk-flag otázka so 6/7 nulovými možnosťami a váhou 0.8, `cx_B06_ecommerce` sýti len DII; obe systematicky deflovali kategóriu B — a (b) ignoroval deklarované sekundárne príspevky duálne tagovaných otázok (`ind_04`/`cx_A03` → aj `ors_B`, `ind_09_server_age`/`cx_D03_server`/`ind_14`/`cx_F06` → aj `ors_E`, `cx_B05`/`cx_DII04` → `ors_F`). Otázka s viacerými `ors_*` tagmi prispieva plnou váhou do každej tagovanej kategórie — item mapa v `METHODOLOGY.md` §11 prekryvy dokumentuje per otázka.

```

measured = catAnswers.length > 0
catScore = measured ? Σ(answer.score × question.weight) / Σ(question.weight) : null

// Spoľahlivosť z toho, čo sa respondenta REÁLNE spýtalo.
askedCount   = odpovede na otázky kategórie, vylúčené wasSkipped
unknownCount = z nich tie s isUnknown
unknownRatio = askedCount > 0 ? unknownCount / askedCount : 1

confidence:
  unknownRatio > 0.50 (scoringConfig.unknownAnswerExclusionThreshold) → 'low'
  unknownRatio > 0.25 (natvrdo v kóde)                                → 'medium'
  inak                                                                 → 'high'
```


> **Oprava 5. 8. 2026.** Menovateľom bol počet VŠETKÝCH otázok kategórie, takže
> sa doň rátali aj otázky preskočené vetvením a tie, ku ktorým sa respondent
> vôbec nedostal. Adaptívny kvíz tým sám znižoval spoľahlivosť: firma, ktorá
> odpovedala na všetko, čo dostala, mohla mať `low` len preto, že jej vetvenie
> polovicu otázok odfiltrovalo. Preskočené otázky sa odteraz zapisujú medzi
> odpovede s príznakom `wasSkipped` a dôvodom, takže sa dá odlíšiť „Neviem"
> od „nikdy sme sa nespýtali".

**Nemerané ≠ 0:** kategória bez jedinej platnej odpovede má `measured: false`, `score: null`, `contribution: null` a do celkového ORS **nevstupuje** (viď §3.2). Pozn.: `unknownAnswerExclusionThreshold` napriek názvu nič "neexcluduje" — len znižuje confidence; skutočné vyradenie robí `measured`.

### 3.2 Celkové ORS — renormalizácia cez merané kategórie

```
merané = kategórie s measured === true
orsScore = Σ(catScore × weight, cez merané) / Σ(weight, cez merané)

Ak merané = ∅ (všetko Neviem/preskočené):
  → score/scorePenalized/maturityLevel/maturityLabelSk = null; measuredCategories = 0

Default váhy (scoringConfig.categoryWeights):
  A (Procesy):                20 %
  B (Systémy/Integrácie):     20 %
  C (Dáta/Reporting):         15 %
  D (Infraštruktúra/Cloud):   15 %
  E (Bezpečnosť/Tech dlh):    20 %
  F (Governance/Ľudia):       10 %
```

**Zmena oproti pôvodnej implementácii:** predtým nemeraná kategória prispievala `0 × váha` a implicitný menovateľ zostával 1.0 — nemeraná D (0.15) znamenala strop ORS 85 (fantómový ťah nuly). Renormalizácia znamená, že skóre vypovedá o tom, čo sa meralo; pokrytie komunikuje `measuredCategories` + per-kategória `confidence` v UI. Vedomý dôsledok: riedke assessmenty majú ORS vyššie než v starej metodike a dlhodobé odporúčania s bránou > 60/70 sa môžu novo odomknúť.

Zaokrúhľuje sa výsledný podiel (nie kontribúcie pred súčtom ako predtým); `contribution` v kategórii je informatívne pole `round(catScore × weight)`.

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
Ak categories['E'].measured  A ZÁROVEŇ  categories['E'].score < 30:
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
  "measuredCategories": 5,
  "maturityLevel": 2,
  "maturityLabelSk": "Rozvíjajúci sa",
  "categories": {
    "A": { "name": "...", "score": 45, "measured": true, "weight": 0.20, "contribution": 9.0, "answeredQuestions": 4, "totalQuestions": 5, "confidence": "high" },
    "D": { "name": "...", "score": null, "measured": false, "weight": 0.15, "contribution": null, "answeredQuestions": 0, "totalQuestions": 3, "confidence": "low" }
  },
  "penaltyApplied": false,
  "penaltyReason": null
}
```

Nemerané kategórie sa v UI zobrazujú ako „–" (nie 0): radar ich vynecháva (pri < 3 meraných sa radar skryje úplne), legenda ich značí neutrálne, `recommendationEngine` pre ne nespúšťa žiadne pravidlá a `roiEngine` preskakuje governance disclaimer pri nemeranej F.

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

Vracia `score: null` (nie 0) pri nezmeranom stave — pôvodne referenčná implementácia správneho N/A správania; od scoring v1.5 majú DII (§2.2) aj ORS (§3.1–3.2) rovnakú sémantiku.

Zdrojové otázky (aktuálne): `ind_15_ai`, `cx_DII03`, `cx_A06_ai_automation`, `cx_F07_ai_governance`.

---

## 5. Technical Debt & Risk Index (TDRI)

Implementácia: `engines/riskEngine.ts` → `calculateTDRI(answers, questions, riskFlags)`.

### 5.1 Princíp

Samostatný penalizačný index (0–100, vyššie = horšie), nezávislý od ORS.

### 5.2 Risk faktory

14 faktorov definovaných v `data/scoringConfig.ts` (`riskFactorDefinitions`) — tabuľka RF01–RF14 s `maxPenalty` a `severity` je v `QUESTION_BANK_GUIDE.md` §7 (jeden zdroj pravdy pre obe strany — otázky aj scoring).

### 5.3 Výpočet penalty per faktor

Penalta stojí na **dvoch nezávislých veličinách**: závažnosti rizika (už je
zapečená v `maxPenalty` — kritické faktory 15, stredné 4–6) a sile dôkazu
(potvrdené firmou vs. odvodené zo skóre).

```
evidenceStrength:
  riskFlags obsahuje factor.id (aktivované cez flag_risk)  → 'confirmed'
  inak, z odpovedí na otázky s maps_to_risk obsahujúcim factor.id:
    relevantAnswers = tieto odpovede, vylúčené isUnknown/wasSkipped A vylúčené
                      otázky, kde VŠETKY možnosti majú score 0 (informačné)
    avgScore = priemer(relevantAnswers.score), alebo 100 ak žiadne nezostali
    avgScore < 30 → 'inferred_strong' | < 60 → 'inferred_moderate' | inak 'none'

rawPenalty = maxPenalty × riskConfidenceMultipliers[evidenceStrength]
             confirmed 1.0 | inferred_strong 0.7 | inferred_moderate 0.35 | none 0

penalty    = rawPenalty / tdriMaxPenaltySum × 100      // normalizácia
```

> **Oprava 5. 8. 2026 — inverzia penált.** Závažnosť sa počítala dvakrát: raz
> v `maxPenalty` a ešte raz cez samostatný severity multiplikátor (1.0/0.8/0.6).
> Vznikla tým inverzia — potvrdené stredné riziko dostalo 0,6 × maxPenalty, kým
> to isté riziko **iba odvodené** z nízkeho skóre dostalo 0,8 ×. Priznanie
> problému teda skórovalo lepšie než dohad a zlepšenie odpovede vedelo index
> rizika **zvýšiť**. Teraz sa násobí len sila dôkazu; poradie
> `confirmed > inferred_strong > inferred_moderate` platí pre každú závažnosť
> a stráži ho property test nad všetkými 14 faktormi.

**Poznámka k verzii 1.0.0:** čiastočná cesta vylučuje "Neviem"/preskočené odpovede a otázky bez bodovateľných možností (predtým napr. informačná otázka `cx_B02` — "ktorý systém je najkritickejší", všetky možnosti `score: 0` — aktivovala RF06 na 80 % penalizácie pre **každého** respondenta komplexného kvízu bez ohľadu na odpoveď).

### 5.4 Súčet a pásma

```
totalPenalty = min(100, Σ penalty[rf])      // min() je len poistka

score: 0–15 → 'low' ("Dobre riadené") | 16–35 → 'medium' | 36–60 → 'high' | 61–100 → 'critical'
```

Prahy sa čítajú z `scoringConfig.riskThresholds` (typ je trojica, aby
destrukturácia nemohla dať `undefined`); pásmo počíta exportovaná
`getRiskLevel`, ktorú používa aj `recommendationEngine` — dovtedy si prahy
prepisovali natvrdo tri miesta.

**Normalizácia (5. 8. 2026):** menovateľom je `tdriMaxPenaltySum`, teda súčet
všetkých `maxPenalty` (dnes 112). Počíta sa **z definícií**, nikdy sa nepíše
ako literál — pri pridaní pätnásteho faktora by sa inak strop ticho posunul a
pásma by prestali sedieť. Normalizuje sa aj penalta **per faktor**, inak by
gate pre odporúčania žil na inej škále než samotné skóre.

> Predtým bolo maximum ≈ 93,4, nie 100, takže pásmo `critical` (61–100) bolo
> fakticky 61–93 a `min(100, …)` bol nedosiahnuteľný strop. Dokumentácia si
> navyše protirečila — tu bolo 93,4, v checkliste 86,2 (čo bol strop firmy,
> ktorej sa netýka NIS2 a má vyriešenú e-fakturáciu, nie všeobecné maximum).

**Porovnateľnosť kvízov:** indikatívny kvíz nemá zdrojové otázky pre časť
faktorov, takže jeho TDRI vychádza systematicky nižšie než z komplexného.
Menovateľ je zámerne spoločný — vlastný menovateľ pre indikatívny by zlepšil
čitateľnosť, ale rozbil porovnateľnosť s uloženými a peer výsledkami.

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
- Plne preskočená/nezodpovedaná kategória/bucket vracia `null` + `measured: false` jednotne naprieč DII, ORS aj AI Readiness (§2.2, §3.1–3.2) — nezmerané sa nikde nefabrikuje na 0.

---

## 8. Indikatívny vs. komplexný kvíz

Motor **nerozlišuje** typ kvízu vo výpočte — `calculateDII`/`calculateORS`/`calculateAIReadiness`/`calculateTDRI` dostávajú len `answers` a `questions`, žiadny parameter `assessmentType`. Rozdiel medzi kvízmi je čisto v tom, **koľko a ktoré otázky boli zodpovedané** (menej otázok v indikatívnom kvíze → menej dát → nižšia `confidence` na kategóriovej úrovni, ale **nie** explicitné confidence pásmo na úrovni celkového skóre ako 45 ± 15). Označenie výsledku ako orientačný/plný sa deje len na úrovni UI (typ assessmentu v `ResultSnapshot`), nie vo vzorcoch.

---

## 9. Konfigurácia

Parametre v `data/scoringConfig.ts` (zdroj pravdy) / `config/model/scoringConfig.json` (editovateľná kópia — treba manuálne synchronizovať):

```ts
{
  version: '1.5',
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
