# digitalizuj.to — Benchmark Specification

> **Platí pre:** benchmark dáta `2025-DII-v3` · scoring config `1.5` · overené 2026-08-06
>
> Dokument nemá vlastné číslo verzie — má ho model, ktorý opisuje.
> Zhodu pečiatky so zdrojmi kontroluje build (`validate-model.mjs` #16),
> takže revízia modelu bez prečítania dokumentácie zhodí build.
> História zmien modelu: [`MODEL_VERSIONS.md`](MODEL_VERSIONS.md).
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
- Zdroj pravdy je `data/benchmarkData.json`; `data/benchmarkData.ts` je len typovaný wrapper nad ním a `config/model/benchmarkData.json` jeho presné zrkadlo. Zhodu kópie so zdrojom, súčet distribúcie, odvodenie mediánu (§3.3) aj to, že každý sektor a veľkosť voliteľná v kvíze má referenčný záznam, vynucuje `scripts/validate-model.mjs` (kontroly #9–#11) — build pri rozchode spadne. Predtým sa hodnoty držali zvlášť v TS a v JSON kópii a rozišli sa: kópii chýbal celý blok ČR.
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

Pásma:  very_low 0-3 · low 4-6 · high 7-9 · very_high 10-12

Celočíselné skóre s reprezentuje interval [s−0,5; s+0,5] (continuity
correction), takže spojité hranice pásiem sú −0,5 / 3,5 / 6,5 / 9,5 / 12,5
a šírky 4 / 3 / 3 / 3.

percentile = Σ distribúcie pod pásmom + (pozícia v pásme × distribúcia pásma)
kde pozícia v pásme = (s − dolná hranica) / šírka pásma, orezané na [0, 1]

Výsledok sa orezáva na [1, 99] — 0 ani 100 by tvrdili absolútnu istotu.
```

**Prečo tie isté hranice ako pri mediáne (§3.3):** percentil je definične
inverziou mediánu. Model musí byť ten istý, inak firma presne na mediáne vidí
na jednej karte „odchýlka 0,0" vedľa percentilu, ktorý nie je 50. Pri tomto
vzorci platí `percentil(diiMedianScore) = 50` pre SK, ČR aj EÚ-27 — a je to
zafixované testom v `engines/benchmarkEngine.test.ts`.

**Príklad (dataset 2025-DII-v3):** Firma s DII 7 v SK je nad **77 %** firiem:
41,6 % (celé very_low) + 32,0 % (celé low) + 1/6 × 20,4 % (skóre 7 leží 0,5
nad dolnou hranicou pásma high, ktoré je 3 body široké).

> **Oprava 5. 8. 2026:** predchádzajúca implementácia brala hranice ako 3/6/9
> a delila každé pásmo tromi. Dno pásma tak dostalo tretinu jeho hmoty (skóre 4
> → 52. percentil namiesto 47) a pásmo very_low so štyrmi hodnotami (0–3) sa
> delilo tromi, takže skóre 3 dostalo celú hmotu pásma. Uvedený príklad pre
> DII 7 dával 80 namiesto 77.

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

Všetky tri sú implementované (`orsVsCountry`, `orsVsSector`, `orsVsSize`), rovnako
ako DII porovnanie podľa veľkosti (`diiVsSize`). Do 5. 8. 2026 bolo implementované
len sektorové porovnanie — `sizeBand` sa zbieral, odovzdával do enginu a tam
zahodil, takže päťčlenná firma sa porovnávala s rovnakým mediánom ako
dvestočlenná, hoci `sizeBenchmarks` dáta existovali.

**Disclaimer:** ORS benchmarky sú odvodené odhady, nie tvrdé dáta — a rovnako aj
sektorové a veľkostné DII mediány (Eurostat ich po sektoroch ani veľkostiach
nepublikuje). Každé porovnanie preto nesie pole `source` (`'eurostat'` =
meraná distribúcia, `'expert'` = odhad) a UI podľa neho rozdeľuje karty do
dvoch skupín. Pri mikrofirmách sa navyše zobrazuje upozornenie, že Eurostat
firmy pod 10 zamestnancov vôbec nepokrýva.

**Uložené výsledky spred zmeny** tieto polia nemajú, preto sú v type voliteľné
a UI ich vtedy nevykreslí.

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


## Referenčná vzorka je modelovaná

`data/peerData.ts` obsahuje 50 profilov naprieč 8 sektormi a 4 veľkostnými
pásmami. **Žiadny nepredstavuje reálnu firmu** — rozloženie skóre je kalibrované
na distribúcie Eurostat DII 2025 (isoc_e_dii) pre Slovensko, ale samotné profily
sú modelované. Slúžia na orientáciu, kým nepribudne dosť skutočných hodnotení.

Percentily v `PeerComparisonPanel` sa teda počítajú voči modelovanej populácii,
nie meranej. UI to musí priznávať; texty sú v `peersPanel.intro` a
`peersPanel.anonBody`.

**Pokrytie DII (oprava 6. 8. 2026).** Každý profil mal `diiMeasured: 12`, hoci
komplexný kvíz pokrýva najviac 10 indikátorov a indikatívny 8 — vzorka tvrdila
stav, ktorý nástroj vyprodukovať nevie, a respondentov výsledok tým pôsobil
neistejšie než referencia. Profily majú odteraz dosiahnuteľné pokrytie
(39× 10/12, 11× 8/12) a `diiScore12` prepočítané vzorcom enginu
`round(met / measured × 12)`. Stráži to `data/peerData.test.ts`, ktorý
pokrytie počíta priamo z banky.


## Mikrofirmy a pokrytie Eurostatu

`isoc_e_dii` zbiera podniky **od 10 zamestnancov**. Firma s 1–9 ľuďmi tak
dostávala DII percentil voči rozdeleniu, v ktorom žiadna firma jej veľkosti
nie je — a keďže to porovnanie nesie `source: 'eurostat'`, pôsobilo
dôveryhodnejšie než expertné odhady vedľa neho, hoci pre ňu platí najmenej.

Od 6. 8. 2026 nesie `BenchmarkComparison` pole `caveatSk`. Porovnania voči
meranej distribúcii (`diiVsSk`, `diiVsEu`, `orsVsCountry`) ho pre pásmo
`micro` vypĺňajú a UI ho zobrazí pod kartou.

**Percentil sa napriek tomu počíta ďalej.** Skryť ho by bolo horšie:
mikrofirma by prišla o jedinú orientáciu, ktorú má. Výhrada vysvetľuje, ako
ho čítať — nemá ho nahradiť.

Výhrada sa **nepripája** k sektorovým a veľkostným porovnaniam. Tie sú
expertné odhady, ktoré pásmo `micro` zámerne pokrývajú (`sizeBenchmarks.micro`
má vlastný medián s poznámkou „Eurostat nepokrýva, expertný odhad"); pridať
k nim tú istú vetu by bol šum, nie presnosť.

### Otvorené: kotvy otázok podľa veľkosti

Druhá polovica problému zostáva. Niektoré otázky majú najvyššie možnosti
štrukturálne nedosiahnuteľné pre mikrofirmu:

| Otázka | Vrchná možnosť | Prečo je pre 1–9 ľudí mimo dosahu |
|---|---|---|
| `cx_DII04` | „Dedikovaný IT tím s viacerými rolami" | tím rolí v trojčlennej firme neexistuje |
| `cx_F01` / `ind_13` | „Zodpovedná osoba/tím s rozpočtom" | pri troch ľuďoch je to majiteľ = možnosť za 25 b |

`cx_DII04` navyše sýti **DII**, takže mikrofirme znižuje aj benchmarkové
skóre. Naopak `ind_14`/`cx_F06` (závislosť na jednom človeku) nízke skóre
dostávajú **správne** — riziko je reálne bez ohľadu na veľkosť, nie artefakt.

Riešenie by znamenalo skórovacie kotvy podmienené veľkosťou, teda zmenu
modelu s prerušením porovnateľnosti a bez dát na kalibráciu (žiadne reálne
hodnotenia zatiaľ nie sú). Vedené ako otvorený bod v `IMPROVEMENT_CHECKLIST.md`.
