# Changelog

Všetky významné zmeny v projekte digitalizuj.to sú dokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt používa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
