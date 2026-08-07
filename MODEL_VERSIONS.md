# digitalizuj.to — história verzií modelu

> **Platí pre:** otázková banka `1.8` · scoring config `1.5` · benchmark dáta `2025-DII-v3` · overené 2026-08-07
>
> Zhodu pečiatky so zdrojmi kontroluje build (`validate-model.mjs` #16).

Model má **tri nezávisle verzované zdroje** a každý má vlastný životný cyklus:

| Zdroj | Kde | Verzia dnes | Čo mení |
|---|---|---|---|
| Otázková banka | `data/questionBank.json` | `1.8` | znenie, počet a váhy otázok |
| Scoring config | `data/scoringConfig.ts` | `1.5` | váhy kategórií, prahy, rizikové faktory, ROI parametre |
| Benchmark dáta | `data/benchmarkData.json` | `2025-DII-v3` | referenčné distribúcie Eurostatu |

`CHANGELOG.md` popisuje **funkcie** — čo pribudlo pre používateľa. Tento
dokument popisuje **zmeny merania**: čo sa stalo s modelom a či sú výsledky
spred zmeny ešte porovnateľné s novými. To je iná otázka a odpoveď na ňu
potrebuje človek, ktorý neskôr pozerá na dáta, nie ten, kto číta release notes.

---

## Ako čítať stĺpec „Porovnateľnosť"

- **Zachovaná** — rovnaké odpovede dajú rovnaké skóre. Zmena bola opravou
  chyby, ktorá sa neprejavila na výsledku, alebo šlo len o dokumentáciu.
- **Posunutá** — skóre sa mohlo zmeniť, ale nástroj meria to isté. Trendy
  naprieč zmenou sú interpretovateľné s výhradou.
- **Prerušená** — nástroj sa zmenil natoľko, že priame porovnanie skóre spred
  a po zmene je metodicky neplatné.

Verzia modelu je pri každom uloženom výsledku v stĺpci `model_version` ako
`{scoring}/qb{banka}` — dnes teda `1.5/qb1.8`. Dá sa podľa nej filtrovať
v SQL bez rozparsovania `result_json`.

---

## Otázková banka

### 1.8 — 7. 8. 2026 · **Porovnateľnosť: prerušená pre mikro a malé firmy**

Skórovacie kotvy podľa veľkosti firmy (`size_anchors`, SCORING_SPEC §13).

Dve otázky mali vrchné možnosti, ktoré firma s 1–9 zamestnancami nedosiahne
ani pri najlepšom vedení — merali teda počet zamestnancov, nie zrelosť:

| Otázka | Strop micro | Strop small |
|---|---|---|
| `cx_DII04` (ICT špecialisti) | stály externý dodávateľ (50) | interný IT človek (75) |
| `cx_B05` (správa IT systémov) | externý dodávateľ / MSP (50) | bez úpravy |

Skóre týchto otázok sa pre dané pásmo prepočíta tak, aby dosiahnuteľný strop
znamenal plný počet bodov. Nula zostáva nulou; úprava nikdy neuberá.

**Čo to znamená pre porovnateľnosť:**

- **Mikro a malé firmy** — ORS je od tejto verzie **vyššie** než predtým, ak
  na tieto otázky odpovedali. Priame porovnanie so staršími výsledkami tej
  istej veľkosti je metodicky neplatné. Najviac sa dotýka kategórií **B a F**
  (obe otázky sýtia `ors_F`, `cx_B05` aj `ors_B`).
- **Stredné a veľké firmy** — bez zmeny, kotvy sa ich netýkajú.
- **DII, TDRI a odporúčania** — bez zmeny pri akejkoľvek veľkosti. Prepočet
  žije výhradne v agregácii ORS; `Answer.score` zostáva surové.

Stropy sú expertné rozhodnutie bez kalibračných dát — žiadne reálne hodnotenia
zatiaľ neexistujú. Odchýlka je preto navrhnutá jednosmerne: chybne nízky strop
môže byť štedrý, nie trestajúci.

**Sprievodná oprava (bez vplyvu na skóre):** cesta banka → MariaDB → banka
strácala `scoring_mode`, `anchor_low_sk`, `anchor_high_sk`
a `likert_ors_rationale`. Publish z databázy by tak vypol invertované
skórovanie `cx_A05` — teda skóre 0 pre všetkých respondentov. Chyba do
produkcie nikdy nedošla (publish z DB medzitým nebežal); stráži ju nový test
`scripts/db/roundtrip.test.ts`.

### 1.7 — 6. 8. 2026 · **Porovnateľnosť: posunutá**

Nový typ otázky `likert_11` (škála 0–10 s kotvami) a otázka na **zámer
investovať** v oboch kvízoch. Zámer je zámerne **mimo ORS** (váha 0), takže
skóre zrelosti sa nemení — mení sa len brána zobrazenia ROI scenárov, ktorá
odteraz berie prísnejšiu z dvojice governance / zámer.

Dĺžka: indikatívny 18 → 19, komplexný 57 → 58 otázok.

Posunutá, nie prerušená: existujúce otázky sa nedotkli, pribudla jedna
nebodovaná. ROI odhad sa ale môže líšiť pre firmy, ktoré zámer uviedli nízko.

### 1.6 — 6. 8. 2026 · **Porovnateľnosť: prerušená**

Šesť dvojhlavňových otázok rozdelených na dvanásť (`ind_03`, `ind_11`,
`cx_A04`, `cx_B04`, `cx_E06`, `cx_D07`). Váhy sa **delili**, nie zdvojovali —
súčet oboch polovíc sa rovná pôvodnej váhe. Tri nové otázky: ochrana koncových
staníc, bezpečnostné povedomie, manuálne procesy pre indikatívnu vetvu. Rola
respondenta ako meta premenná.

**Prerušená**, lebo `ind_11` zmenila aj hodnoty možností a rozdelenie otázok
mení, čo presne sa meria v kategóriách A, B, D a E. Výsledok spred 1.6 stojí
na inom nástroji.

Dĺžka: indikatívny 15 → 18, komplexný 50 → 57 otázok.

### 1.5 — 4. 8. 2026 · **Porovnateľnosť: prerušená**

Per-indikátorová DII agregácia (`data/diiIndicators.json`) nahradila plochý
priemer. Nemerané prestalo byť nulou — kategória bez odpovede má `null`
a do ORS nevstupuje. ORS smerovanie podľa `maps_to_score`, nie podľa
`category`. Normalizácia 35 ad-hoc škál.

**Prerušená** a je to najväčší zlom v histórii modelu: predtým sa nezmeraný
stav fabrikoval na najhoršie skóre, takže staršie výsledky sú systematicky
podhodnotené oproti novým.

---

## Scoring config

### 1.5 — 6. 8. 2026 · **Porovnateľnosť: zachovaná**

Presun posledných natvrdo písaných prahov do konfigurácie: pásma DII (3/6/9),
počet indikátorov (12), prahy spoľahlivosti DII (≥10 / ≥6), hranica `medium`
pri podiele „Neviem" (0,25), minimum odpovedí pre AI index (2).

**Zachovaná** — hodnoty sú totožné s tými, ktoré boli v kóde. Overené
diferenciálnym testom: 68 267 porovnaní starý vs. nový engine, 0 rozdielov.

### 1.5 — 6. 8. 2026 · **Porovnateľnosť: posunutá**

Plná presnosť vo výpočte: zaokrúhľuje sa až zobrazenie. Predtým sa skóre
kategórie zaokrúhlilo na desatinu, z toho sa počítal vážený priemer, ten sa
zaokrúhlil znova a až z neho maturity level.

**Posunutá** v 0,7 % prípadov: drift do 0,12 bodu preklopil maturity level
v 27 zo 4 000 testovaných kombinácií odpovedí. Skóre sa zmenilo najviac
o 0,05 bodu, ale nálepka („Rozvíjajúci sa" vs. „Pokročilý") sa v tých
prípadoch zmenila.

### 1.5 — 5.–6. 8. 2026 · **Porovnateľnosť: prerušená**

Séria opráv P1: inverzia penált v TDRI (potvrdené riziko skórovalo **nižšie**
než odvodené), normalizácia TDRI na dosiahnuteľných 100 (predtým ~93),
percentil DII bez posunu o tretinu pásma, ROI reagujúce na zbierané vstupy.

**Prerušená** — TDRI aj ROI dávajú pre tie isté odpovede iné čísla.

---

## Benchmark dáta

### 2025-DII-v3 — aktuálne

Eurostat `isoc_e_dii`, prieskum 2025, DII verzia 3. Zdroj pravdy je
`data/benchmarkData.json`, kópia v `config/model/` sa kontroluje pri builde
(validátor #9).

**Ďalšia zmena je naplánovaná:** prieskum DII beží **december 2026** a môže
priniesť verziu 4 s iným počtom aj mapovaním premenných. Publikácia *State of
the Digital Decade 2027* vychádza v júni 2027. Vtedy sa zmení
`diiTotalIndicators`, mapovanie v `data/diiIndicators.json` aj referenčné
hodnoty — a porovnateľnosť bude **prerušená** naprieč celou históriou.

---

## Referenčná vzorka

Nie je verzovaná ako model, ale patrí sem: `data/peerData.ts` obsahuje
50 **modelovaných** profilov, nie merané firmy. Rozloženie je kalibrované na
Eurostat DII 2025 pre SK. Do 6. 8. 2026 tvrdila pokrytie `diiMeasured: 12`,
ktoré nástroj dosiahnuť nevie (najviac 10, resp. 8) — opravené, distribúcia
skóre sa nemenila. Detaily v `BENCHMARK_SPEC.md`.

Kým nepribudne dosť skutočných hodnotení, percentily sa počítajú voči
modelovanej populácii. UI to priznáva.
