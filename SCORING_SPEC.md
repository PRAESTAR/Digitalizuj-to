# digitalizuj.to — Scoring Specification

> **Platí pre:** otázková banka `1.7` · scoring config `1.5` · overené 2026-08-06
>
> Dokument nemá vlastné číslo verzie — má ho model, ktorý opisuje.
> Zhodu pečiatky so zdrojmi kontroluje build (`validate-model.mjs` #16),
> takže revízia modelu bez prečítania dokumentácie zhodí build.
> História zmien modelu: [`MODEL_VERSIONS.md`](MODEL_VERSIONS.md).
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
| `likert_11` | Rovnako ako `single_choice` — 11 možností so skóre 0/10/…/100. Vlastnú vetvu vo výpočte NEMÁ; líši sa len vykreslením a pravidlami validátora (§7.4). |
| `multi_select` (normálny) | `min(100, round(Σ vybraných option.score / max_score × 100))`. |
| `multi_select` (invertovaný, `scoring_mode: "inverted"`) | `max(0, 100 + Σ vybraných option.score)` — možnosti majú záporné skóre. |

Typy `numeric_input`, `numeric_bands`, `conditional_matrix` spomínané v pôvodnej dokumentácii **nie sú implementované** — `QuestionCard.tsx` podporuje výhradne `single_choice` a `multi_select`.

### 7.1b Kedy smie byť otázka škálou 0–10

Typ `likert_11` je **vyhradený pre subjektívny úsudok o budúcnosti** — zámer,
ochota, pravdepodobnosť. Zvyšok banky stojí na behaviorálne ukotvených
možnostiach („Máme zdokumentovaný postup obnovy"), lebo tie dajú dvom firmám
s rovnakou praxou rovnakú odpoveď. Holé číslo taký referenčný bod nemá: dve
firmy s identickými zálohami dajú 3 a 8 podľa toho, aká je ktorá sebakritická.
**Na merateľný stav je preto škála 0–10 horšia než ukotvená možnosť.**

Použiteľná je len tam, kde meraná vec sama JE subjektívna pravdepodobnosť
a ukotviť sa nedá. Dnes je taká otázka jedna: zámer investovať
(`ind_16_intent`, `cx_F07_intent`).

Obmedzenie vynucuje **validátor (kontrola #13)**, nie len tento text — inak by
sa z typu časom stal lenivý default a banka by sa zosunula z doloženej
evidencie na pocitový dotazník. Kontrola vyžaduje:

- `question_type: 'likert_11'` a `scale: 'likert-11'` vždy spolu,
- obe kotvy (`anchor_low_sk`, `anchor_high_sk`) — bez nich je to číselník bez významu,
- `evidence_type: 'self_assessment'`,
- **žiadne sýtenie DII** — premenné Eurostatu sú binárne fakty, sebahodnotenie na ne odpovedať nevie,
- pri sýtení ktorejkoľvek ORS kategórie navyše písomné `likert_ors_rationale`.

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


---

## 8. Konfidenčné pásma

Implementácia: `engines/scoringEngine.ts` → `categorySensitivity`, pole `band`
na `DIIScore`, `ORSScore` a `CategoryScore`.

**Čo pásmo NIE JE.** Nie je to štatistický interval spoľahlivosti. Ten by
vyžadoval rozptylovú štruktúru položiek z pilotu, ktorý zatiaľ nebehol (viď
reliability roadmapa v `IMPROVEMENT_CHECKLIST.md`). Vydávať odhad za interval
spoľahlivosti by bola presne tá falošná presnosť, ktorú má pásmo odstrániť.

**Čo pásmo JE.** Deterministický rozsah odvodený z toho, čo dotazník nezistil.

### 8.1 DII — logická hranica z nemeraných indikátorov

```
unmeasured = 12 − measuredIndicators
band.lower = metIndicators                 // všetky nemerané nesplnené
band.upper = metIndicators + unmeasured    // všetky nemerané splnené
```

Bod `score12 = round(met/measured × 12)` leží vždy vnútri: z `m ≤ k` a
`k ≤ 12` vyplýva `(m − k)(12 − k) ≤ 0`, teda `12m/k ≤ m + 12 − k`.
Stráži to test.

### 8.2 ORS — citlivosť na jednu odpoveď

Kategória je vážený priemer položiek, takže vplyv položky je `w_i / Σw` krát
jej krok. Maximum cez položky je citlivosť: **o koľko bodov pohne kategóriou
zmena jedinej odpovede**.

```
krok single_choice  = 100 / (počet možností − 1)          // susedná možnosť
krok multi_select   = najväčšia |option.score|            // jedna zaškrtnutá položka
                      (pri normálnom režime prepočítaná cez max_score na 0–100)

sensitivity = max cez zodpovedané položky ( w_i / Σw × krok_i )
band = [max(0, score − sensitivity), min(100, score + sensitivity)]
```

Krok multi-selectu je **jedna položka, nie celý rozsah**. Pri
`cx_A05`/`ind_03c_manual` posunie jedna zaškrtnutá položka skóre najviac
o 14 bodov; brať ju ako plný stupeň by nafúklo rozsah kategórie A
štvornásobne oproti tomu, čo sa reálne môže stať. Do citlivosti vstupujú len
položky so **zodpovedanou** otázkou; nezodpovedané do priemeru nikdy
nevstúpili, takže by rozsah nafúkli o niečo, čo skóre neovplyvnilo.

Celkové ORS pásmo sa skladá z kategóriových pásiem tým istým váženým
priemerom ako bodový odhad, takže bod leží vždy vnútri.

**Prečo práve toto.** Kategória meraná jedinou otázkou sa pohne o celý stupeň,
kategória so šiestimi o zlomok. Indikatívny kvíz meria kategóriu C jednou
otázkou, komplexný tromi — a presne tento rozdiel dovtedy na výsledku vidieť
nebolo. Test to overuje priamo na reálnej banke: rovnaké odpovede,
indikatívna vetva má širší rozsah než komplexná.

**Čo pásmo nepokrýva.** Reliabilitu samotného nástroja (vnútornú konzistenciu
položiek). To je otázka na pilot a Cronbachovu alfu, nie na výpočet nad
jedným respondentom. Penalizovaná hodnota ORS pásmo nedostáva — penalta je
odvodená úprava, nie meranie.

### 8.3 Ako to vyzerá v číslach

Rovnaké „stredné" odpovede na oboch vetvách (banka 1.6):

| | ORS | Rozsah | Šírka | DII | Rozsah |
|---|---|---|---|---|---|
| Indikatívny (18 otázok) | 51,9 | 37,3–66,5 | 29,2 | 6/12 | 4–8 |
| Komplexný (57 otázok) | 58,9 | 52,7–65,0 | 12,3 | 7/12 | 6–8 |

Rozdiel ženie kategória C: indikatívny kvíz ju meria **jedinou** otázkou
(rozsah 25–75), komplexný tromi (44,9–65,7).

**Pri bezpečnostnej penalizácii** prejde pásmo tým istým násobkom ako bod.
Bez toho karta vypisovala penalizované číslo nad rozsahom počítaným
z nepenalizovaného skóre — firma so slabou bezpečnosťou videla napríklad
„28/100" a hneď pod tým „Rozsah 35–46", teda číslo mimo vlastného rozsahu.
Penalta je deterministický násobok, takže rovnaký prenos hraníc je korektný.

**V UI** sa rozsah zobrazuje len vtedy, keď je širší než bod: pri plnom
pokrytí by „6–6" nič nehovorilo.

---

## 9. Presnosť výpočtu a sémantika pásiem

### 9.1 Zaokrúhľuje sa až zobrazenie

ORS prechádzal **tromi zaokrúhleniami za sebou**: skóre kategórie na desatinu,
z tých zaokrúhlených vážený priemer, ten sa zaokrúhlil znova a až z neho sa
odvodil maturity level. Zmerané na reálnej banke: drift do **0,12 bodu** a
v **27 zo 4 000** kombinácií odpovedí (0,7 %) preklopený level — teda iná
nálepka („Rozvíjajúci sa" vs. „Pokročilý") než dáva presná matematika.

Od 6. 8. 2026 sa zaokrúhľuje len to, čo ide do výstupu. Z plnej presnosti sa
počíta:

- vážený priemer kategórií → celkové ORS,
- **prah aj násobok bezpečnostnej penalizácie** (pri kategórii E tesne pod 30
  rozhodovala desatina o tom, či penalta vôbec nastúpi),
- maturity level,
- konfidenčné pásmo.

Zvyškový rozdiel je **0,05 bodu** — presne polovica kroku zobrazenia, teda
teoretické minimum pri jednom desatinnom mieste. Stráži to test
`engines/rounding.test.ts`, ktorý drží presnú referenčnú implementáciu vedľa
enginu a porovnáva ich na 4 000 kombináciách odpovedí.

### 9.2 Pásma maturity sú polootvorené zdola

Porovnáva sa **ostrým `>`**, takže prah patrí do NIŽŠIEHO pásma. Pri
`maturityThresholds = [20, 40, 60, 80]`:

| Level | Rozsah | Nálepka |
|---|---|---|
| 0 | [0, 20] | Digitálny nováčik |
| 1 | (20, 40] | Začiatočník |
| 2 | (40, 60] | Rozvíjajúci sa |
| 3 | (60, 80] | Pokročilý |
| 4 | (80, 100] | Digitálny líder |

Hodnota **presne na prahu** je práve tá, o ktorú sa vedú spory — skóre 40,0 je
level 1, nie 2. Testované per hranicu.

### 9.3 Level sa počíta z PENALIZOVANÉHO skóre

Nálepka hovorí o stave **po zohľadnení bezpečnosti**, nie o surovej zrelosti.
Firma s dobrými procesmi a kritickou bezpečnosťou dostane nižší level, a to je
zámer — nie chyba. Nepenalizované `score` zostáva vo výstupe pre audit, v UI
sa nezobrazuje.

## 10. Indikatívny vs. komplexný kvíz

Motor **nerozlišuje** typ kvízu vo výpočte — `calculateDII`/`calculateORS`/`calculateAIReadiness`/`calculateTDRI` dostávajú len `answers` a `questions`, žiadny parameter `assessmentType`. Rozdiel medzi kvízmi je čisto v tom, **koľko a ktoré otázky boli zodpovedané**, a prejaví sa dvoma cestami:

1. nižšia `confidence` na kategóriovej úrovni (podiel „Neviem" na položených otázkach),
2. **širšie konfidenčné pásmo** na úrovni celkového skóre (§8) — kategória meraná jedinou otázkou má rozsah ±25 bodov, kategória so šiestimi zlomok z toho.

Pásmo nevzniká z parametra `assessmentType`, ale zo skutočného zloženia zodpovedaných položiek, takže funguje aj pre nedokončený alebo silne rozvetvený kvíz. Označenie výsledku ako orientačný/plný sa naďalej deje len na úrovni UI (typ assessmentu v `ResultSnapshot`), nie vo vzorcoch.

> **Zmena 6. 8. 2026.** Táto sekcia dovtedy tvrdila, že explicitné pásmo na úrovni celkového skóre **neexistuje**. Od zavedenia §8 to už neplatí.

---

## 11. Konfigurácia

Parametre v `data/scoringConfig.ts` (**zdroj pravdy**). `config/model/scoringConfig.json` je z neho **generovaný pohľad** pre editorov modelu — runtime ho nečíta a ručná zmena v ňom nič nezmení; regeneruje sa cez `npm run config:sync` a build kontroluje zhodu (validátor #14):

```ts
{
  version: '1.5',
  diiMethodologyVersion: 'DII v3 (Eurostat isoc_e_dii, prieskum 2025)',
  categoryWeights: { A: 0.20, B: 0.20, C: 0.15, D: 0.15, E: 0.20, F: 0.10 },
  maturityThresholds: [20, 40, 60, 80],
  riskThresholds: [15, 35, 60],
  securityPenaltyThreshold: 30,
  securityPenaltyMaxFactor: 0.30,
  unknownAnswerExclusionThreshold: 0.50,   // podiel „Neviem" → confidence 'low'
  unknownAnswerMediumThreshold: 0.25,      // ten istý podiel → 'medium'
  diiTotalIndicators: 12,                  // DII v3/2025; v4 zmení počet aj mapovanie
  diiLevelCutoffs: [3, 6, 9],              // score12 <= cutoff → pásmo
  diiConfidenceMinIndicators: { high: 10, medium: 6 },
  aiConfidenceMinAnswers: 2,               // minimum odpovedí pre AI confidence 'medium'
  pilotCriteria: { … },                    // kritériá prijatia pilotu
}
```

`aiReadinessThresholds` (`[25, 55, 80]`) a `aiReadinessLabels` sú definované samostatne v tom istom súbore.

Hardcoded hodnoty, ktoré **nie sú** v konfigurácii (zvyšná medzera, stav 6. 8. 2026):

- **binárny prah 50** pri proxy riadkoch DII mapovania,
- **TDRI pásma [15, 35, 60]** sú duplicitne aj natvrdo v `riskEngine.ts` popri `scoringConfig.riskThresholds`,
- **pásma percentilu DII** v `benchmarkEngine.ts` (`DII_BANDS`) opakujú tie isté hranice ako `diiLevelCutoffs`, len posunuté o pol bodu kvôli korekcii spojitosti.

> **Zmena 6. 8. 2026.** Tento odsek dovtedy uvádzal aj DII level cutoffs (3/6/9)
> a medium-confidence cutoff 0,25 — obe sú odvtedy v konfigurácii
> (`diiLevelCutoffs`, `unknownAnswerMediumThreshold`). Veta ostala nezmenená
> pri commite, ktorý ich presunul, takže špecifikácia chvíľu posielala čitateľa
> hľadať ich do enginu, kde už neboli.
