# Pokyny na editovanie matice otázok (questionBank.json)

> Verzia: 2.0 (prepísané podľa reálnej implementácie pre release 1.0.0)
> Posledná aktualizácia: 2026-07-24
>
> **Táto verzia nahrádza 1.0-MVP**, ktorá popisovala schému (`assessment_type`, `module`, `text`, `maps_to_dii`, `branching` objekt), akú kód nikdy neimplementoval. Nižšie je schéma taká, aká skutočne existuje v `data/questionBank.json` a akú číta `engines/questionEngine.ts`.

---

## 1. Prehľad štruktúry

Súbor `questionBank.json` má dve hlavné sekcie:

```json
{
  "version": "1.4-MVP",
  "model_name": "Adaptívny model DAP",
  "last_updated": "2026-07-24",
  "indicative_quiz": {
    "id": "indicative_v1",
    "name": "Indikatívny kvíz",
    "description": "...",
    "max_questions": 15,
    "questions": [ /* plochý zoznam otázok */ ]
  },
  "complex_quiz": {
    "id": "complex_v1",
    "name": "Komplexný kvíz",
    "description": "...",
    "modules": [
      { "id": "module_meta", "name": "O firme", "category": "meta", "questions": [ /* ... */ ] },
      { "id": "module_A", "name": "Procesy a digitalizácia práce", "category": "A", "questions": [ /* ... */ ] },
      /* module_B .. module_F, module_ROI, module_DII */
    ]
  }
}
```

- **Indikatívny kvíz** — plochý zoznam v `indicative_quiz.questions` (žiadne moduly). Aktuálne **19 otázok**.
- **Komplexný kvíz** — otázky sú rozdelené do `complex_quiz.modules[].questions`. `questionEngine.getQuizQuestions('complex')` ich sploští do jedného poľa v poradí modulov (`module_meta`, `module_A`...`module_F`, `module_ROI`, `module_DII`). Aktuálne **58 otázok** definovaných naprieč 9 modulmi; keďže vetvenie je od verzie 1.4-MVP reálne podmienené (viď sekcia 5.2), konkrétny respondent reálne uvidí typicky **50–58** z nich — presný počet po úprave otázok si vždy overte priamo v súbore.

Poradie otázok v poli/module **je funkčné** — `questionEngine.getNextQuestion()` vracia prvú nezodpovedanú, nepreskočenú otázku v tomto poradí (lineárne skenovanie, nie prioritizácia podľa ID).

---

## 2. Štruktúra jednej otázky (skutočná schéma)

```json
{
  "id": "cx_A06_ai_automation",
  "category": "A",
  "dimension": "ai_automation",
  "question_sk": "Využívate pri automatizácii procesov umelú inteligenciu (nie len pevné pravidlá/skripty)?",
  "question_type": "single_choice",
  "weight": 1.0,
  "options": [
    { "value": "none", "label": "Automatizáciu nevyužívame vôbec", "score": 0 },
    { "value": "rules_only", "label": "Len jednoduché pravidlá/skripty (bez AI)", "score": 40 },
    { "value": "ai_assisted", "label": "AI nám pomáha pri časti procesov", "score": 70 },
    { "value": "ai_driven", "label": "AI aktívne riadi/vykonáva časti procesov", "score": 100 }
  ],
  "branching_rules": [],
  "evidence_type": "self_assessment",
  "maps_to_score": ["ors_A", "ai_readiness"],
  "maps_to_risk": [],
  "maps_to_roi_model": [],
  "tooltip": "Rozdiel oproti bežnej automatizácii: AI dokáže spracovať neštruktúrované vstupy...",
  "allow_unknown": true
}
```

### 2.1 Polia — presný zoznam

