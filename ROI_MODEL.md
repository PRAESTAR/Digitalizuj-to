# digitalizuj.to — ROI & Business Impact Model

> **Platí pre:** otázková banka `1.8` · scoring config `1.6` · overené 2026-08-07
>
> Dokument nemá vlastné číslo verzie — má ho model, ktorý opisuje.
> Zhodu pečiatky so zdrojmi kontroluje build (`validate-model.mjs` #16),
> takže revízia modelu bez prečítania dokumentácie zhodí build.
> História zmien modelu: [`MODEL_VERSIONS.md`](MODEL_VERSIONS.md).
> Mzdové kotvy: Eurostat lc_lci_lev 2025 + ŠÚ SR 2025/2026 (viď §7)

---

## 1. Princípy

### 1.1 Čo model robí

Odhaduje potenciálny business dopad digitalizácie na základe:
1. **Self-reported dát** od firmy (primárny zdroj).
2. **Default benchmarkov** (fallback pri chýbajúcich dátach).
3. **Externého benchmark kontextu** (sektorové priemery).

### 1.2 Čo model NEROBÍ

- Netvrdí presný finančný dopad bez dostatočných vstupov.
- Negarantuje návratnosť investície.
- Nepredstiera presnosť tam, kde nie sú dáta.

### 1.3 Záväzné pravidlá

| Pravidlo | Implementácia |
|----------|--------------|
| Transparentnosť | Každé číslo musí byť spätne rozložiteľné na vstupy a vzorec |
| Interval namiesto bodu | Vždy konzervatívny / stredný / optimistický scenár |
| Confidence level | Explicitné označenie istoty (self-reported vs. benchmark) |
| Disclaimer | Pri benchmarkových odhadoch vždy jasný disclaimer |

---

## 2. Vstupné premenné

### 2.1 Premenné zbierané v dotazníku

| Premenná | Zdroj | Fallback |
|----------|-------|----------|
| `employee_count` | Otázka (`ind_02`/`cx_02`) | Žiadny — pri chýbajúcom údaji sa počíta s pásmom 10–49, ale priznane (viď 2.3) |
| `invoicing_volume` | Otázka `cx_ROI03` | Benchmark frekvencia podľa veľkosti firmy |
| `admin_headcount` | Otázka `cx_ROI02` | Bez stropu kapacity (viď 2.3) |
| `hourly_cost` | **Podľa odvetvia (`ind_01`/`cx_01`)** | Nepýtame sa (citlivý údaj); tabuľka v §7.1 |
| `process_frequency` | Per-proces otázka | Benchmark podľa veľkosti a sektora |
| `process_time_per_unit` | Per-proces otázka | Benchmark |
| `manual_share` | Per-proces otázka | Odvodzuje sa z maturity levelu |
| `automatable_share` | Odvodená | Benchmark podľa procesu |
| `error_rate` | Otázka | Benchmark |
| `approval_delays` | Otázka | Benchmark |

### 2.2 Benchmark fallback hodnoty

> **Zmena (verzia 1.1):** Otázka na hodinovú cenu práce (`ind_15` / `cx_ROI01`) bola z dotazníka **odstránená** — je to citlivý údaj a väčšina respondentov ho odhaduje nepresne. ROI model teraz vždy počíta s priemernou hodinovou cenou práce (viď nižšie), nie so self-reported hodnotou. Toto zjednodušenie znižuje presnosť pre firmy s výrazne podpriemernými/nadpriemernými mzdami, ale zvyšuje completion rate a odstraňuje nekonzistenciu medzi definíciami "hrubá" vs. "plná" cena práce, ktorá predtým existovala medzi oboma kvízmi.
>
> **Zmena (7. 8. 2026):** Sadzba je odteraz **podľa odvetvia respondenta**, nie jednotná. Predchádzajúce zdôvodnenie (že procesy zastrešuje IT tím, takže platí sadzba NACE J pre všetkých) neobstálo: ušetrený čas vzniká tam, kde sa proces vykonáva, nie v IT. Jednotná sadzba nadhodnocovala úsporu gastru 2,4-násobne. Tabuľka, zdroje a zmerané dopady v §7.1.

```json
{
  "hourly_cost_eur": {
    "by_sector": { "accommodation_food": 13.0, "transport_logistics": 17.2, "construction": 17.8, "wholesale_retail": 17.9, "manufacturing": 19.3, "other": 19.8, "professional_services": 24.4, "ict": 30.8 },
    "fallback_unknown_sector": 30.8,
    "note": "Plná hodinová cena práce vrátane odvodov, podľa odvetvia respondenta — nepýta sa ako otázka. Zdroj: Eurostat lc_lci_lev, vintage 2026-04-23, rok 2025, SK, lcstruct D1_D4_MD5. Pokrýva podniky od 10 zamestnancov. Revízia: ročne (aprílová publikácia); obnoviť treba CELÚ tabuľku."
  },
  "process_benchmarks": {
    "invoicing": {
      "frequency_per_month": { "small": 50, "medium": 200, "large": 500 },
      "time_per_unit_minutes": 15,
      "automatable_share": 0.70,
      "error_rate": 0.05
    },
    "order_processing": {
      "frequency_per_month": { "small": 30, "medium": 150, "large": 400 },
      "time_per_unit_minutes": 20,
      "automatable_share": 0.60,
      "error_rate": 0.03
    },
    "hr_onboarding": {
      "frequency_per_month": { "small": 1, "medium": 4, "large": 10 },
      "time_per_unit_minutes": 480,
      "automatable_share": 0.40,
      "error_rate": 0.10
    },
    "reporting": {
      "frequency_per_month": { "small": 4, "medium": 12, "large": 30 },
      "time_per_unit_minutes": 60,
      "automatable_share": 0.80,
      "error_rate": 0.08
    },
    "inventory_management": {
      "frequency_per_month": { "small": 20, "medium": 100, "large": 300 },
      "time_per_unit_minutes": 10,
      "automatable_share": 0.65,
      "error_rate": 0.04
    },
    "customer_service": {
      "frequency_per_month": { "small": 40, "medium": 200, "large": 600 },
      "time_per_unit_minutes": 12,
      "automatable_share": 0.35,
      "error_rate": 0.02
    },
    "approval_workflows": {
      "frequency_per_month": { "small": 20, "medium": 60, "large": 150 },
      "time_per_unit_minutes": 30,
      "automatable_share": 0.75,
      "error_rate": 0.02
    }
  }
}
```

---

## 3. Výpočtový model

### 3.1 Základný vzorec (per proces)

```
ročná_strata_hodín = frekvencia_ročne × čas_na_prípad_h × podiel_manuálny × podiel_automatizovateľný

Kde:
  frekvencia_ročne = frekvencia_mesačne × 12
  čas_na_prípad_h = čas_na_prípad_min / 60
  podiel_manuálny = z odpovede alebo z maturity levelu
  podiel_automatizovateľný = z benchmarku alebo odpovede
```

### 3.2 Odvodzovanie manuálneho podielu z maturity levelu

Proces, ktorý firma sama označila za prevažne ručný (`cx_A05`), dostáva
manuálny podiel **aspoň 0,85**. Je to priama evidencia a prebíja odhad z
celofiremnej maturity. Ide o **dolnú hranicu**, nie o prepis: pri maturity
levele 0 je globálny podiel 0,90 a plochých 0,85 by najmenej zrelým firmám
úsporu znížilo.

Pre ostatné procesy sa podiel odvodzuje z maturity levelu:

| Maturity Level (Kategória A) | Predpokladaný manuálny podiel |
|-------------------------------|-------------------------------|
| 0 — Ad hoc | 0.90 |
| 1 — Čiastočná digitalizácia | 0.65 |
| 2 — Štandardizované | 0.40 |
| 3 — Automatizované | 0.15 |
| 4 — Optimalizované | 0.05 |

### 3.3 Agregovaný dopad

```
celkové_ušetrené_hodiny = Σ ročná_strata_hodín[proces] pre všetky relevantné procesy

ušetrené_MD = celkové_ušetrené_hodiny / 8

ročný_€_dopad = celkové_ušetrené_hodiny × hodinová_cena

// Scenáre
konzervatívny_dopad = ročný_€_dopad × 0.40  // predpoklad: 40% realization rate
reálny_dopad        = ročný_€_dopad × 0.65  // predpoklad: 65% realization rate
optimistický_dopad  = ročný_€_dopad × 0.85  // predpoklad: 85% realization rate
```

**Poznámky k implementácii (v1.1):**
- Headline `ročný_€_dopad` v implementácii **zahŕňa aj úspory z error cost modelu** (§3.5); error zložka je zároveň vykazovaná samostatne v `errorCostReduction`.
- Všetky hodnoty sú **ročný run-rate po plnej implementácii**. Krivka nábehu k tomuto run-rate je modelovaná samostatne (§3.6) — reálny kumulatívny dopad v prvých mesiacoch bude nižší.

### 3.6 Krivky kumulatívnej úspory (ramp-up model)

Namiesto jedného ročného čísla sa vo výsledku zobrazujú **tri krivky** kumulatívnej úspory v čase (`SavingsCurveChart`), analogicky k projekcii výnosu pri investovaní — konzervatívny/reálny/optimistický scenár sa v čase rozchádzajú.

```
mesačná_run_rate[scenár] = ročný_€_dopad[scenár] / 12

// Lineárny nábeh k plnej mesačnej sadzbe počas rampUpMonths[scenár] mesiacov
mesačná_realizácia[scenár, mesiac] = mesačná_run_rate[scenár] × min(mesiac / rampUpMonths[scenár], 1)

kumulatívna_úspora[scenár, mesiac] = Σ mesačná_realizácia[scenár, k] pre k = 1..mesiac
```

| Scenár | rampUpMonths | Interpretácia |
|--------|--------------|----------------|
| Optimistický | 3 | Rýchla, úspešná implementácia dosiahne plný prínos do 3 mesiacov. |
| Reálny | 6 | Typický priebeh — plný prínos do pol roka. |
| Konzervatívny | 9 | Pomalší, opatrný rollout — plný prínos až po 9 mesiacoch. |

Horizont grafu: 24 mesiacov (`savingsProjectionHorizonMonths`). Hodnoty `rampUpMonths` a `savingsProjectionHorizonMonths` sú v `data/scoringConfig.ts` / `config/model/scoringConfig.json`.

**Dôležité:** toto je zjednodušený, ilustratívny predpoklad (lineárny nábeh), nie empiricky kalibrovaná adopčná krivka — účelom je vizuálne odlíšiť rýchlosť realizácie medzi scenármi, nie presne predpovedať mesačný cash-flow. Ročné headline čísla (§3.3) zostávajú primárnym, auditovateľným odhadom; krivka je doplnková vizualizácia.

### 3.4 Risk-adjusted faktor

```
confidence_factor = 0.8 × data_completeness + 0.3 × (1 − data_completeness)

Kde:
  data_completeness = počet_self_reported_vstupov / celkový_počet_vstupov
  0.8 = spoľahlivosť self-reported vstupu
  0.3 = spoľahlivosť benchmark_default vstupu
```

Pozn.: úroveň `benchmark_sector` (0.5) je plánovaná — sektorovo diferencované procesné benchmarky zatiaľ neexistujú (benchmarky sa líšia len podľa veľkosti firmy); do ich doplnenia model používa lineárnu kombináciu self-reported/default vyššie.

### 3.5 Error cost model (doplnkový)

```
ročný_cost_chýb = frekvencia_ročne × chybovosť × cena_opravy_chyby

Kde:
  cena_opravy_chyby = čas_na_opravu × hodinová_cena + priamy_dopad_chyby
  priamy_dopad_chyby: default 0 (konzervativný), alebo self-reported
```

---

## 4. Výstupná štruktúra

### 4.1 Business Impact Summary

```json
{
  "impact_version": "1.0",
  "assessment_id": "uuid",
  "inputs": {
    "employee_count": 45,
    "hourly_cost_eur": 30.8,
    "hourly_cost_source": "SK priemer IT sektora — NACE J (Eurostat 2025) — vždy fixné, nepýta sa",
    "processes_assessed": ["invoicing", "reporting", "approval_workflows"],
    "data_completeness": 0.65
  },
  "time_savings": {
    "hours_per_year": {
      "conservative": 420,
      "mid": 680,
      "optimistic": 920
    },
    "md_per_year": {
      "conservative": 52.5,
      "mid": 85,
      "optimistic": 115
    }
  },
  "financial_impact": {
    "eur_per_year": {
      "conservative": 8400,
      "mid": 13600,
      "optimistic": 18400
    },
    "confidence": 0.52,
    "confidence_label": "Stredná — čiastočne self-reported, čiastočne benchmark"
  },
  "risk_reduction": {
    "current_risk_level": "high",
    "potential_risk_level": "medium",
    "key_mitigations": [
      "Nasadenie MFA zníži riziko neoprávneného prístupu",
      "Testované zálohy znížia riziko dátovej straty"
    ]
  },
  "opportunity_gap": {
    "description": "Firma nevyužíva potenciál automatizácie fakturácie a reportingu",
    "estimated_gap_pct": 45,
    "benchmark_comparison": "Pod priemerom sektora o 15 bodov"
  },
  "disclaimers": [
    "Odhad je založený na kombináciách self-reported dát a sektorových benchmarkov.",
    "Reálny dopad závisí od kvality implementácie a organizačnej pripravenosti.",
    "Hodinová cena práce je benchmark hodnota — skutočná cena sa môže líšiť.",
    "Konzervatívny scenár predpokladá 40% realizáciu identifikovaného potenciálu."
  ],
  "calculation_audit": [
    {
      "process": "invoicing",
      "frequency_yearly": 600,
      "time_per_case_h": 0.25,
      "manual_share": 0.65,
      "automatable_share": 0.70,
      "saved_hours": 68.25,
      "data_source": "mix (frequency: self-reported, time: benchmark)"
    }
  ]
}
```

### 4.2 Zobrazenie vo výsledku

Dashboard zobrazí:

1. **Hlavné čísla:**
   - Ušetrené hodiny ročne (interval)
   - Ušetrené MD ročne (interval)
   - Ročný € dopad (interval)
   - Confidence level (vizuálny indikátor)

2. **Detail per proces:**
   - Tabuľka s rozpadom na procesy
   - Zdroj dát pre každý riadok (self-reported / benchmark)

3. **Risk reduction:**
   - Aktuálny vs. potenciálny risk level
   - Top 3 mitigácie

4. **Opportunity gap:**
   - Kde firma stráca najviac vs. benchmark

---

## 5. Realization Rate predpoklady

### 5.1 Prečo tri scenáre

Digitalizačné projekty typicky dosiahnu 30–80 % identifikovaného potenciálu. Závisí od:
- kvality implementácie,
- change managementu,
- organizačnej pripravenosti,
- externých faktorov.

### 5.2 Scenáre

| Scenár | Realization Rate | Kedy použiť |
|--------|-----------------|-------------|
| Konzervatívny | 40 % | Default pre zobrazenie. Bezpečný odhad. |
| Reálny | 65 % | Hlavný odhad pre firmy s dobrou governance (F ≥ 50). |
| Optimistický | 85 % | Len pre firmy s vysokou execution capability (F ≥ 75). |

### 5.3 Governance adjustment

Engine vracia `displayPolicy` a UI ju rešpektuje — do 5. 8. 2026 sa
k optimistickému scenáru len pridával disclaimer, ktorý číslo nijako nekrotil.

```
F >= 75 (gate 'high')         → všetky tri scenáre, headline = reálny
F >= 50 (gate 'standard')     → všetky tri scenáre, headline = reálny
F <  50 (gate 'restricted')   → optimistický sa NEZOBRAZÍ, headline = konzervatívny
F == null (gate 'unmeasured') → optimistický sa NEZOBRAZÍ, headline = konzervatívny
veľkosť firmy neuvedená       → vynúti 'restricted' bez ohľadu na F
```

Nemeraná governance sa zámerne netvári ani ako nízka, ani ako vysoká —
nezmerané nie je zistenie. Prahy sú v `governanceScenarioGates`.

---

## 6. Obmedzenia modelu

### 6.1 Čo model nezachytáva

- Jednorazové investičné náklady na digitalizáciu.
- Presná (empiricky kalibrovaná) adopčná krivka — §3.6 obsahuje len zjednodušený lineárny nábeh pre vizualizáciu, nie skutočný projektový harmonogram.
- Príjmové benefity (vyšší obrat vďaka digitalizácii).
- Kvalitatívne benefity (spokojnosť zamestnancov, zákaznícka skúsenosť).

### 6.2 Prečo to pre MVP stačí

- Model meria **potenciál úspor**, nie ROI v zmysle návratnosti investície.
- Pre presné ROI by bola potrebná kalkulácia implementačných nákladov, čo vyžaduje detailný scoping mimo rozsah self-assessment nástroja.
- Pre obchodné účely (discovery workshop, lead qualification) je informácia o potenciáli úspor dostatočná.

### 6.3 Budúce rozšírenia

*(Odhady implementačných nákladov a payback boli z tohto zoznamu odstránené
7. 8. 2026 — sľubovali presne to, čo sekcia „Rozhodnuté: náklady a payback"
nižšie odmieta.)*

- Revenue impact model pre e-commerce a sales digitalizáciu.
- TCO porovnanie (current state vs. target state).
- Zapojenie zbieraných vstupov cx_ROI02 (admin headcount) a cx_ROI03 (objem fakturácie) do per-procesných prepočtov (dnes sa zbierajú, ale nevyužívajú — viď checklist).

---

## 7. Zdroje a aktualizácia mzdových kotiev

| Vstup | Hodnota | Zdroj | Rok |
|-------|---------|-------|-----|
| **Hodinová cena práce podľa odvetvia — použité v ROI modeli** | **13,0–30,8 €/h** (tabuľka v §7.1) | Eurostat `lc_lci_lev` (SK, NACE sekcie, publ. 4/2026) | 2025 |
| — záloha pri neuvedenom odvetví (NACE J) | 30,8 €/h | Eurostat `lc_lci_lev` | 2025 |
| — z toho mzdy a platy (D11) | 22,4 €/h | Eurostat `lc_lci_lev` | 2025 |
| — nemzdové náklady (odvody, benefity, školenia) | 8,4 €/h (27,3 %) | Eurostat `lc_lci_lev` | 2025 |
| Priemerná hrubá mesačná mzda NACE J (celé odvetvie) | 2 664 €/mes. (Q1 2026) | ŠÚ SR DATAcube, tabuľka pr0205qs | 2026 |
| Kontrolný súčet — Trexima ISCP, priemer 4 IT profesií (vývojári, analytici, programátori, web dev) | ~2 933 €/mes. hrubého | TREXIMA Bratislava — Informačný systém o cene práce (ISCP), Q3 2025 | 2025 |
| Priemerná hodinová cena práce SR — celé hospodárstvo (kontext, nepoužíva sa priamo) | 19,8 €/h | Eurostat `lc_lci_lev` | 2025 |
| — priemer EÚ (kontext) | 34,9 €/h | Eurostat `lc_lci_lev` | 2025 |
| Odvodový multiplikátor zamestnávateľa (kontext, nepoužíva sa — Eurostat cena práce ho už zahŕňa) | 1,362 (36,2 %) | zákony č. 461/2003 a 580/2004 Z. z. | 2025–2026 |

### 7.1 Sadzba podľa odvetvia (od 7. 8. 2026)

Do 7. 8. 2026 sa **na všetky odvetvia** používala jedna sadzba 30,8 €/h
odvodená z NACE J. Zdôvodnenie znelo, že automatizované procesy zastrešuje
IT tím, takže je relevantná cena IT kapacity. **To zdôvodnenie neobstálo.**
Ušetrený čas nevzniká v IT — vzniká tam, kde sa proces vykonáva: faktúru
prepisuje účtovníčka, dovolenku schvaľuje majiteľ, dodací list vypisuje
skladník. Oceňovať ich čas sadzbou vývojára znamená nadhodnotiť úsporu.

Rozsah tej chyby nie je kozmetický. Model odteraz používa sadzbu odvetvia,
ktoré respondent uviedol:

| Odvetvie v kvíze | NACE | Sadzba | Zmena odhadu úspory |
|---|---|---|---|
| Ubytovanie / Gastro | I | 13,0 €/h | **−58 %** |
| Doprava / Logistika | H | 17,2 €/h | −44 % |
| Stavebníctvo | F | 17,8 €/h | −42 % |
| Veľkoobchod / Maloobchod | G | 17,9 €/h | −42 % |
| Výroba / Priemysel | C | 19,3 €/h | −37 % |
| Iné | B-S_X_O | 19,8 €/h | −36 % |
| Profesionálne služby | M | 24,4 €/h | −21 % |
| IT / Telekomunikácie | J | 30,8 €/h | 0 % |

Všetky hodnoty: Eurostat `lc_lci_lev`, vintage 2026-04-23, rok 2025, geo SK,
`lcstruct = D1_D4_MD5` (celková cena práce vrátane odvodov zamestnávateľa).
Percentá sú zmerané na modelovej firme (malá, zrelosť 1, dva ručné procesy).

**Ušetrené hodiny sa sadzbou nemenia** — mení sa len ich ocenenie. Rozklad
v audit traile uvádza sadzbu, s ktorou sa naozaj rátalo.

**Neuvedené odvetvie** spadne na pôvodných 30,8 €/h a karta to hovorí:
pre väčšinu odvetví je to nadhodnotenie. Nedosádza sa ticho medián.

**Obmedzenie:** `lc_lci_lev` pokrýva podniky **od 10 zamestnancov**, rovnako
ako DII distribúcie. Pre mikrofirmu je to teda odhad z populácie, v ktorej
nie je zastúpená.

**„Iné" dostáva najširší podnikateľský agregát** (B-S bez verejnej správy),
nie priemer ôsmich vybraných odvetví — ten by bol vážený tým, ktoré odvetvia
sa náhodou dostali do kvízu, nie ich zastúpením v ekonomike.

**Politika aktualizácie:** ročne po aprílovej publikácii Eurostat `lc_lci_lev` — obnoviť treba **celú tabuľku §7.1**, nie len jednu hodnotu (`npm run data:freshness` na to upozorní). Eurostat hodinová cena práce už zahŕňa odvody zamestnávateľa — nepoužívať dvojité násobenie multiplikátorom.

---

## 8. Zapojenie zbieraných vstupov (5. 8. 2026)

Do tohto dátumu sa `cx_ROI02` a `cx_ROI03` zbierali, ale výpočet ich nikdy
nečítal — celý modul ROI otázok zaťažoval respondenta bez akéhokoľvek vplyvu
na výsledok a dve firmy s desaťnásobne odlišným objemom faktúr dostali
identické číslo.

### 8.1 Objem fakturácie (`cx_ROI03`) → frekvencia procesu

Self-reported objem **prebíja** benchmarkovú frekvenciu procesu `invoicing`.
Stredy pásiem (`invoicingVolumeFromBand`):

| Odpoveď | Pásmo | Použitá frekvencia (mes.) |
|---|---|---|
| `low` | do 50 | 25 |
| `medium` | 50–200 | 125 |
| `high` | 200–500 | 350 |
| `very_high` | nad 500 | 700 |

Horné pásmo je otvorené, takže 700 je **konzervatívna kotva, nie extrapolácia**.
Otázka sa pýta na faktúry vydané aj prijaté a benchmark modeluje čas na jednu
**spracovanú** faktúru, takže sa čísla používajú priamo, bez delenia.

### 8.2 Počet administratívcov (`cx_ROI02`) → strop kapacity

Headcount **nie je objem**, je to kapacita — preto sa z neho nerobí frekvencia,
ale strop. Benchmarkové objemy procesov nemôžu spotrebovať viac hodín, než
koľko ich administratíva vôbec má:

```
adminCapacityHours = FTE × workingHoursPerFteYear (1700) × adminAgendaShareOfFte (0,60)
grossManualHours   = Σ (freqYearly × timePerCaseH × manualShare)   // PRED automatableShare
capFactor = adminCapacityHours < grossManualHours ? adminCapacityHours / grossManualHours : 1
```

Strop **len znižuje, nikdy nezvyšuje**: benchmarková frekvencia je dôkaz o
objeme, headcount len horná hranica. `grossManualHours` sa počíta pred
`automatableShare`, inak by sa kapacita porovnávala s už zúženou podmnožinou
hodín. Pri zásahu stropu pribudne disclaimer.

| Odpoveď | Predpokladané FTE |
|---|---|
| `1_3` | 2 |
| `4_10` | 7 |
| `11_30` | 20 |
| `30_plus` | 40 |

`workingHoursPerFteYear` (1700 = 52 × 40 h mínus dovolenka, sviatky, PN) a
`adminAgendaShareOfFte` (0,60) sú **nezdrojované parametre modelu**. Druhý je
citlivejší: pri 0,4 by sa strop spúšťal takmer vždy, pri 0,8 takmer nikdy.

### 8.3 Chýbajúca veľkosť firmy

Veľkosť sa už ticho nedosádza na `small`. Keď chýba, model počíta ďalej, ale
priznane: disclaimer navrch zoznamu, prefix `predpokladaná veľkosť firmy` v
každom riadku audit trailu, `confidence` zastropovaná na 0,3 a vynútený
`restricted` režim scenárov. Rovnako sa už nedosádzajú pásma `cx_ROI02`/`cx_ROI03`
— „Neviem" nie je odpoveď.

### 8.4 Mapovanie procesov na benchmarky

Tri hodnoty `cx_A05` sa volajú inak než ich benchmark, takže sa predtým
odfiltrovali — respondent ich označil za ručné a z ROI ticho vypadli, nahradené
tromi defaultmi. Väzbu teraz nesie `processKeyFromAnswerValue`:

| Hodnota odpovede | Benchmark |
|---|---|
| `warehouse` | `inventory_management` |
| `service` | `field_service` |
| `purchasing` | `purchasing` |

Frekvencie, časy, automatizovateľnosť a chybovosť týchto troch sú z §2.2;
hodnoty pre mikrofirmy a `reworkMinutesPerError`/`exceptionRate` sú expertný
odhad odvodený pomerom, ktorý držia ostatné záznamy (micro ≈ 0,4 × small).


### Nezistená zrelosť procesov

`maturityLevel` je `number | null`. `null` znamená, že sa zrelosť nezistila —
otázka `ind_03`/`cx_A01` bola preskočená, zodpovedaná „Neviem", alebo mala
hodnotu **mimo domény 0–4**.

Posledný prípad je dôvod, prečo validácia vznikla: `parseInt` sám prijme aj
`9` alebo `−3` a taká hodnota neskončila chybou, ale tichým nezmyslom —
firma na „úrovni 9" spadla na fallback 0,65 (teda úroveň 1), dostala rizikovosť
„nízke" a medzeru 0 %.

Pri `null` sa počíta s `assumedMaturityLevel = 2` (stredná úroveň: najnižšia
by úsporu nafúkla na 90 % ručnej práce, najvyššia by ju zmazala na 5 %) a
predpoklad sa **prizná** — disclaimerom, príznakom `inputAssumptions.maturityAssumed`
a zastropovanou dôveryhodnosťou na 0,3, rovnako ako pri neuvedenej veľkosti firmy.

**Vplyv veľkostných kotiev (od 7. 8. 2026).** Úroveň zrelosti vychádza
z penalizovaného ORS, ktoré je pri mikro- a malých firmách prepočítané
(`SCORING_SPEC.md` §13). Mikrofirma so stálym externým dodávateľom tak vyjde
o niečo zrelšia a jej odhadovaná úspora je nižšia než pred touto zmenou. Nie je
to vedľajší účinok: úspora je medzera voči **dosiahnuteľnému** stavu, nie voči
stavu firmy s vlastným IT oddelením.


### Dve brány scenárov: pripravenosť a zámer

Zobrazenie optimistického scenára gatuje **prísnejšia z dvoch nezávislých
brán**:

| Brána | Zdroj | Čo meria |
|---|---|---|
| governance | ORS kategória F | či firma zmenu vie zorganizovať |
| zámer investovať | `ind_16_intent` / `cx_F07_intent` (0–10) | či to vôbec chce |

Do 6. 8. 2026 existovala len prvá a slúžila ako zástupný ukazovateľ oboch. To
bola tichá chyba: **governance je kapacita, nie vôľa.** Firma s výbornou
organizáciou a nulovou chuťou investovať nezrealizuje nič — a dostávala
optimistický scenár.

Prahy zámeru (`investmentIntentGates`): 8+ z 10 je jasné „áno", 5+ otvorenosť
bez záväzku, pod 5 už respondent hovorí skôr „nie".

**Prečo minimum, nie priemer.** Silná stránka by kryla slabú, hoci úsporu
obmedzuje práve tá slabá. Odhodlaná firma bez organizačnej pripravenosti
nedosiahne plný potenciál rovnako ako pripravená firma bez chuti.

**Nezistený zámer bránu neposúva ani jedným smerom** — nevedomosť nie je dôkaz
o nechuti, rovnaká politika ako pri rizikách. Nezmeraná governance je naopak
prísnejšia než akýkoľvek zámer: bez nej sa pripravenosť nedá doložiť vôbec.

Text dôvodu ukazuje na tú bránu, ktorá scenár skutočne obmedzila — inak by
firma dostala radu opravovať niečo, čo má v poriadku.


## Prvý rok nie je ustálený run-rate

`financialImpact.eurPerYear` je **ustálený ročný run-rate** — koľko firma
ušetrí, keď už zmena beží naplno. Nábeh trvá 3–9 mesiacov podľa scenára
(`rampUpMonthsByScenario`), takže prvých 12 mesiacov je nižších:

| Scenár | Nábeh | Podiel prvého roka |
|---|---|---|
| konzervatívny | 9 mesiacov | 66,7 % |
| realistický | 6 mesiacov | 79,2 % |
| optimistický | 3 mesiace | 91,7 % |

Vzorec: pri nábehu **R** mesiacov je kumulatív za 12 mesiacov
`12 − (R−1)/2` mesačných run-rate.

**Prečo to bola chyba.** Karta hlásila run-rate ako „€/rok", kým graf pod ňou
ukazoval v 12. mesiaci o 8–33 % menej. Dve rôzne čísla pre tú istú vec na
jednej obrazovke — a to väčšie bolo tučným písmom. Od 6. 8. 2026 nesie
`financialImpact.firstYearEur` sumu za prvých 12 mesiacov a berie ju **presne
z bodu grafu**, nie z vlastného výpočtu, takže sa nemôžu rozísť. Stráži to test.

Popisky sú rozlíšené: „Ročný dopad (po nábehu)" a „Z toho prvých 12 mesiacov".

## Odstup od plnej digitalizácie nie je benchmark

`opportunityGap.gapPercentage` je `(1 − zrelosť/4) × 100` — vzdialenosť od
najvyššej úrovne procesnej zrelosti. **Žiadny benchmark doň nevstupuje.**

Text dovtedy hovoril „Výrazný priestor na zlepšenie **oproti priemeru**", čo
tvrdí porovnanie s inými firmami, ktoré sa nikdy nepočítalo. Formulácia teraz
hovorí, čo číslo naozaj meria — odstup od plne digitalizovaného stavu — a
priznáva, z čoho vzniká (`Podľa zrelosti procesov (N/4)…`). Test stráží, aby
sa slovo „priemer" do tých textov nevrátilo.

## Rozhodnuté 7. 8. 2026: náklady a payback sa robiť nebudú

Payback = investícia / ročná úspora. **Úsporu model počíta, investíciu nie.**
Priradiť eurové pásmo by znamenalo oceniť **32 položiek** (18 statických
odporúčaní v `engines/recommendationEngine.ts` + 14 šablón viazaných na
rizikové faktory v `data/riskRecommendations.ts`) bez jediného dátového bodu.
Väčšina z nich je navyše prevažne prácnosť („zdokumentujte DR plán",
„zaveďte MFA"), ktorá sa medzi firmami líši rádovo.

**Rozhodujúci dôvod nie je chýbajúce číslo, ale chýbajúca väzba.** `roiEngine`
nikdy nevidí výstup `recommendationEngine` — úspora sa počíta z ručných
procesov, zrelosti, veľkosti firmy a objemu fakturácie, nie zo zoznamu
odporúčaní. Veta typu „ak tieto zmeny stoja menej než X, vrátia sa" by preto
nevymyslela číslo, ale **vzťah**, ktorý model nepočíta. Vymyslený vzťah sa
nedá ani poctivo označiť ako expertný odhad, lebo nie je odhadom ničoho, čo by
nástroj meral.

Zamietnuté boli aj dve navrhované náhrady vzorca:

- **Prah „ak investícia < ročná úspora, vráti sa do roka"** je nesprávny
  vstup. `eurPerYear` je ustálený run-rate **po nábehu**, kým konzervatívny
  ramp-up trvá 9 mesiacov — prah by nadhodnocoval smerom, ktorý nabáda minúť
  viac.
- **Prah počítaný na 12 mesiacov** by bol bit za bit už existujúce
  `firstYearEur`, ktoré karta zobrazuje. Nulová nová informácia, nenulová
  trvalá cena v type aj v UI.

Čo sa namiesto toho urobilo: karta Business Impact hovorí priamo, že zobrazené
číslo je **potenciál automatizácie ručných procesov, nie cena zoznamu
odporúčaní**, a že opakované poplatky (licencie, zálohovanie, e-fakturácia) sa
porovnávajú s ročnou úsporou, nie s dvojročným kumulatívom.

**Predpokladom akéhokoľvek zvýšenia rozhodovacej váhy eurového čísla** je
sektorová diferenciácia hodinovej sadzby — dnes sa na všetky sektory používa
jednotných 30,8 €/h (NACE J), čo je pri gastre či stavebníctve možné
dvojnásobné nadhodnotenie. Vedené v `IMPROVEMENT_CHECKLIST.md`.
