# Celkový checklist vylepšení — digitalizuj.to

> Dátum: 2026-07-24 (revízia; pôvodný audit 2026-07-23)
> Zdroj: hĺbkový audit metodiky (6 oblastí: metodika, scoring, benchmark, ROI, odporúčania, otázková banka) + overenie aktuálnych dát (Eurostat isoc_e_dii 2025, State of the Digital Decade 2026, ŠÚ SR / Eurostat mzdové dáta 2025-2026).
> Priorita: **P0** = podkopáva obhájiteľnosť/správnosť, riešiť najskôr · **P1** = významné metodické/funkčné medzery · **P2** = kvalita, dôveryhodnosť, roadmapa.

---

## ✅ Hotové v revízii 2026-07-24 (v1.2–1.3)

### Vizuál
- [x] Hero sekcia prerobená na apple.com štýl — svetlé pozadie, konzistentný tmavý nav bar na celej stránke (nie len na homepage), gradientový akcent v nadpise, plávajúca karta s náhľadom výsledkov, čierne "Buy"-štýl CTA; mäkký prechod header→body (namiesto ostrej hranice)
- [x] Opravený font bug — telo stránky renderovalo natvrdo v Arial/Helvetica, ignorujúc načítaný font; nový primárny font Onest (SF Pro–podobné proporcie, plná slovenská diakritika)

### AI & Automatizácia Readiness Index
- [x] Nový 5. nezávislý výstup (0–100), architektonicky rovnaký ako TDRI (prierezový index naprieč otázkami, nie 7. os ODRM radaru — 6-osový radar a Eurostat benchmark zostávajú nedotknuté)
- [x] Vlastná karta vo výsledkoch, vlastný odsek v Executive Summary, vlastné odporúčania (quick win pri nízkom skóre, strategické "rozšírte do produkcie"/"formalizujte governance" pri vyššom)
- [x] Nová otázka `ind_15_ai` v indikatívnom kvíze (dovtedy sa AI v rýchlom screeningu nepýtalo vôbec); `cx_A06_ai_automation` a `cx_F07_ai_governance` v komplexnom kvíze; `cx_DII03` dotagovaná
- [x] Nezmeraný stav = `null`, nie skóre 0 (rovnaká oprava ako odporúčaná pre DII/ORS nižšie v P0)

### ROI model — hodinová cena práce
- [x] **Otázka na hodinovú cenu práce úplne odstránená** (`ind_15`, `cx_ROI01`) — citlivý údaj, nepresné odhady, navyše nekonzistentná definícia medzi kvízmi (hrubá vs. plná cena). ROI teraz vždy počíta s priemernou plnou hodinovou cenou práce na Slovensku (19,8 €/h, Eurostat `lc_lci_lev` 2025) — vedomý trade-off nižšej presnosti za vyššiu completion rate a jednoduchší dotazník (zdokumentované v METHODOLOGY.md §6.3)

---

## ✅ Hotové v revízii 2026-07-23 (v1.1)