| Pole | Typ | Povinné | Popis |
|------|-----|---------|-------|
| `id` | string | áno | Unikátny identifikátor. **Nemeniť existujúce ID** — kód aj branching pravidlá naň odkazujú. |
| `category` | string | áno | `"A"`–`"F"` (ODRM kategória), `"dii"` (iba DII bucket, nepatrí do ORS), `"meta"` (demografia/ROI vstup, `weight: 0`, neprispieva do žiadneho skóre). |
| `dimension` | string | áno | Voľný popisný label pre editorov (napr. `"process_maturity"`, `"ai_usage"`) — kód ho nečíta, slúži len ako orientácia v UI editora. |
| `question_sk` | string | áno | Text otázky v slovenčine. **Nie** `text` — pole sa volá presne `question_sk`. |
| `question_type` | string | áno | **Iba `"single_choice"` alebo `"multi_select"` sú implementované** (`QuestionCard.tsx`). Iné hodnoty (napr. `numeric_bands`, `numeric_input`) nie sú podporené v UI — nepoužívať. |
| `weight` | number | áno | Váha otázky v rámci kategórie (default `1.0`, meta otázky majú `0`). |
| `options` | array | pre single/multi | `{ value, label, score }`. `score` je číslo, typicky 0–100. |
| `max_score` | number | pre multi_select | Súčet, voči ktorému sa normalizuje `multi_select` skóre (viď 4.2). |
| `scoring_note` | string | nie | Prozaická poznámka pre autora. Engine ju **nečíta** — od 5. 8. 2026 rozhoduje pole `scoring_mode`. |
| `scoring_mode` | string | nie | `"standard"` (default) alebo `"inverted"` — invertovaný scoring pre `multi_select` (viď 4.3). Predtým sa režim detegoval podľa výskytu slova „Invertované" v `scoring_note`, takže jej preformulovanie alebo preklad ticho menili spôsob výpočtu. |
| `branching_rules` | array | áno (môže byť `[]`) | Pole pravidiel — **nie** `branching` objekt. Presná štruktúra v sekcii 5. |
| `evidence_type` | string | áno | `"direct"` alebo `"self_assessment"` — informačné, kód ho nevyhodnocuje. |
| `maps_to_score` | **string[]** | áno (môže byť `[]`) | **Pole**, nie jeden string. Otázka môže prispievať do viacerých vecí naraz — napr. `["ors_D", "dii"]`. Hodnoty: `"ors_A"`..`"ors_F"` (kategória ORS), `"dii"` (DII bucket), `"ai_readiness"` (AI & Automatizácia Readiness), `"benchmark_sector"` / `"benchmark_size"` (meta otázky, ktoré nastavujú `respondent.sector`/`employeeCountBand` — číta ich priamo `AssessmentContext`, nie scoring engine). |
| `maps_to_risk` | **string[]** | áno (môže byť `[]`) | Pole risk faktorov `"RF01"`–`"RF14"` (viď sekcia 7). |
| `maps_to_roi_model` | **string[]** | áno (môže byť `[]`) | Popisné pole pre editorov. **Pozor:** `roiEngine.extractROIInputs()` v skutočnosti číta hodnoty podľa **natvrdo napísaných ID otázok** (`ind_02`, `cx_02`, `cx_A05`, `cx_ROI02`, `cx_ROI03`...), nie podľa tohto poľa — pridanie `maps_to_roi_model` samo o sebe nezapojí otázku do ROI výpočtu. |
| `tooltip` | string \| null | nie | Vysvetľujúci text, zobrazí sa ako hint. |
| `allow_unknown` | boolean | áno | Či je dostupná možnosť "Neviem". |

Neexistujúce polia (nepridávať — kód ich nikde nečíta): `assessment_type`, `module`, `text`, `type`, `maps_to_dii`, `maps_to_roi_variable`, `branching` (objekt).

