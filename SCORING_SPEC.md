# digitalizuj.to — Scoring Specification

> Verzia: 1.0-MVP (spec) / implementácia beží na scoringConfig **1.2-MVP**  
> Dátum: 2026-04-08 (spec) / 2026-07-23 (poznámka k implementácii)

> **Poznámka k verzii 1.2-MVP (2026-07-23):** oproti tejto špecifikácii implementácia obsahuje tieto potvrdené zmeny správania:
> 1. Bezpečnostná penalizácia (§3.5) sa aplikuje **len ak je kategória E meraná** (aspoň 1 zodpovedaná otázka) — nemeraná kategória sa nepenalizuje.
> 2. TDRI čiastočné penalty (§4) ignorujú „Neviem"/preskočené odpovede a otázky bez bodovateľných možností — neznalosť sa neinterpretuje ako potvrdené riziko.
> 3. `diiMethodologyVersion` je ukotvená na **DII v3, prieskum 2025** (Eurostat isoc_e_dii).
>
> Známe odchýlky spec ↔ kód (per-indikátorová DII agregácia, binárne prahy 33/50, N/A reprezentácia kategórií, konfidenčné pásma indikatívneho kvízu) sú evidované v IMPROVEMENT_CHECKLIST.md a budú riešené v plnej revízii spec 2.0.

---

## 1. Prehľad výstupov

Systém produkuje **4 nezávislé výstupy**:

| # | Výstup | Rozsah | Smer | Účel |
|---|--------|--------|------|------|
| 1 | DII-Compatible Score | 0–100 (+ prepočet 0–12) | vyššie = lepšie | EU benchmark |
| 2 | Operational Readiness Score | 0–100 | vyššie = lepšie | Reálna zrelosť |
| 3 | Technical Debt & Risk Index | 0–100 | vyššie = horšie | Rizikový profil |
| 4 | Business Impact Potential | hodiny/MD/€ | odhad dopadu | ROI odhad |

---

## 2. DII-Compatible Score

### 2.1 Vstup

12 DII indikátorov, každý mapovaný na 1+ otázku.

### 2.2 Mapovanie indikátorov

Každý DII indikátor má:
- `indicator_id`: DII1–DII12
- `questions`: zoznam otázok, ktoré ho merajú
- `binary_threshold`: prah pre binárny DII prepočet (áno/nie)
- `granular_score`: funkcia, ktorá produkuje 0–100

### 2.3 Výpočet

```
Pre každý indikátor i (1..12):
  indicator_score[i] = f(odpovede na mapované otázky)  // 0-100

dii_score_100 = (1/12) × Σ indicator_score[i]   // rovná váha pre DII kompatibilitu

dii_score_12 = round(dii_score_100 / 100 × 12)
```

**Binárny DII prepočet:**
```
Pre každý indikátor i:
  dii_binary[i] = 1 ak indicator_score[i] >= binary_threshold[i], inak 0

dii_pure = Σ dii_binary[i]   // 0-12, presne ako Eurostat
```

### 2.4 DII Indikátor scoring funkcie

| Indikátor | Logika skórovania (0–100) | Binary threshold |
|-----------|---------------------------|-----------------|
| DII1: Internet ≥30 Mbps | 0=žiadny, 25=<30Mbps, 50=30-100Mbps, 75=100-500Mbps, 100=500Mbps+ | 50 |
| DII2: ICT špecialisti | 0=nikto, 33=externý ad hoc, 66=externý stály, 100=interný | 33 |
| DII3: Remote access | 0=nemožný, 50=čiastočný, 100=plný | 50 |
| DII4: Digitálne zručnosti | 0=žiadne, 33=základné, 66=stredné, 100=pokročilé | 33 |
| DII5: Webstránka s funkciami | 0=nemá, 25=vizitka, 50=kontaktný formulár, 75=e-shop/objednávky, 100=plne interaktívna | 50 |
| DII6: Sociálne siete | 0=žiadne, 50=prítomnosť, 100=aktívne využívanie | 50 |
| DII7: Cloud služby | 0=žiadne, 25=basic SaaS, 50=stredná sofistikácia, 75=PaaS/IaaS, 100=cloud-native | 50 |
| DII8: E-faktúry | 0=nie, 50=čiastočne, 100=plne | 50 |
| DII9: E-commerce existuje | 0=nie, 100=áno | 50 |
| DII10: E-commerce > 1% obratu | 0=nie, 50=<1%, 100=≥1% | 50 |
| DII11: AI technológie | 0=nie, 33=experimentálne, 66=v produkcii, 100=strategické | 33 |
| DII12: Big data analýzy | 0=nie, 33=basic, 66=pokročilé, 100=real-time | 33 |

