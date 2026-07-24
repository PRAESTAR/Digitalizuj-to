# digitalizuj.to — ROI & Business Impact Model

> Verzia: 1.1-MVP  
> Dátum: 2026-07-23 (revízia; pôvodná verzia 2026-04-08)  
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
| `employee_count` | Otázka | Povinná — bez nej žiadny ROI výpočet |
| `hourly_cost` | **Vždy fixný — priemer SR** | Nepýtame sa (citlivý údaj); pozri 2.2 |
| `process_frequency` | Per-proces otázka | Benchmark podľa veľkosti a sektora |
| `process_time_per_unit` | Per-proces otázka | Benchmark |
| `manual_share` | Per-proces otázka | Odvodzuje sa z maturity levelu |
| `automatable_share` | Odvodená | Benchmark podľa procesu |
| `error_rate` | Otázka | Benchmark |
| `approval_delays` | Otázka | Benchmark |

### 2.2 Benchmark fallback hodnoty

> **Zmena (verzia 1.1):** Otázka na hodinovú cenu práce (`ind_15` / `cx_ROI01`) bola z dotazníka **odstránená** — je to citlivý údaj a väčšina respondentov ho odhaduje nepresne. ROI model teraz vždy počíta s priemernou hodinovou cenou práce na Slovensku (viď nižšie), nie so self-reported hodnotou. Toto zjednodušenie znižuje presnosť pre firmy s výrazne podpriemernými/nadpriemernými mzdami, ale zvyšuje completion rate a odstraňuje nekonzistenciu medzi definíciami "hrubá" vs. "plná" cena práce, ktorá predtým existovala medzi oboma kvízmi.

```json
{
  "hourly_cost_eur": {
    "default": 19.8,
    "note": "Plná hodinová cena práce vrátane odvodov — vždy priemer SR, nepýta sa ako otázka. Zdroj: Eurostat lc_lci_lev 2025, celé hospodárstvo, podniky 10+ (19,8 €/h; admin/podporné služby NACE N: 15,2 €/h). Odvodový multiplikátor zamestnávateľa od 1. 1. 2025: 1,362. Revízia: ročne (marcová publikácia Eurostatu)."
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

Ak firma neodpovie priamo:

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
stredný_dopad = ročný_€_dopad × 0.65       // predpoklad: 65% realization rate
optimistický_dopad = ročný_€_dopad × 0.85  // predpoklad: 85% realization rate
```

**Poznámky k implementácii (v1.1):**
- Headline `ročný_€_dopad` v implementácii **zahŕňa aj úspory z error cost modelu** (§3.5); error zložka je zároveň vykazovaná samostatne v `errorCostReduction`.
- Všetky hodnoty sú **ročný run-rate po plnej implementácii** — model nezahŕňa adopčnú krivku (typicky 6–12 mesiacov), reálny dopad v 1. roku bude nižší.

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
    "hourly_cost_eur": 19.8,
    "hourly_cost_source": "SK priemer (Eurostat 2025) — vždy fixné, nepýta sa",
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
| Stredný | 65 % | Hlavný odhad pre firmy s dobrou governance (F ≥ 50). |
| Optimistický | 85 % | Len pre firmy s vysokou execution capability (F ≥ 75). |

### 5.3 Governance adjustment

```
Ak category_score[F] >= 75:
  zobraz všetky tri scenáre, highlight stredný
Ak category_score[F] >= 50:
  zobraz všetky tri scenáre, highlight konzervatívny
Ak category_score[F] < 50:
  zobraz len konzervatívny s disclaimerom:
  "Nízka organizačná pripravenosť znižuje pravdepodobnosť realizácie plného potenciálu."
```

---

## 6. Obmedzenia modelu

### 6.1 Čo model nezachytáva

- Jednorazové investičné náklady na digitalizáciu.
- Časová os realizácie a adopčná krivka (kedy sa benefity prejavia — výstup je run-rate po plnej implementácii).
- Príjmové benefity (vyšší obrat vďaka digitalizácii).
- Kvalitatívne benefity (spokojnosť zamestnancov, zákaznícka skúsenosť).

### 6.2 Prečo to pre MVP stačí

- Model meria **potenciál úspor**, nie ROI v zmysle návratnosti investície.
- Pre presné ROI by bola potrebná kalkulácia implementačných nákladov, čo vyžaduje detailný scoping mimo rozsah self-assessment nástroja.
- Pre obchodné účely (discovery workshop, lead qualification) je informácia o potenciáli úspor dostatočná.

### 6.3 Budúce rozšírenia

- Pridanie odhadov implementačných nákladov (per odporúčanie).
- Simple payback period kalkulácia.
- Revenue impact model pre e-commerce a sales digitalizáciu.
- TCO porovnanie (current state vs. target state).
- Zapojenie zbieraných vstupov cx_ROI02 (admin headcount) a cx_ROI03 (objem fakturácie) do per-procesných prepočtov (dnes sa zbierajú, ale nevyužívajú — viď checklist).

---

## 7. Zdroje a aktualizácia mzdových kotiev

| Vstup | Hodnota | Zdroj | Rok |
|-------|---------|-------|-----|
| Priemerná hodinová cena práce SR (celé hospodárstvo) | 19,8 €/h | Eurostat `lc_lci_lev` (publ. 3/2026) | 2025 |
| — admin a podporné služby (NACE N) | 15,2 €/h | Eurostat `lc_lci_lev` | 2025 |
| — priemer EÚ (kontext) | 34,9 €/h | Eurostat `lc_lci_lev` | 2025 |
| Priemerná hrubá mesačná mzda SR | 1 620 € | ŠÚ SR (publ. 3/2026) | 2025 |
| Odvodový multiplikátor zamestnávateľa | 1,362 (36,2 %) | zákony č. 461/2003 a 580/2004 Z. z. (zdravotné 11 % od 1. 1. 2025) | 2025–2026 |
| Minimálna mzda SR | 915 €/mes (5,259 €/h) | MPSVR SR | 2026 |

**Politika aktualizácie:** ročne po marcovej publikácii Eurostat lc_lci_lev a ŠÚ SR ročných miezd. Eurostat hodinová cena práce už zahŕňa odvody zamestnávateľa — nepoužívať dvojité násobenie multiplikátorom.
