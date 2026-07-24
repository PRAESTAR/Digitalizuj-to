# Changelog

Všetky významné zmeny v projekte digitalizuj.to sú dokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt používa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0-pre-alpha] — 2026-07-24

### Pridané
- **AI & Automatizácia Readiness Index (0-100)** — nový, 5. nezávislý výstup platformy popri DII/ORS/TDRI/Business Impact. Architektonicky rovnaký princíp ako Technical Debt & Risk Index: prierezový index počítaný z otázok naprieč kategóriami (nie samostatná 7. os ODRM radaru), s vlastnou kartou vo výsledkoch a vlastnými odporúčaniami. Zdôrazňuje digitalizáciu, automatizáciu a AI ako prioritnú tému platformy.
  - Nová otázka `ind_15_ai` v indikatívnom kvíze (dovtedy sa AI v rýchlom screeningu vôbec nepýtalo).
  - Nové otázky `cx_A06_ai_automation` (AI vs. pravidlová automatizácia, modul Procesy) a `cx_F07_ai_governance` (AI politika a zodpovednosť, modul Governance) v komplexnom kvíze.
  - Existujúca otázka `cx_DII03` (využívanie AI) dotagovaná do nového `ai_readiness` bucketu.
  - Nezmeraný stav (chýbajúce odpovede o AI) sa zobrazuje ako "nezmerané", nie ako skóre 0.
- **Vizuálny redizajn hero sekcie na apple.com štýl** — svetlé pozadie, tmavý konzistentný nav bar (rovnaký na každej stránke), veľký nadpis s gradientovým akcentom, plávajúca náhľadová karta výsledkov, čierne "Buy"-style CTA tlačidlo. Opravený bug, kde telo stránky ignorovalo načítaný font a renderovalo sa v Arial/Helvetica; primárny font nahradený za Onest (SF Pro–podobné proporcie s plnou podporou slovenskej diakritiky).

### Odstránené
- **Otázka na hodinovú cenu práce** (`ind_15` v indikatívnom, `cx_ROI01` v komplexnom kvíze) — citlivý údaj, ktorý respondenti odhadovali nepresne a oba kvízy sa naň navyše pýtali s odlišnou definíciou (hrubá vs. plná cena). ROI model teraz vždy počíta s priemernou plnou hodinovou cenou práce na Slovensku (19,8 €/h, Eurostat `lc_lci_lev` 2025) namiesto self-reported hodnoty. Indikatívny kvíz má po tejto zmene (odobratá mzdová otázka, pridaná AI otázka) opäť 15 otázok.

## [1.1.0-pre-alpha] — 2026-07-23

### Zmenené
- **Benchmark dáta aktualizované na Eurostat DII 2025** — nahradený zastaraný dataset „Eurostat DESI 2024" novým `2025-DII-v3` (dataset `isoc_e_dii`, prieskum 2025, DII verzia 3, vintage 2026-02-27):
  - SK distribúcia: 41,6 % / 32,0 % / 20,4 % / 6,0 % (very low / low / high / very high); EÚ-27: 27,9 % / 34,5 % / 27,5 % / 10,1 %
  - Odvodené DII mediány: SK 4,3, EÚ-27 5,4 (zdokumentovaná interpolácia v BENCHMARK_SPEC.md §3.3)
  - Opravená chybná EÚ distribúcia (pôvodných 15 % „very high" nezodpovedalo žiadnej publikovanej hodnote — reálne ~10 %)
- **Metodika ukotvená na DII v3 (prieskum 2025)** — opravená tabuľka 12 DII premenných (predtým v2023 sada s duplicitnými e-commerce indikátormi), zdokumentovaná dvojročná rotácia verzií (v4/2024 vs. v3/2025), korektné citovanie `isoc_e_dii` namiesto „DESI", ročná aktualizačná politika benchmarkov, referenčné KPI Digitálnej dekády (SME ≥ základná intenzita: SK 57,1 % vs. EÚ 71,4 %, cieľ 90 % do 2030)
- **ROI model — mzdové kotvy 2025/2026** — hodinová cena práce naviazaná na Eurostat `lc_lci_lev` 2025 (SK 19,8 €/h; NACE N 15,2 €/h), ŠÚ SR mzdy 2025 (1 620 €/mes.), odvodový multiplikátor 1,362 (od 1. 1. 2025), minimálna mzda 2026 (915 €); nový zdrojový apendix §7; confidence vzorec zosúladený s implementáciou; headline dopad explicitne označený ako run-rate vrátane error zložky
- **Otázková banka v1.1** — pridaná možnosť „Nemáme žiadne z uvedeného" (ind_10), risk flagy v indikatívnom kvíze zosúladené s komplexným (ind_09 → RF01, ind_11 → RF02/RF09), otázka na cenu práce zjednotená na plnú cenu vrátane odvodov, kontext povinnej B2B e-fakturácie od 1. 1. 2027, opravené poradie ind_12, zosynchronizované kópie v `data/` a `config/model/`

### Opravené
- Bezpečnostná penalizácia ORS sa aplikuje len na meranú kategóriu E (predtým nemeraná kategória dostala maximálnu penalizáciu −30 %)
- Risk index (TDRI) ignoruje „Neviem"/preskočené odpovede a informačné otázky bez bodovateľných možností (predtým RF06 penalta pre každého respondenta komplexného kvízu)
- Benchmark gap prahy prepočítané pre DII škálu 0–12 (±0,6/±2,4) — extrémne popisky boli predtým na 0–12 škále nedosiahnuteľné
- Transformačné odporúčania (12+ mesiacov) sa opäť vracajú vo výsledku a zobrazujú v roadmape (predtým sa zahadzovali)
- AI odporúčanie sa generuje len pri explicitnej odpovedi „nevyužívame AI" (nie pri chýbajúcej/„Neviem")
- UI reťazce a debug výstupy čítajú verzie benchmarku/scoringu z modelu namiesto zastaraných konštánt