### 2.5 Explainability

Výstup DII skóre obsahuje:
```json
{
  "dii_score_100": 58.3,
  "dii_score_12": 7,
  "dii_pure_binary": 8,
  "dii_level": "Vysoká digitálna intenzita",
  "indicators": [
    {
      "id": "DII1",
      "name": "Internet ≥30 Mbps",
      "score": 75,
      "binary": true,
      "source_answers": ["q_internet_speed: 100-500 Mbps"]
    }
  ]
}
```

---

## 3. Operational Readiness Score (ORS)

### 3.1 Vstup

Odpovede na otázky mapované na kategórie A–F.

### 3.2 Kategóriové skóre

Pre každú kategóriu:
```
category_score[c] = vážený priemer odpovedí v kategórii

Kde:
  answer_score = normalizované skóre odpovede (0-100)
  answer_weight = váha otázky v rámci kategórie
  
category_score[c] = Σ(answer_score[q] × answer_weight[q]) / Σ answer_weight[q]
```

### 3.3 Celkové ORS

```
ORS = Σ(category_score[c] × category_weight[c])

Default váhy:
  A (Procesy):                20%  →  0.20
  B (Systémy/Integrácie):    20%  →  0.20
  C (Dáta/Reporting):        15%  →  0.15
  D (Infraštruktúra/Cloud):  15%  →  0.15
  E (Bezpečnosť/TechDebt):  20%  →  0.20
  F (Governance/Ľudia):      10%  →  0.10
                              ─────
                              100%    1.00
```

### 3.4 Maturity Level mapovanie

| ORS | Level | Label SK | Label EN |
|-----|-------|----------|----------|
| 0–20 | 0 | Digitálny nováčik | Digital Novice |
| 21–40 | 1 | Začiatočník | Beginner |
| 41–60 | 2 | Rozvíjajúci sa | Developing |
| 61–80 | 3 | Pokročilý | Advanced |
| 81–100 | 4 | Digitálny líder | Digital Leader |

### 3.5 Penalizácia z kategórie E

Ak `category_score[E] < 30` (kritický bezpečnostný stav):
```
ORS_penalized = ORS × (0.7 + 0.3 × category_score[E] / 30)
```

**Prečo?** Firma s výborným CRM a procesmi, ale kritickými bezpečnostnými dierami, by nemala dostať vysoké celkové skóre. Penalizácia je max -30 % pri nulovom security skóre.

### 3.6 Explainability

```json
{
  "ors_score": 54.2,
  "ors_penalized": 54.2,
  "maturity_level": 2,
  "maturity_label": "Rozvíjajúci sa",
  "categories": {
    "A": { "score": 45, "weight": 0.20, "contribution": 9.0 },
    "B": { "score": 60, "weight": 0.20, "contribution": 12.0 },
    "C": { "score": 35, "weight": 0.15, "contribution": 5.25 },
    "D": { "score": 70, "weight": 0.15, "contribution": 10.5 },
    "E": { "score": 55, "weight": 0.20, "contribution": 11.0 },
    "F": { "score": 65, "weight": 0.10, "contribution": 6.5 }
  },
  "penalty_applied": false,
  "penalty_reason": null
}
```

---

## 4. Technical Debt & Risk Index (TDRI)

### 4.1 Princíp

TDRI je **samostatný penalizačný index** (0–100, vyššie = horšie). Nesmie byť rozpustený v ORS.

**Účel:** Zvýrazniť kritické problémy aj pri slušnom celkovom skóre. Firma s ORS 65 ale TDRI 85 má vážne rizikové problémy.

### 4.2 Risk faktory

| ID | Risk faktor | Max penalizácia | Severity |
|----|------------|-----------------|----------|
| RF01 | Out-of-support core OS/DB | 15 | Critical |
| RF02 | Chýbajúce zálohy core dát | 15 | Critical |
| RF03 | Zálohy existujú, ale netestované | 8 | High |
| RF04 | Chýbajúci patch management | 10 | Critical |
| RF05 | Absencia MFA na kritických systémoch | 10 | Critical |
| RF06 | Single point of failure (infraštruktúra) | 8 | High |
| RF07 | Single point of failure (ľudia — 1 človek = všetko) | 8 | High |
| RF08 | Nezdokumentované/neowned systémy | 5 | Medium |
| RF09 | Žiadny BC/DR plán | 7 | High |
| RF10 | Žiadny asset inventory | 4 | Medium |
| RF11 | Žiadne logovanie/monitoring | 5 | Medium |
| RF12 | Out-of-support aplikácie (nie core) | 5 | Medium |
|  | **Maximálny súčet** | **100** | |

### 4.3 Výpočet