**Mapovanie na 12 DII indikátorov NEŽIJE v banke** — je v `data/diiIndicators.json` (kritériá s prahmi a odôvodnením per indikátor v3/2025). Každá otázka s `"dii"` v `maps_to_score` tam musí byť buď kritériom indikátora, alebo v `excludedDiiQuestions` s dôvodom — build validátor to vynucuje (check #8). Pri pridávaní/vyraďovaní `dii` otázky vždy aktualizujte aj toto mapovanie.

---

## 3. Kam otázka patrí — `category` a umiestnenie v súbore

Umiestnenie otázky v súbore (do ktorého poľa/modulu ju vložíte) určuje, v ktorom kvíze sa zobrazí — **nie** samostatné pole. Otázka pre indikatívny kvíz ide do `indicative_quiz.questions`; otázka pre komplexný kvíz ide do príslušného `complex_quiz.modules[].questions`.

`category` pole na otázke je nezávislé od toho, do akého modulu ju vložíte, a od scoring v1.5 je **čisto organizačné** — do ORS kategórií smerujú otázky výhradne cez `ors_A`…`ors_F` hodnoty v `maps_to_score` (`scoringEngine.calculateORS` filtruje `q.maps_to_score.includes('ors_' + cat)`). Otázka bez `ors_*` tagu (napr. čisto risk-flag `cx_B02`) do žiadnej kategórie neprispieva.

---

## 4. Scoring — pravidlá pre `score` hodnoty

### 4.1 Single choice

Skóre je priamo hodnota vybranej `option.score` (0–100). Žiadna ďalšia normalizácia.

**Povinné pole `scale`:** každá single-choice otázka musí deklarovať škálu — build validátor (`scripts/validate-model.mjs`, check #5/#6) inak zlyhá:

- `linear-N` — presne N možností s rovnomerným bodovaním `round(i × 100 / (N−1))`; validátor bodovanie kontroluje proti deklarácii.
- `categorical` / `descending` / `custom` — odchýlky od lineárnej škály; **vyžadujú `scale_rationale`** (zdôvodnenie odchýlky).
- `meta` — neskórovaná otázka (firmografia, ROI vstupy).

**Typické lineárne rozloženia:**

5-stupňová maturity škála (`linear-5`): `0 / 25 / 50 / 75 / 100`
4-stupňová (`linear-4`): `0 / 33 / 67 / 100`
3-stupňová (`linear-3`): `0 / 50 / 100`
Binárna (`linear-2`): `0 / 100`

### 4.2 Multi select (normálny režim)

```
selectedScore = súčet score vybraných možností
skóre = min(100, round(selectedScore / max_score × 100))
```

Nastavte `score` jednotlivých možností tak, aby ich súčet zodpovedal `max_score` (typicky `100`).

### 4.3 Multi select (invertovaný režim)

Zapína sa poľom **`scoring_mode: "inverted"`**. V tomto režime majú možnosti **záporné** `score` hodnoty a platí:

```
skóre = max(0, 100 + súčet score vybraných možností)
```

Príklad — `cx_A05` (ktoré procesy sú prevažne ručné): každá vybraná manuálna možnosť odčíta body od 100. **Pozor:** ak záporné hodnoty možností v súčte nedosahujú −100, firma s úplne všetkými manuálnymi procesmi nedostane 0, ale zvyšok (napr. −70 v súčte → skóre 30). Pri návrhu invertovanej otázky si súčet záporných hodnôt overte tak, aby dával zmysel pri najhoršom možnom výbere.

### 4.4 "Neviem" a preskočené otázky

- `allow_unknown: true` sprístupní tlačidlo "Neviem" — uloží sa `isUnknown: true`, `score: 0`.
- Scoring engine (`calculateDII`, `calculateORS`) **vylučuje** `isUnknown`/`wasSkipped` odpovede z menovateľa — neznižujú skóre, len znižujú confidence kategórie.
- **Dôležité:** branching pravidlá sa pre "Neviem" odpovede **nevyhodnocujú** (`AssessmentContext.tsx`: `if (!action.isUnknown) evaluateBranching(...)`). To znamená, že `skip_if`/`flag_risk` naviazané na otázku sa pri odpovedi "Neviem" nikdy nespustia — otázky určené na preskočenie zostanú v zozname a risk flag sa nenastaví. Ak je toto pre vašu otázku problém (napr. bezpečnostná otázka, kde "Neviem" by mala byť rizikový signál), doplňte to zatiaľ len do `tooltip`/UX, kód to automaticky nerieši.

---

## 5. Branching pravidlá (skutočná štruktúra)

Pravidlá sú **pole priamo na spúšťacej otázke**, nie samostatný `branching` objekt s `question_id` odkazom:

```json
{
  "id": "ind_10",
  "...": "...",
  "branching_rules": [
    {
      "condition": "!selected.includes('backup')",
      "action": "flag_risk",
      "target": "RF02",
      "reason": "Chýbajúce zálohy = critical risk"
    },
    {
      "condition": "value == 'eol'",
      "action": "flag_risk",
      "target": ["RF01"],
      "reason": "Server/OS mimo podpory"
    }
  ]
}
```

Pravidlo sa vyhodnotí **hneď po zodpovedaní tejto otázky** a `target` (string alebo pole stringov) odkazuje na **neskoršie** otázky (podľa poradia v poli) alebo na risk faktor.

### 5.1 Podporovaná gramatika `condition` (presne toto a nič iné)

`questionEngine.evaluateCondition()` rozpoznáva **iba** týchto 6 tvarov (regex match). Čokoľvek iné **potichu vráti `false`** — žiadna chyba, žiadne varovanie, pravidlo sa jednoducho nikdy nespustí:

| Tvar | Príklad | Platí pre |
|------|---------|-----------|
| `value == 'x'` | `value == 'eol'` | single_choice |
| `value != 'x'` | `value != 'none'` | single_choice |
| `value == 'x' \|\| value == 'y'` | `value == 'disaster' \|\| value == 'major_impact'` | single_choice (OR reťaz) |
| `selected_count <= N` (aj `>=`, `<`, `>`, `==`) | `selected_count <= 1` | multi_select |
| `selected.includes('x')` | `selected.includes('erp')` | multi_select |
| `!selected.includes('x')` | `!selected.includes('mfa')` | multi_select |

**Pred uložením zmeny branching pravidla si podmienku manuálne overte oproti tejto tabuľke** — preklep (napr. medzery navyše, dvojité úvodzovky) pravidlo ticho vyradí.

### 5.2 Akcie

| `action` | Efekt |
|----------|-------|
| `skip` | Cieľová otázka(y) sa pridá do `skippedQuestions` — nezobrazí sa a nepočíta sa. **Toto je jediný funkčný mechanizmus podmieneného vynechania/zobrazenia otázky** (viď `include` nižšie). |
| `include` | **Nepoužívať — v aktuálnej verzii enginu je no-op.** `AssessmentContext.tsx` necháva `include` ciele v zozname vždy, bez ohľadu na to, či podmienka platí, takže cieľová otázka sa reálne zobrazí vždy. Ak potrebujete podmienenú viditeľnosť otázky, autorujte ju cez **dvojicu (alebo viac) invertovaných `skip` pravidiel** na spúšťacej otázke — jedno pravidlo pre každú hodnotu/vetvu, pri ktorej sa má cieľová otázka vynechať. Vzor nájdete pri `cx_D02` (skip na `cx_D03_server`+`cx_D04_virtualization` pre cloud-only vetvy vrátane `'saas_only'`, samostatný skip na `cx_D05_cloud` pre non-cloud vetvy) alebo `cx_B01`→`cx_B06_ecommerce`, `cx_B05`→`cx_B05b_outsource`. Otázková banka od verzie 1.4-MVP `action: "include"` nikde nepoužíva. |
| `flag_risk` | Cieľ (RF01–RF14) sa pridá do `riskFlags` — `riskEngine` mu priradí plnú `maxPenalty × severityMultiplier`. |

### 5.3 Pravidlá pre editovanie branchingu

- `target` musí odkazovať na otázku, ktorá je v poli **za** touto otázkou (dopredné vetvenie).
- Vyhýbajte sa cyklickým závislostiam.
- Po úprave branchingu prejdite kvíz ručne v prehliadači (`npm run dev`) — statická validácia gramatiky podmienok zatiaľ neexistuje.

---


### 5.4 Správanie pri odpovedi „Neviem" — `on_unknown`

Voliteľné pole pravidla, hodnoty `ignore` (default) alebo `apply`.

| Hodnota | Čo sa stane pri „Neviem" |
|---|---|
| `ignore` (default) | Pravidlo sa nevyhodnotí — doterajšie správanie. |
| `apply` | Akcia sa **vykoná**, ako keby podmienka platila. |

`apply` **nevyhodnocuje podmienku nad prázdnou hodnotou** — a je to zámer.
Pri `single_choice` je hodnota prázdny reťazec, takže by nezabrala nikdy;
pri `multi_select` je prázdne pole, takže napríklad `selected_count <= 1` by
zabrala náhodou. Explicitná akcia je jediný spôsob, ako sa oba typy otázok
správajú rovnako.

**Rizikové príznaky (`flag_risk`) sa pri „Neviem" nepriznávajú ani s `apply`** —
nevedomosť nie je dôkaz o probléme (viď SCORING_SPEC §5.3).

Kedy to použiť: keď odpoveď „Neviem" fakticky znamená, že nadväzujúca otázka
nemá zmysel. Bez tohto poľa dostal respondent, ktorý priznal nevedomosť,
NAJVIAC otázok — pri type infraštruktúry sa mu nepreskočila ani serverová,
ani cloudová vetva.

Preskočené otázky sa od 5. 8. 2026 zapisujú medzi odpovede s príznakom
`wasSkipped` a dôvodom, takže sa dá odlíšiť „Neviem" od „nikdy sme sa
nespýtali". Ukazovateľ spoľahlivosti kategórie počíta len z položených otázok.

## 6. `maps_to_score` — kam otázka prispieva

| Hodnota | Význam |
|---------|--------|
| `"ors_A"` … `"ors_F"` | Prispieva do príslušnej ODRM kategórie (váhovaný priemer podľa `weight`). |
| `"dii"` | Prispieva do DII-Compatible Score **per-indikátorovo**: otázka musí mať kritérium (`minScore` alebo `anyOfValues`) v `data/diiIndicators.json` pri niektorom z indikátorov DII1–DII12, alebo byť v `excludedDiiQuestions` s dôvodom — inak build spadne (validátor check #8). Samotné `option.score` hodnoty hýbu len jemnou metrikou `score100`; o `score12` rozhodujú kritériá (pozri `SCORING_SPEC.md` §2). |
| `"ai_readiness"` | Prispieva do AI & Automatizácia Readiness Indexu (prierezový, nezávislý od ORS kategórií — architektúra rovnaká ako TDRI). |
| `"benchmark_sector"` / `"benchmark_size"` | Meta otázka, ktorej hodnota sa uloží priamo do `respondent.sector` / `respondent.employeeCountBand` (číta `AssessmentContext.tsx`, nie scoring engine). |

Otázka môže mať viac hodnôt naraz, napr. `["ors_D", "dii"]` — počíta sa do oboch nezávisle.

---

## 7. `maps_to_risk` — Risk faktory (TDRI)

| Hodnota | Risk faktor | Severity | Max penalty |
|---------|-------------|----------|-------------|
| `"RF01"` | Out-of-support core OS/DB | Critical | 15 |
| `"RF02"` | Chýbajúce zálohy core dát | Critical | 15 |
| `"RF03"` | Zálohy existujú, ale netestované | High | 8 |
| `"RF04"` | Chýbajúci patch management | Critical | 10 |
| `"RF05"` | Absencia MFA na kritických systémoch | Critical | 10 |
| `"RF06"` | Single point of failure (infraštruktúra) | High | 8 |
| `"RF07"` | Single point of failure (ľudia) | High | 8 |
| `"RF08"` | Nezdokumentované/neowned systémy | Medium | 5 |
| `"RF09"` | Žiadny BC/DR plán | High | 7 |
| `"RF10"` | Žiadny asset inventory | Medium | 4 |
| `"RF11"` | Žiadne logovanie/monitoring | Medium | 5 |
| `"RF12"` | Out-of-support aplikácie (nie core) | Medium | 5 |
| `"RF13"` | Nepripravenosť na povinnú e-fakturáciu (od 1.1.2027) | Medium | 6 |
| `"RF14"` | Nepripravenosť na NIS2 (ak sa firmu týka) | Medium | 6 |

Všetkých 14 faktorov je aktívne prepojených aspoň s jednou otázkou: RF06 cez `cx_B02` (`flag_risk` na všetkých odpovediach okrem novej no-SPOF možnosti `distributed`), RF12 cez `cx_D08_app_lifecycle`, RF13 cez `cx_DII02b`, RF14 cez novú otázku `cx_E08_nis2` (gated cez skip pravidlá na `cx_01`/`cx_02` len pre medium/large firmy v sektoroch manufacturing/transport_logistics/ict).

Aktivácia faktora funguje dvoma nezávislými cestami:
1. **Explicitná** — `flag_risk` branching pravidlo (plná penalizácia `maxPenalty × severityMultiplier`).
2. **Odvodená** — akákoľvek otázka s `maps_to_risk` obsahujúcim daný RF, aj bez `flag_risk` pravidla; ak priemerné skóre súvisiacich odpovedí (vylučujúc "Neviem" a otázky, kde všetky možnosti majú `score: 0`) klesne pod 30, aktivuje sa s penalizáciou `0.8×maxPenalty`; pod 60 s `0.3×maxPenalty`.

---

## 8. Konvencie pre ID otázok

### 8.1 Indikatívny kvíz

Prevažne `ind_XX` (napr. `ind_01`), ale viaceré majú popisnú príponu pre čitateľnosť: `ind_06_integration`, `ind_09_server_age`, `ind_15_ai`. Číslovanie **nemusí byť súvislé/zoradené** s poradím v poli — poradie v poli je to, čo sa reálne zobrazí, nie číslo v ID. Pri editácii poradia otázok preto pohybujte celým objektom v poli, nie len číslom v ID.

### 8.2 Komplexný kvíz

Formát: `cx_[Modul][NN][voliteľná prípona]`

Príklady: `cx_A01` (prvá otázka modulu A), `cx_A06_ai_automation`, `cx_DII02b` (variant b), `cx_F07_ai_governance`, `cx_ROI02`.

### 8.3 Pravidlá pre ID

- **Nemeniť existujúce ID** — branching pravidlá aj (v prípade ROI polí) `roiEngine.ts` naň odkazujú natvrdo.
- Nové ID musí byť unikátne v celom súbore (naprieč oboma kvízmi).
- Iba malé písmená, čísla a podtržník.

---

## 9. Ako pridať novú otázku

1. Skopírujte existujúcu otázku podobného typu ako štartovaciu šablónu.
2. Zmeňte `id` na nové unikátne (dodržte konvenciu zo sekcie 8).
3. Upravte `question_sk`, `tooltip`, `options`.
4. Nastavte `category`, `maps_to_score`, `maps_to_risk` podľa toho, kam má otázka prispievať.
5. Ak otázka má byť vstupom pre ROI, **nestačí** len `maps_to_roi_model` — musíte upraviť aj `engines/roiEngine.ts` (`extractROIInputs`), keďže ROI vstupy sa čítajú podľa natvrdo napísaných ID.
6. Overte, že `score` hodnoty dávajú zmysel (0 = najhoršie, 100 = najlepšie; výnimka: invertovaný multi_select, sekcia 4.3).
7. Ak pridávate do komplexného kvízu, vložte ju do správneho `modules[].questions`.
8. Otestujte v prehliadači — prejdite kvíz a overte, že sa otázka zobrazí v očakávanom poradí a branching (ak nejaký) funguje.
9. **Synchronizujte kópiu:** upravte `data/questionBank.json` (zdroj pravdy, ktorý číta aplikácia) — `config/model/questionBank.json` je len editovateľná kópia, ktorú je potrebné manuálne prekopírovať späť do `data/`.

---

## 10. Ako odstrániť otázku

> **Pozor:** Odstránenie otázky môže rozbiť branching pravidlá iných otázok.

1. Nájdite všetky otázky, ktoré majú v `branching_rules[].target` ID tejto otázky.
2. Upravte alebo odstráňte tieto pravidlá.
3. Odstráňte otázku.
4. Overte, že príslušná ODRM kategória / `dii` / `ai_readiness` bucket má stále aspoň niekoľko otázok (kategória bez otázok dostane skóre pri výpočte).

---

## 11. Validačný checklist pred importom

- [ ] Všetky `id` sú unikátne naprieč `indicative_quiz` aj `complex_quiz`.
- [ ] Každá otázka má `question_type` `"single_choice"` alebo `"multi_select"` (nič iné).
- [ ] Každá otázka má aspoň 2 `options`, každá s `value`, `label`, `score`.
- [ ] `maps_to_score`, `maps_to_risk`, `maps_to_roi_model` sú **polia** (aj keď prázdne `[]`), nie stringy.
- [ ] `branching_rules[].condition` zodpovedá jednému zo 6 podporovaných tvarov (sekcia 5.1).
- [ ] `branching_rules[].target` odkazuje na existujúce ID, ktoré je **za** aktuálnou otázkou v poli.
- [ ] Invertovaný `multi_select` má `scoring_note` obsahujúci `"Invertované"`.
- [ ] JSON je validný (over cez `ConvertFrom-Json` / `JSON.parse`, nie len vizuálne).
- [ ] Zmena je prenesená z `config/model/questionBank.json` do `data/questionBank.json` (alebo naopak) — oba súbory musia byť identické.

---

## 12. Tipy

- **Jazyk:** Texty v `question_sk`/`label`/`tooltip` so slovenskou diakritikou; `value` bez diakritiky, malé písmená, podtržníky.
- **Tooltip:** Používajte pri technických pojmoch (MFA, RPO/RTO, cloud sofistikácia...).
- **Konzistencia:** Formálne oslovenie ("vy"), rovnaký štýl formulácie naprieč otázkami.
- **Počet opcií:** 3–5 je ideálne; nad 6 pôsobí neprehľadne.
- **Pred odovzdaním:** spustite `npm run validate:model` (beží aj automaticky pri `npm run build`) — kontroluje branching ciele a poradie, rizikové faktory, škály aj DII mapovanie. Naživo (`npm run dev`) potom overte sémantiku podmienok — parser nerozpoznanú `condition` syntax ticho vyhodnotí ako false.
- **Zdroj pravdy obsahu je MariaDB** (pozri README §„Obsah modelu v databáze"): `data/questionBank.json` je nasadzovací artefakt kompilovaný z DB (`npm run model:pull`); ručná editácia JSON je výnimka, ktorú treba spätne preniesť do DB, inak ju najbližší publish prepíše.

### Rozdeľovanie dvojhlavňových otázok

Otázka, ktorá sa pýta na dve veci naraz („počítače a mobily", „výpadok alebo
strata dát"), nemá pre časť firiem pravdivú odpoveď — tie, čo majú jedno
vyriešené a druhé nie, musia si vybrať, čo zamlčia. Pri rozdeľovaní platí:

1. **Váhy sa DELIA, nie zdvojujú.** Súčet váh oboch polovíc sa musí rovnať
   pôvodnej váhe, inak téma v priemere kategórie zosilnie dvojnásobne.
   Stráži to test `data/questionBank.test.ts`.
2. **ID si ponechá tá polovica, ktorá nesie pôvodný signál.** `roiEngine`
   číta niektoré ID natvrdo (`ind_03`, `cx_A01`, `cx_A05`, `ind_02`,
   `cx_02`, `cx_ROI02`, `cx_ROI03`, `ind_03c_manual`); premenovanie by
   ROI ticho vrátilo na benchmarkové defaulty — bez chyby, bez varovania.
3. **Rizikový príznak ide na tú polovicu, ktorá ho naozaj dokladá.**
   Pôvodná `ind_11` flagovala RF02 aj RF09 z jednej odpovede; po rozdelení
   flaguje zálohová polovica RF02 a prevádzková RF09.
4. **Hodnoty možností sa nemenia, ak ich niekto vyhľadáva.**
   `ind_03c_manual` používa tie isté hodnoty ako `cx_A05`, lebo benchmarky
   procesov sa hľadajú podľa nich.

### Škála 0–10 (`likert_11`)

Vyhradená pre **subjektívny úsudok o budúcnosti** — zámer, ochota,
pravdepodobnosť. Nie pre stav, ktorý sa dá pozorovať.

Zvyšok banky používa behaviorálne ukotvené možnosti a to je jej hlavná
prednosť: dve firmy s rovnakou praxou vyberú rovnakú možnosť, lebo majú
spoločný referenčný bod. Holé číslo ho nemá — dve firmy s identickými zálohami
dajú 3 a 8 podľa toho, aká je ktorá sebakritická. Konverzia existujúcej otázky
na 0–10 by teda model **zhoršila**, nie zlepšila.

Tvar otázky:

```json
{
  "question_type": "likert_11",
  "scale": "likert-11",
  "options": [ { "value": "0", "label": "0", "score": 0 }, … 11 stupňov … ],
  "anchor_low_sk": "Nepravdepodobné",
  "anchor_high_sk": "Veľmi pravdepodobné",
  "evidence_type": "self_assessment"
}
```

Validátor (kontrola #13) vyžaduje obe kotvy, `self_assessment`, zákaz DII
a pri sýtení ORS aj písomné `likert_ors_rationale`.

**Pri pridávaní akéhokoľvek nového typu otázky treba rozšíriť aj ENUM
`questions.question_type` v `db/schema.sql`.** MariaDB v neprísnom režime
neznámu hodnotu neodmietne — uloží prázdny reťazec, import zbehne bez chyby
a rozbije sa až najbližší publish. Presne to sa stalo pri zavedení
`likert_11`; import si to odvtedy kontroluje sám (`ALLOWED_TYPES`).
