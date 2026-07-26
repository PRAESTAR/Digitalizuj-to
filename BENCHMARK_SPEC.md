# digitalizuj.to — Benchmark Specification

> Verzia: 1.1-MVP  
> Dátum: 2026-07-23 (revízia; pôvodná verzia 2026-04-08)  
> Benchmark dataset: `2025-DII-v3` (Eurostat isoc_e_dii, prieskum 2025)

---

## 1. Účel benchmark vrstvy

Benchmark vrstva umožňuje firme vidieť svoje skóre **v kontexte** — nie len absolútne číslo, ale aj kde stojí voči:
- priemeru EÚ,
- priemeru Slovenska,
- svojmu sektoru,
- svojej veľkostnej kategórii.

---

## 2. Zdroje benchmarkov

### 2.1 Primárny zdroj: Eurostat `isoc_e_dii`

Pre DII-Compatible Score používame verejne dostupné dáta z Eurostat datasetu **`isoc_e_dii`** (Digital intensity level of enterprises, prieskum ICT usage in enterprises). Pozn.: „DESI" nie je citovateľný dataset — DESI bol od r. 2023 začlenený do reportingu Digitálnej dekády; enterprise dáta pochádzajú z uvedeného Eurostat prieskumu.

- **DII distribúcia podľa krajín** — percentuálne zastúpenie firiem v DII pásmach (veľmi nízka / nízka / vysoká / veľmi vysoká intenzita). Eurobase kódy pre v3: `E_DI3_VLO / E_DI3_LO / E_DI3_HI / E_DI3_VHI`, „aspoň základná" = `E_DI3_GELO`.
- **DII podľa veľkosti** (10-49, 50-249, GE250; SME KPI = 10-249).
- Sektorové DII mediány Eurostat nepublikuje — sektorové hodnoty v datasete sú expertné odhady (viď 2.2).

**Verzia DII sa strieda:** prieskum 2024 = DII v4, prieskum 2025 = DII v3 (7 z 12 premenných sa líši) — dataset musí byť ukotvený na jeden prieskumný rok a verziu; medziročné porovnania naprieč verziami nie sú priamo porovnateľné.

**Obmedzenie:** Eurostat dáta sú za firmy 10+ zamestnancov. Mikrofirmy (<10) nie sú pokryté.

**Referenčné hodnoty (prieskum 2025):** aspoň základná intenzita — EÚ-27 72,1 % / SR 58,4 % (podniky 10+); SME (10-249): EÚ 71,4 % / SR 57,1 % (cieľ Digitálnej dekády: 90 % do 2030).

### 2.2 Sekundárny zdroj: Odvodené ODRM benchmarky

Pre Operational Readiness nemáme priamy externý benchmark. Pre MVP používame:
- **Expertné odhady** na základe skúseností s SK SME segmentom.
- **Odvodzovanie z DII dát** — ak firma je v DII "nízka intenzita", odvodíme orientačné ODRM pásmo.

### 2.3 Budúci zdroj: Vlastné agregované dáta

Po nazbieraní dostatočného objemu vlastných hodnotení vytvoríme:
- Reálne ODRM percentily.
- Sektorové a veľkostné profily.
- Časové trendy.

---

## 3. Benchmark dátový model

### 3.1 Schema

Schéma zodpovedá skutočnému tvaru dát v `data/benchmarkData.ts` a `config/model/benchmarkData.json` (camelCase kľúče, veľkostné pásma `micro/small/medium/large`):

```json
{
  "version": "2025-DII-v3",
  "source": "Eurostat isoc_e_dii (prieskum 2025, DII v3) + expertné odhady (ORS, sektory, veľkosti)",
  "lastUpdated": "2026-07-23",
  "countryBenchmarks": {
    "SK": {
      "diiDistribution": {
        "very_low": 0.416,
        "low": 0.32,
        "high": 0.204,
        "very_high": 0.06
      },
      "diiMedianScore": 4.3,
      "orsEstimatedMedian": 38
    },
    "EU27": {
      "diiDistribution": {
        "very_low": 0.279,
        "low": 0.345,
        "high": 0.275,
        "very_high": 0.101
      },
      "diiMedianScore": 5.4,
      "orsEstimatedMedian": 44
    }
  },
  "sectorBenchmarks": {
    "manufacturing": { "diiMedian": 4.8, "orsEstimatedMedian": 40 },
    "wholesale_retail": { "diiMedian": 5.2, "orsEstimatedMedian": 42 },
    "professional_services": { "diiMedian": 6.5, "orsEstimatedMedian": 50 },
    "construction": { "diiMedian": 3.5, "orsEstimatedMedian": 30 },
    "transport_logistics": { "diiMedian": 4.0, "orsEstimatedMedian": 35 },
    "accommodation_food": { "diiMedian": 4.5, "orsEstimatedMedian": 33 },
    "ict": { "diiMedian": 8.5, "orsEstimatedMedian": 65 },
    "other": { "diiMedian": 4.5, "orsEstimatedMedian": 38 }
  },
  "sizeBenchmarks": {
    "micro": { "diiMedian": 3.2, "orsEstimatedMedian": 28, "note": "Eurostat nepokrýva, expertný odhad" },
    "small": { "diiMedian": 4.5, "orsEstimatedMedian": 38 },
    "medium": { "diiMedian": 6.8, "orsEstimatedMedian": 52 },
    "large": { "diiMedian": 8.0, "orsEstimatedMedian": 60, "note": "Expertný odhad (mimo SME segmentu)" }
  }
}
```

**Provenance:** `diiDistribution` = merané Eurostat dáta (isoc_e_dii, 2025, podniky 10+, NACE C10-S951 bez K). `diiMedianScore` = odvodený (viď 3.3). Všetky `ors*`, sektorové a veľkostné hodnoty = expertné odhady (v UI s disclaimerom).