### Dáta a benchmarky
- [x] **Benchmark dáta nahradené za Eurostat DII 2025** — dataset `2025-DII-v3` (isoc_e_dii, prieskum 2025, DII v3): SK 41,6/32,0/20,4/6,0 %, EÚ-27 27,9/34,5/27,5/10,1 %; opravená chybná EÚ distribúcia (15 % „very high" nemalo oporu v žiadnej publikovanej hodnote)
- [x] DII mediány odvodené reprodukovateľne z distribúcie (SK 4,3 / EÚ 5,4) so zdokumentovanou interpoláciou (BENCHMARK_SPEC.md §3.3)
- [x] Korektné citovanie zdroja: `isoc_e_dii` namiesto neexistujúceho „Eurostat DESI 2024"; zdokumentovaná dvojročná rotácia DII verzií (v4/2024 vs. v3/2025)
- [x] Ročná aktualizačná politika benchmarkov (do 3 mesiacov od decembrovej publikácie Eurostatu)
- [x] Expertné odhady (ORS, sektorové a veľkostné mediány) explicitne označené provenance poznámkami
- [x] UI reťazce aktualizované (footer, benchmark panel, peers, changelog); debug výstup číta verzie z modelu namiesto konštánt

### Metodika (docs)
- [x] Tabuľka 12 DII premenných opravená na v3/2025 (predtým v2023 sada s duplicitnými e-commerce indikátormi #9/#10)
- [x] Odstránený AI-generačný artefakt „Toto je hard requirement z promptu" — nahradený vecným zdôvodnením (asymetrický dopad incidentov, NIS2/366/2024 Z. z.)
- [x] Nová sekcia 5.1b: spracovanie „Neviem"/preskočených odpovedí (vylúčenie z menovateľa, confidence downgrade, penalizácia len meranej kategórie E)
- [x] Nová sekcia 9.6: AI pripravenosť + regulačné okná (NIS2 2025, B2B e-fakturácia 1. 1. 2027, AI Act 2025-2027)
- [x] Referenčné KPI Digitálnej dekády (SME ≥ základná intenzita: SK 57,1 % vs. EÚ 71,4 %, cieľ 90 %/2030)
- [x] Zjednotené počty otázok naprieč dokumentmi a UI (indikatívny 15, komplexný 45+/43-47)
- [x] ROI_MODEL: mzdové kotvy 2025/2026 (Eurostat lc_lci_lev 19,8 €/h; ŠÚ SR 1 620 €/mes.; multiplikátor 1,362 od 1. 1. 2025 — starý 1,352 platil len do 2024; min. mzda 915 €/2026) + zdrojový apendix §7
- [x] ROI_MODEL: confidence vzorec zosúladený s kódom (lineárna kombinácia 0,8c + 0,3(1−c)); headline označený ako run-rate vrátane error zložky; „sektorové benchmarky" korektne označené ako plánované
- [x] SCORING_SPEC: verzijná poznámka 1.2-MVP s potvrdenými zmenami správania a evidenciou známych odchýlok spec ↔ kód

### Kód (opravy správnosti)
- [x] `scoringEngine`: bezpečnostná penalizácia sa aplikuje len na meranú kategóriu E (predtým nemeraná E = max. penalizácia −30 %)
- [x] `riskEngine`: čiastočné penalty ignorujú „Neviem"/preskočené odpovede a informačné otázky bez bodovateľných možností (predtým cx_B02 → RF06 penalta pre každého respondenta komplexného kvízu)
- [x] `benchmarkEngine`: gap prahy pre DII škálu 0-12 prepočítané na ±0,6/±2,4 (predtým „Výrazne nad/pod priemerom" na DII škále matematicky nedosiahnuteľné)
- [x] `recommendationEngine` + UI: transformačné odporúčania (12+ mes.) sa vracajú vo výsledku a zobrazujú (predtým sa zahadzovali — sekcia bola vždy prázdna)
- [x] `recommendationEngine`: AI odporúčanie len pri explicitnom „nevyužívame AI" (nie pri chýbajúcej/„Neviem" odpovedi)

### Otázková banka (v1.1)
- [x] ind_10: pridaná exkluzívna možnosť „Nemáme žiadne z uvedeného" — firmy bez opatrení môžu odpovedať pravdivo a risk flagy (RF02/RF04/RF05) sa korektne spustia
- [x] ind_09: flag_risk `eol` → RF01 (zosúladené s cx_D03_server); ind_11: flag_risk `disaster` → RF02+RF09, `major_impact` → RF09
- [x] ~~ind_15 zjednotená s cx_ROI01~~ → **obe otázky odstránené** (2026-07-24): hodinová cena práce sa už nepýta, ROI vždy počíta s priemerom SR (viď revízia 1.3 nižšie) — pôvodná nekonzistencia hrubá/plná cena je tým odstránená natrvalo, nie len opravená
- [x] Opravené poradie ind_12 (bolo za ind_14); cx_C01 skip-reason opravený; ISDOC (český formát) → UBL/EN 16931 + kontext povinnej B2B e-fakturácie 2027
- [x] Kópie `data/` ↔ `config/model/` zosynchronizované (questionBank drift 8 dní; broken sync cesta `src/data/` v README opravená)

**Overené:** produkčný build (TS + 61 stránok) ✓, kompletný E2E prechod indikatívnym kvízom v prehliadači ✓ (flagy, percentily, gap popisky, benchmark verzia vo výstupe).

---

## 🔴 P0 — podkopáva obhájiteľnosť, riešiť najskôr

- [ ] **Per-indikátorová DII agregácia** — `scoringEngine.calculateDII` priemeruje odpovede bez vrstvy indikátorov: pridať mapovanie `maps_to_dii: DII1-DII12` do banky, skóre per indikátor, priemer cez 12 indikátorov, binárne prahy per indikátor (33 pre AI/analytiku, 50 ostatné — viď SCORING_SPEC §2), `pureBinary` z indikátorov (dnes môže presiahnuť 12 a je klampovaný). Bez toho nie je DII benchmark porovnanie per-indikátor auditovateľné. *(engines/scoringEngine.ts:12-53)*
- [ ] **`include` branching je no-op — adaptivita reálne nefunguje** — include-gated otázky (cx_D03/D04 server detaily, cx_D05 cloud governance, cx_B05b outsourcing, cx_B06 e-commerce) sa pýtajú VŽDY, aj keď sú irelevantné, a ich odpovede skresľujú ORS-D/B a TDRI. Fix: pri štarte kvízu pred-naplniť `skippedQuestions` všetkými cieľmi include pravidiel; pri spustení include cieľ odblokovať. *(context/AssessmentContext.tsx:93, engines/questionEngine.ts:33-46)*
- [ ] **Prázdna/preskočená kategória = 0 s plnou váhou namiesto N/A** — deflácia ORS (plne preskočená F znižuje max. ORS na 90); zaviesť `measured: boolean`/nullable score + renormalizáciu váh cez merané kategórie; `calculateDII` bez odpovedí má vracať N/A stav, nie score 0/„very_low". *(engines/scoringEngine.ts:87, 97-113; types/index.ts CategoryScore)*
- [ ] **QUESTION_BANK_GUIDE.md dokumentuje neexistujúcu schému** — guide popisuje `maps_to_dii`, branching objekt na nasledujúcej otázke atď.; reálna banka má `branching_rules` pole na spúšťacej otázke a iné kľúče. Prepísať guide podľa reálnej schémy + pridať validačný skript (JSON schema + kontrola: podmienky parsovateľné, targety existujú a sú neskôr v poradí, DII pokrytie). *(config/model/QUESTION_BANK_GUIDE.md)*
- [ ] **Prekryv vrstiev DII ↔ ODRM** — niektoré otázky sýtia obe vrstvy (`maps_to_score: ['ors_D','dii']`); zdokumentovať item-mapu, prijať pravidlo (1 otázka = 1 vrstva, alebo priznaný prekryv) a po pilote otestovať diskriminačnú validitu kvadrantového naratívu „vysoký DII / nízky ODRM". *(METHODOLOGY.md §4; data/questionBank.json)*

## 🟠 P1 — významné medzery

### ROI engine
- [ ] Zapojiť zbierané vstupy **cx_ROI02** (admin headcount) a **cx_ROI03** (objem fakturácie) do per-procesných výpočtov — dnes sa extrahujú a nepoužívajú; dve firmy s 10× rozdielnym objemom faktúr dostanú identické ROI *(engines/roiEngine.ts:276-277)*
- [ ] Fallback bug: `getMultiSelectValues('cx_A05') || getMultiSelectValues('ind_05') || []` — prázdne pole je truthy, fallback nedosiahnuteľný; použiť length checky; indikatívna vetva nemá žiadnu otázku na manuálne procesy *(engines/roiEngine.ts:269)*
- [ ] Hodnoty cx_A05 `warehouse`/`service`/`purchasing` nemajú benchmark kľúče — mapovať (warehouse→inventory_management, service→customer_service, purchasing→order_processing) a obnoviť 2 chýbajúce benchmarky z ROI_MODEL.md §2.2 *(data/scoringConfig.ts:82-130)*
- [ ] Procesy explicitne označené ako manuálne (cx_A05) majú dostať manual_share ≥ 0,85, nie globálny podiel z jednej maturity odpovede *(engines/roiEngine.ts:24,46)*
- [ ] Governance gating scenárov (§5.3) — vracať `recommendedScenario`/`displayPolicy` z enginu a v UI potlačiť optimistický scenár pri F < 50 (dnes len disclaimer string)
- [ ] `employee_count` je deklarovaný ako povinný, ale kód ticho defaultuje na `small` — pri chýbajúcom údaji ROI nepočítať alebo výrazne označiť *(engines/roiEngine.ts:272)*

### TDRI / riziká
- [ ] **Inverzia penált:** potvrdený medium risk (flag) = 0,6×, len odvodený = 0,8× — potvrdenie nesmie skórovať menej než dohad; zvážiť aktívny = plný maxPenalty (severity je už v maxPenalty) a odvodený < aktívny *(engines/riskEngine.ts:28-48)*
- [ ] Maximálny súčet penált je ~86,2, nie 100 (severity multiplikátor dvojito počíta závažnosť) — zosúladiť škálu alebo rekalibrovať pásma (critical 61-100 je fakticky 61-86) *(SCORING_SPEC §4 vs. riskEngine)*
- [ ] **RF12 je mŕtvy faktor** — žiadna otázka naň nemapuje; pridať otázku na out-of-support aplikácie (modul E) alebo RF12 odstrániť a opraviť tvrdenie „12 risk faktorov"
- [ ] RF06 prechádza gate ≥ 5, ale nemá template v recommendationEngine → top riziko bez akcie; doplniť template (a logovať, keď faktor nad gate nemá template) *(engines/recommendationEngine.ts:47-82)*
- [ ] Medium-severity riziká matematicky nikdy nevygenerujú odporúčanie (max 4,0 < gate 5) — pridať medium tier do roadmapy 3-12 mes. (RF08/RF10/RF11/RF12)
- [ ] `riskThresholds` čítať z configu (v engine sú zduplikované hardcoded) *(engines/riskEngine.ts:70-73)*
- [ ] Risk-driven odporúčania majú vždy `category: 'E'` — RF01/RF06 patria do D, RF07 do F; doplniť kategóriu per template a odlíšiť potvrdené vs. odvodené faktory (`inferred` stav)

### Odporúčania
- [ ] **Kategória D (infraštruktúra/cloud) negeneruje žiadne odporúčanie** pri žiadnom skóre — implementovať dokumentované pravidlá (remote access quick win, cloud migrácia strategic); C v pásme 30-49 tiež nič nedostane (BI strategic rec chýba) *(engines/recommendationEngine.ts:104-250 vs. RECOMMENDATION_RULES.md)*
- [ ] Answer-level a firmografické podmienky z RECOMMENDATION_RULES (invoicing=='manual', employee_count>20 pre ERP, infra=='onprem'...) nie sú implementované — 3-osobovej firme sa odporúča ERP; parametre `answers, questions` sú v kóde nevyužité
- [ ] `priorityScore` počítať zo skutočných polí urgency×impact/effort (dnes hardcoded 5/2) a per-faktor effort (migrácia ≠ effort 2)
- [ ] Dedup: `rec_qw_security_basics` (E<50) duplikuje RF02/04/05 odporúčania v tej istej roadmap bunke — potlačiť pri aktívnych RF flagoch
- [ ] Doplniť regulačný kontext do odporúčaní: NIS2 scope-check (bezpečnostná stratégia), e-fakturácia 2027 (invoicing quick win — pravidlo z RULES chýba v kóde úplne); nezdrojované čísla („93 % MFA", „~80 % redukcia") doložiť alebo odstrániť

### Kvíz / meranie
- [ ] Konfidenčné pásma pre indikatívny kvíz — `assessmentType` do `calculate*`, `confidenceBand` do DIIScore/ORSScore, zobrazovať interval (ORS 55-70) alebo pásmo namiesto bodu; 12-otázkový a 45-otázkový výsledok dnes vyzerajú rovnako isto *(SCORING_SPEC §6.1)*
- [ ] `unknownRatio` zmiešava „Neviem", branch-skip a nepoložené otázky — počítať unknown/(answered+unknown), skipy a neprezentované vylúčiť *(engines/scoringEngine.ts:88-95)*
- [ ] Kvíz „Neviem" obchádza všetky branching pravidlá (vrátane skip) — definovať politiku (vyhodnotiť skip s hodnotou 'unknown'; zvážiť „unverified" risk flag pre bezpečnostné neznáme) *(context/AssessmentContext.tsx:89)*
- [ ] Rozdeliť double-barreled otázky (ind_03 procesy spolu, ind_11 strata dát vs. výpadok, cx_A04 schvaľovania, cx_B04 source-of-truth, cx_E06 BC+DR, cx_D07 počítače+mobily); pridať reverse-keyed položky
- [ ] Pridať NIS2 screening otázku (modul E, sektor/veľkosť gate existuje) + otázku na security awareness/EDR; zachytávať rolu respondenta (majiteľ vs. IT) ako premennú
- [ ] Inverted multi-select cx_A05: floor je 30/100 (váhy sú −70 v súčte) a detekcia cez magic-string „Invertované" — rebalans na −100 + explicitné pole `scoring_mode: 'inverted'`
- [ ] Validátor branching podmienok pri builde (parser dnes ticho vracia false pri nerozpoznanej syntaxi) *(engines/questionEngine.ts:100-152)*

### Benchmark
- [ ] Percentilová interpolácia: band-bottom bias (skóre 4 = 1/3 do pásma namiesto dna) — ukotviť dolnú hranicu pásma na kumulatívny podiel pod pásmom a zosúladiť so spec príkladom *(engines/benchmarkEngine.ts:35-43)*
- [ ] Implementovať `orsVsCountry` a `orsVsSize` (spec §4.3; `sizeBand` parameter aj `sizeBenchmarks` sú dnes mŕtve) alebo mŕtve dáta/parametre odstrániť
- [ ] Single source of truth: build-time kontrola konzistencie `config/model/benchmarkData.json` ↔ `data/benchmarkData.ts` (a `questionBank.json` kópií) — CI fail pri drifte
- [ ] Sektorové/veľkostné DII mediány zobrazovať s rovnakým disclaimerom ako ORS (sú to expertné odhady) *(engines/benchmarkEngine.ts:46-67)*

## 🟡 P2 — kvalita a roadmapa

- [ ] Audit trail: doplniť step typy `penalty`/`benchmark`/`recommendation` + replay test v CI (prepočet skóre len z audit trailu = zobrazená hodnota), aby claim „každé skóre spätne rozložiteľné" bol verifikovateľný
- [ ] Váhy: sensitivity analýza (±5 p. b.), citácie porovnateľných frameworkov (CMMI, Acatech I4.0 Maturity Index, IMPULS, DREAMY), zdokumentovaný elicitačný protokol; verziu váh zobrazovať pri výsledku
- [ ] Reliability roadmapa: test-retest pilot, Cronbachova alfa per kategória po 100+ hodnoteniach (pilotCriteria už v configu existujú), dvoj-respondentný režim s flagom divergencie
- [ ] ROI: adopčná krivka (50 % year-1 toggle), pásma nákladov per odporúčanie → payback interval; opportunity gap preformulovať („oproti plne digitalizovanému stavu" — nie je to benchmark porovnanie)
- [ ] Zaokrúhľovanie: interné výpočty v plnej presnosti, zaokrúhliť len zobrazenie (drift až 0,3 bodu môže preklopiť maturity level/penaltu); zdokumentovať band semantiku (20,40] a raw vs. penalized pre maturity level
- [ ] `getMaturityLevel` vracia −1 → `manualShareFromMaturity[-1]` = undefined → NaN riziko; vrátiť `number | null` a nútiť callerov riešiť
- [ ] Hardcoded scoring parametre do configu (DII level cutoffs 3/6/9, binárne prahy, 0,25 confidence cutoff, indikátorov 12)
- [ ] Mikrofirmy: UI caveat pri DII porovnaní (Eurostat 10+); size-conditional scoring kotvy pre governance/ICT otázky
- [ ] Zjednotiť verzie hlavičiek spec dokumentov s configom (spec 2.0 rekonciliácia) a viesť changelog zmien modelu
- [ ] Ročný proces: december — Eurostat isoc_e_dii release → aktualizovať benchmarkData (obe kópie) + METHODOLOGY referenčné hodnoty; marec — lc_lci_lev/ŠÚ SR → `defaultHourlyCostEur` a ROI_MODEL §7
- [ ] Sledovať publikáciu State of the Digital Decade 2027 (jún 2027) a prípadnú zmenu DII na v4 v prieskume 2026 (december 2026!) — otázky DII vrstvy bude treba premapovať

---

*Vygenerované z multi-agentového auditu (10 agentov, ~750k tokenov analýzy) a webového overenia primárnych zdrojov: Eurostat isoc_e_dii (vintage 2026-02-27), State of the Digital Decade 2026 (COM(2026) 288, 17. 6. 2026), Digital Decade Country Report 2026 — Slovensko, Eurostat lc_lci_lev 2025, ŠÚ SR mzdy 2025/Q1 2026.*