## [1.0.0-pre-alpha] — 2026-04-10

### Pridané
- **Dvojvrstvový model hodnotenia** — DII-Compatible Layer (EU benchmark) + Operational Digital Readiness Model (ODRM)
- **Indikatívny kvíz** — 12 otázok, rýchly screening digitálnej zrelosti
- **Komplexný kvíz** — 30+ otázok s adaptívnym branchingom, rozdelený do modulov A-F
- **Scoring engine** — výpočet 4 nezávislých skóre:
  - DII-Compatible Score (0-100, prepočet na 0-12)
  - Operational Readiness Score (0-100) s penalizáciou za bezpečnosť
  - Technical Debt & Risk Index (0-100, vyššie = horšie)
  - Business Impact Potential (hodiny/MD/EUR ročne)
- **Výsledkový dashboard** s interaktívnymi komponentmi:
  - Score cards s gradientmi a animáciami
  - Radarový graf 6 ODRM kategórií
  - Executive Summary s identifikáciou silných/slabých stránok
  - Risk panel s vizualizáciou TDRI faktorov
  - Business Impact panel s 3 scenármi (konzervatívny/stredný/optimistický)
  - Odporúčania v 3-fázovej roadmape (okamžité/strategické/transformačné)
  - Benchmark porovnanie (SK/EU/sektor/veľkosť)
  - Audit trail s transparentným rozpadom výpočtov
- **Adaptívny dotazník** — branching logika (skip_if, include_if, flag_risk)
- **Benchmark dáta** — Eurostat DESI 2024, 8 sektorov, 4 veľkostné kategórie
- **Playful UI dizajn** — glassmorphism, gradient karty, stagger animácie, hover efekty, card-shine, floating elementy
- **Matica 12 DII indikátorov** pokrytá otázkami
- **12 risk faktorov** (RF01-RF12) pre TDRI výpočet
- **ROI model** s process benchmarkmi (fakturácia, reporting, schvaľovanie, objednávky, HR)
- **Konfiguračný priečinok** `/config/model/` s editovateľnými JSON súbormi a metodickou dokumentáciou
- **CTA banner** v layoute s animovaným gradientom
- **Lokálne spracovanie** — žiadne dáta sa neodosielajú na server

### Technológie
- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Recharts (radarový graf)
- React Context API (state management)

### Známe obmedzenia
- Benchmark dáta sú statické (Eurostat DESI 2024)
- ORS benchmarky sú expertné odhady, nie empirické
- ROI model je zjednodušený (iba úspory, nie investičné náklady)
- Mikrofirmy (<10 zamestnancov) nie sú pokryté Eurostatom
- Self-reported dáta bez verifikácie