### 3.2 Verzovanie a synchronizácia

- Každý benchmark dataset má `version` (formát `<rok prieskumu>-DII-v<verzia>`).
- Staré verzie sa archivujú, nové sa nasadzujú nezávisle od kódu.
- Výsledky sú vždy viazané na benchmark verziu, voči ktorej boli porovnané.
- ⚠️ Runtime číta `data/benchmarkData.ts`; `config/model/benchmarkData.json` je editovateľná kópia — po zmene ju treba preniesť do TS súboru (plánovaná build-time kontrola konzistencie je v checkliste).
- **Politika aktualizácie:** ročne, do 3 mesiacov od decembrovej publikácie Eurostat prieskumu.

### 3.3 Odvodenie DII mediánu z distribúcie

Eurostat medián DII skóre nepubĺikuje — odvádzame ho lineárnou interpoláciou nad pásmami (pásmo _low_ aproximované intervalom 3,5–6,5 atď.):

```
medián = dolná_hranica_pásma + (0.5 − kumulatívny_podiel_pod_pásmom) / podiel_pásma × šírka_pásma

SK 2025:  3.5 + (0.5 − 0.416) / 0.32  × 3 = 4.29 ≈ 4.3
EÚ 2025:  3.5 + (0.5 − 0.279) / 0.345 × 3 = 5.42 ≈ 5.4
```

---

## 4. Benchmark výpočty

### 4.1 Pozícia voči DII distribúcii

```
Vstup: dii_score_12 firmy, country (SK/EU27)
Výstup: percentil a relatívna pozícia

Ak dii_score_12 ∈ [0-3]:  level = "very_low"
Ak dii_score_12 ∈ [4-6]:  level = "low"
Ak dii_score_12 ∈ [7-9]:  level = "high"
Ak dii_score_12 ∈ [10-12]: level = "very_high"

percentile = Σ distribúcie pod level + (pozícia v level × distribúcia level)
```

**Príklad (dataset 2025-DII-v3):** Firma s DII 7 v SK:
- very_low (0-3): 41,6 % firiem pod ňou
- low (4-6): 32,0 % firiem pod ňou
- Firma je na začiatku "high" pásma = je nad ~74 % SK firiem (presný percentil závisí od vnútropásmovej interpolácie)

### 4.2 Porovnanie voči sektoru

```
Vstup: dii_score_12, sector
Výstup: odchýlka od sektorového mediánu

sector_gap = dii_score_12 - sector_benchmarks[sector].dii_median
```

### 4.3 ORS benchmark porovnanie

```
Vstup: ors_score, country, sector, size
Výstup: relatívna pozícia

ors_gap_country = ors_score - country_benchmarks[country].ors_estimated_median
ors_gap_sector = ors_score - sector_benchmarks[sector].ors_estimated_median
ors_gap_size = ors_score - size_benchmarks[size].ors_estimated_median
```

**Disclaimer:** ORS benchmarky sú odvodené odhady, nie tvrdé dáta. Zobrazujú sa s explicitným upozornením.

---

## 5. Benchmark vizualizácia

### 5.1 Dashboard elementy

1. **DII pozícia bar** — kde firma stojí v distribúcii SK/EU (marker na distribučnej krivke).
2. **Sektorové porovnanie** — firma vs. sektorový medián.
3. **Radar overlay** — firemný hexagon prekrytý sektorovým priemerom.
4. **Gap analýza** — tabuľka odchýlok po kategóriách.

### 5.2 Jazyk benchmarku

Prahy sú definované ako 5 % / 20 % z rozsahu škály — pre ORS (0–100) teda ±5/±20, pre DII gap (0–12) prepočítané ±0,6/±2,4:

| Gap (ORS 0–100) | Gap (DII 0–12) | Popis |
|-----------------|----------------|-------|
| > +20 | > +2,4 | "Výrazne nad priemerom" |
| +5 až +20 | +0,6 až +2,4 | "Nad priemerom" |
| -5 až +5 | -0,6 až +0,6 | "V okolí priemeru" |
| -20 až -5 | -2,4 až -0,6 | "Pod priemerom" |
| < -20 | < -2,4 | "Výrazne pod priemerom" |

---

## 6. Obmedzenia a disclaimery

### 6.1 Povinné disclaimery

Každý benchmark výstup musí obsahovať:
1. Verziu benchmark datasetu.
2. Zdroj dát (Eurostat/expertný odhad/vlastné).
3. Rok poslednej aktualizácie.
4. Upozornenie na obmedzenia (napr. mikrofirmy nie sú v Eurostat dátach).

### 6.2 Known limitations

- Eurostat DII nepokrýva firmy < 10 zamestnancov.
- ODRM benchmarky sú expertné odhady, nie empirické; **sektorové aj veľkostné DII mediány sú tiež expertné odhady** (Eurostat mediány nepublikuje) — v UI musia niesť rovnaký disclaimer ako ORS.
- Sektorové benchmarky sú na úrovni NACE sekcií, nie detailných divízií.
- DII dáta sa publikujú s ~1-ročným oneskorením (prieskum 2025 → december 2025) a **verzia premenných rotuje dvojročne** (v4/2024 vs v3/2025) — porovnania naprieč verziami nie sú validné.
- Granulárne DII-Compatible skóre nie je binárny Eurostat count — percentilové porovnanie je aproximácia (viď METHODOLOGY.md 9.4).

---

## 7. Budúci rozvoj

- Dynamické benchmarky z vlastných dát (po 500+ hodnoteniach).
- Regionálne benchmarky (SK kraje).
- Časové trendy (medziročné porovnanie).
- Peer group matching (firmy podobnej veľkosti a sektora).