```
TDRI = Σ penalty[rf] pre všetky applicable risk faktory

Kde:
  penalty[rf] = max_penalty[rf] × severity_multiplier × applicability

  severity_multiplier:
    - Critical: 1.0 (plná penalizácia)
    - High: 0.8 (80 % z max)
    - Medium: 0.6 (60 % z max)

  applicability:
    - 1.0 ak risk faktor plne prítomný
    - 0.5 ak čiastočne prítomný
    - 0.0 ak mitigovaný
```

### 4.4 Risk level mapovanie

| TDRI | Level | Label | Farba |
|------|-------|-------|-------|
| 0–15 | Nízke riziko | Dobre riadené | Zelená |
| 16–35 | Stredné riziko | Vyžaduje pozornosť | Žltá |
| 36–60 | Vysoké riziko | Vyžaduje okamžitú akciu | Oranžová |
| 61–100 | Kritické riziko | Ohrozenie prevádzky | Červená |

### 4.5 Explainability

```json
{
  "tdri_score": 43,
  "risk_level": "Vysoké riziko",
  "risk_label": "Vyžaduje okamžitú akciu",
  "factors": [
    {
      "id": "RF01",
      "name": "Out-of-support core OS/DB",
      "severity": "Critical",
      "penalty": 15,
      "evidence": "Windows Server 2012 R2 — end of support October 2023",
      "source_answer": "q_server_os_version"
    },
    {
      "id": "RF05",
      "name": "Absencia MFA",
      "severity": "Critical",
      "penalty": 10,
      "evidence": "MFA nie je nasadené na žiadnom systéme",
      "source_answer": "q_mfa_status"
    }
  ],
  "top_risks": ["RF01", "RF05", "RF02"]
}
```

---

## 5. Scoring otázok

### 5.1 Normalizácia odpovedí

Každá otázka produkuje `raw_score` podľa typu:

| Typ otázky | Normalizácia |
|------------|-------------|
| Single choice (maturity scale) | Priame mapovanie: level 0=0, 1=25, 2=50, 3=75, 4=100 |
| Single choice (iné) | Každá opcia má definovaný `score_value` (0–100) |
| Multi select | Σ score_value vybraných / max_possible × 100 |
| Yes/No | Áno = definovaný score, Nie = 0 (alebo naopak) |
| Numeric | Mapovanie cez definované pásma |
| Confidence/"Neviem" | Odpoveď "neviem" = score sa neráta, zníži sa weight |

### 5.2 Váha otázky

Každá otázka má:
- `weight`: relatívna dôležitosť v rámci kategórie (default: 1.0)
- `maps_to_score`: na ktoré skóre prispieva (DII, ORS kategórie)
- `maps_to_risk`: na ktoré risk faktory prispieva (TDRI)
- `maps_to_roi_model`: na ktoré ROI premenné prispieva

### 5.3 Handling "Neviem"

- Odpoveď "neviem" = otázka sa vylúči z výpočtu.
- Ak > 50 % otázok v kategórii = "neviem", kategóriové skóre sa označí ako "nízka spoľahlivosť".
- Celkové skóre sa stále vypočíta, ale s disclaimerom.

### 5.4 Handling preskočených otázok (branching)

- Preskočené otázky sa neznižujú a nezvyšujú.
- Vážený priemer sa robí iba z odpovedaných otázok.
- Ak branching preskočí celú kategóriu, skóre je "N/A" s vysvetlením.

---

## 6. Indikatívny vs. komplexný kvíz — scoring rozdiely

### 6.1 Indikatívny kvíz

- Produkuje **orientačné skóre** pre všetky 4 výstupy.
- Menej otázok = väčšia neistota.
- Výstup obsahuje **confidence band** (napr. ORS: 45 ± 15).
- DII sa počíta z podmnožiny indikátorov — jasne označené.
- TDRI je orientačný — iba najkritickejšie risk faktory.

### 6.2 Komplexný kvíz

- Produkuje **plné skóre** so štandardnou presnosťou.
- Pokrýva všetky kategórie a risk faktory.
- ROI model má dostatočné vstupy pre detailnejší odhad.

---

## 7. Konfigurácia

Všetky scoring parametre sú v konfigurácii, nie hardcoded:

```json
{
  "version": "1.0",
  "category_weights": {
    "A": 0.20, "B": 0.20, "C": 0.15,
    "D": 0.15, "E": 0.20, "F": 0.10
  },
  "maturity_thresholds": [20, 40, 60, 80],
  "risk_thresholds": [15, 35, 60],
  "security_penalty_threshold": 30,
  "security_penalty_max_factor": 0.30,
  "dii_indicators_count": 12,
  "unknown_answer_exclusion_threshold": 0.50
}
```
