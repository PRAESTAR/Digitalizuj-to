# digitalizuj.to — Benchmark Specification

> Verzia: 1.0-MVP  
> Dátum: 2026-04-08

---

## 1. Účel benchmark vrstvy

Benchmark vrstva umožňuje firme vidieť svoje skóre **v kontexte** — nie len absolútne číslo, ale aj kde stojí voči:
- priemeru EÚ,
- priemeru Slovenska,
- svojmu sektoru,
- svojej veľkostnej kategórii.

---

## 2. Zdroje benchmarkov

### 2.1 Primárny zdroj: Eurostat DESI / DII

Pre DII-Compatible Score používame verejne dostupné dáta z Eurostat Digital Economy and Society databázy:

- **DII distribúcia podľa krajín** — percentuálne zastúpenie firiem v DII leveloch (veľmi nízka / nízka / vysoká / veľmi vysoká intenzita).
- **DII distribúcia podľa sektorov** (NACE Rev.2).
- **DII distribúcia podľa veľkosti** (10-49, 50-249, 250+ zamestnancov).

**Obmedzenie:** Eurostat dáta sú za firmy 10+ zamestnancov. Mikrofirmy (<10) nie sú pokryté.

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

```json
{
  "benchmark_version": "2024-Q4",
  "source": "Eurostat DESI 2024 + expertné odhady",
  "last_updated": "2024-12-01",
  "country_benchmarks": {
    "SK": {
      "dii_distribution": {
        "very_low": 0.42,
        "low": 0.33,
        "high": 0.18,
        "very_high": 0.07
      },
      "dii_median_score": 4.2,
      "ors_estimated_median": 38
    },
    "EU27": {
      "dii_distribution": {
        "very_low": 0.31,
        "low": 0.30,
        "high": 0.24,
        "very_high": 0.15
      },
      "dii_median_score": 5.5,
      "ors_estimated_median": 44
    }
  },
  "sector_benchmarks": {
    "manufacturing": {
      "dii_median": 4.8,
      "ors_estimated_median": 40
    },
    "wholesale_retail": {
      "dii_median": 5.2,
      "ors_estimated_median": 42
    },
    "professional_services": {
      "dii_median": 6.5,
      "ors_estimated_median": 50
    },
    "construction": {
      "dii_median": 3.5,
      "ors_estimated_median": 30
    },
    "transport_logistics": {
      "dii_median": 4.0,
      "ors_estimated_median": 35
    },
    "accommodation_food": {
      "dii_median": 4.5,
      "ors_estimated_median": 33
    },
    "ict": {
      "dii_median": 8.5,
      "ors_estimated_median": 65
    },
    "other": {
      "dii_median": 4.5,
      "ors_estimated_median": 38
    }
  },
  "size_benchmarks": {
    "micro_1_9": {
      "dii_median": 3.2,
      "ors_estimated_median": 28,
      "note": "Eurostat nepokrýva, expertný odhad"
    },
    "small_10_49": {
      "dii_median": 4.5,
      "ors_estimated_median": 38
    },
    "medium_50_249": {
      "dii_median": 6.8,
      "ors_estimated_median": 52
    }
  }
}
```

### 3.2 Verzovanie

- Každý benchmark dataset má `benchmark_version`.
- Staré verzie sa archivujú, nové sa nasadzujú nezávisle od kódu.
- Výsledky sú vždy viazané na benchmark verziu, voči ktorej boli porovnané.

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

**Príklad:** Firma s DII 7 v SK:
- very_low (0-3): 42 % firiem pod ňou
- low (4-6): 33 % firiem pod ňou
- Firma je v "high" pásme = je nad 75 % SK firiem

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

| Gap | Popis |
|-----|-------|
| > +20 | "Výrazne nad priemerom" |
| +5 až +20 | "Nad priemerom" |
| -5 až +5 | "V okolí priemeru" |
| -20 až -5 | "Pod priemerom" |
| < -20 | "Výrazne pod priemerom" |

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
- ODRM benchmarky sú expertné odhady, nie empirické.
- Sektorové benchmarky sú na úrovni NACE sekcií, nie detailných divízií.
- DII dáta sa aktualizujú s 1-2 ročným oneskorením.

---

## 7. Budúci rozvoj

- Dynamické benchmarky z vlastných dát (po 500+ hodnoteniach).
- Regionálne benchmarky (SK kraje).
- Časové trendy (medziročné porovnanie).
- Peer group matching (firmy podobnej veľkosti a sektora).
