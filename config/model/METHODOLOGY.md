# digitalizuj.to — Digitálna auditná platforma

**Metodika merania digitálnej zrelosti SME — Adaptívny model DAP**

> Dátum: 2026-07-23 (revízia; pôvodný návrh 2026-04-17)  
> Status: Návrh pre MVP implementáciu  
> Verzia: viazaná na build celej platformy (viď footer webu)  
> Benchmark kotva: Eurostat `isoc_e_dii`, prieskum 2025, DII verzia 3

---

## 1. Cieľ metodiky

Navrhnúť obhájiteľný, auditovateľný a adaptívny systém merania úrovne digitalizácie malých a stredných podnikov (SME), ktorý:

1. Poskytne porovnateľný benchmark voči európskemu rámcu (DII).
2. Zmeria reálnu prevádzkovú digitálnu zrelosť (nie len adopciu nástrojov).
3. Identifikuje technologický dlh a bezpečnostné riziká ako samostatnú dimenziu.
4. Odhadne obchodný dopad s transparentnou metodikou.
5. Generuje akcionovateľné odporúčania s prioritizáciou.

### 1.1 Kľúčové metodické princípy

| Princíp | Vysvetlenie |
|---------|-------------|
| **Methodology-first** | Scoring logika je definovaná pred otázkami a UI |
| **Explainability** | Každé skóre musí byť spätne rozložiteľné na odpovede a pravidlá |
| **Adopcia ≠ Zrelosť** | Firma s ERP ale chaotickými procesmi nedostane vysoké skóre |
| **Tech debt je first-class** | Out-of-support systémy, chýbajúce zálohy = tvrdá penalizácia |
| **Transparentný dopad** | Žiadne marketingové ROI čísla bez výpočtového modelu |
| **Adaptivita** | Branching a skip logic — nie lineárny formulár |

---

## 2. Dvojvrstvový model

Meranie stojí na dvoch komplementárnych vrstvách:

### 2.1 Vrstva 1: DII-Compatible Layer

**Účel:** Odpovedať na otázku *"Ako si firma stojí v základnej digitálnej intenzite v porovnaní s rámcom EÚ?"*

**Základ:** Digital Intensity Index (DII) je kompozitný indikátor Eurostatu (dataset `isoc_e_dii`, prieskum ICT usage in enterprises), ktorý meria digitálnu intenzitu podnikov na základe 12 premenných. Metodika je ukotvená na **DII verziu 3 (prieskum 2025)** — najnovšiu publikovanú sadu premenných:

| # | DII premenná (v3, prieskum 2025) | Kategória |
|---|----------------------------------|-----------|
| 1 | Viac ako 50 % zamestnancov používa internet na pracovné účely | Konektivita / Ľudia |
| 2 | Najrýchlejšie pevné pripojenie ≥ 30 Mbps | Konektivita |
| 3 | Firma má webovú stránku | Online prítomnosť |
| 4 | Využívanie sociálnych médií | Online prítomnosť |
| 5 | Nákup cloud computing služieb | Cloud |
| 6 | Nákup sofistikovaných/stredne pokročilých cloud služieb | Cloud |
| 7 | ERP softvér | Systémy |
| 8 | CRM softvér | Systémy |
| 9 | Dátová analytika (vlastnými zamestnancami alebo externe) | Dáta |
| 10 | E-commerce predaje ≥ 1 % obratu | E-commerce |
| 11 | Web predaje > 1 % obratu a B2C web predaje > 10 % web predajov | E-commerce |
| 12 | Využívanie akejkoľvek AI technológie | AI |

> **Rotácia verzií DII:** Eurostat strieda sady premenných podľa dvojročnej rotácie modulov dotazníka — prieskum 2024 používal verziu 4 (ICT bezpečnosť, ICT špecialisti, remote access...), prieskum 2025 verziu 3 (7 z 12 premenných sa líši). Medziročné porovnania naprieč verziami preto **nie sú priamo porovnateľné** a benchmark dáta aj otázky musia byť ukotvené na jednu verziu a prieskumný rok (tu: v3/2025). Otázky metodiky, ktoré pokrývajú premenné mimo v3 (napr. e-fakturácia, remote access), zostávajú v ODRM vrstve — do DII skóre sa nezapočítavajú ako samostatné oficiálne indikátory.

**Aktuálne referenčné hodnoty (Eurostat, prieskum 2025):** aspoň základnú digitálnu intenzitu (DII ≥ 4) dosahuje 72,1 % podnikov EÚ-27 vs. **58,4 % podnikov SR**; pre SME (10–249 zam.) je to 71,4 % EÚ vs. **57,1 % SR** — pri cieli Digitálnej dekády 90 % do roku 2030.

**DII škála (Eurostat):**
- 0–3 body: Veľmi nízka digitálna intenzita
- 4–6 bodov: Nízka digitálna intenzita
- 7–9 bodov: Vysoká digitálna intenzita
- 10–12 bodov: Veľmi vysoká digitálna intenzita

**Naša implementácia:**
- Mapujeme každý DII indikátor na 1+ otázku v dotazníku.
- Výsledok je **DII-Compatible Score (0–100)** s prepočtom na pôvodnú škálu 0–12.
- DII skóre je **oddeliteľné** od zvyšku metodiky — dá sa zobraziť a interpretovať samostatne.

**Prečo nie priamy DII?**
DII je binárny (áno/nie pre každý indikátor). Pre produktovú diagnostiku potrebujeme granulárnejšie meranie. Preto:
- Binárne DII indikátory mapujeme na škálu 0–100 s medzistupňami.
- Pridávame kontext (napr. nie len "má cloud", ale "aký typ cloud a ako ho využíva").
- Zachovávame spätnú kompatibilitu — vieme odvodiť aj čistý binárny DII.

**Trade-off:** Granularizácia DII znamená, že naše skóre nie je priamo porovnateľné s Eurostat číslami, ale je informatívnejšie. Prepočet na 0–12 je aproximácia s jasným disclaimerom.

### 2.2 Vrstva 2: Operational Digital Readiness Model (ODRM)

**Účel:** Odpovedať na otázku *"Je firma digitálne prevádzkovo zrelá, alebo len používa pár nástrojov bez reálnej kontroly a dopadu?"*

**Prečo?** DII meria adopciu nástrojov, ale ignoruje:
- či sú procesy reálne digitalizované alebo len "toolovaný chaos",
- kvalitu integrácie medzi systémami,
- technologický dlh a bezpečnostné riziká,
- schopnosť firmy reálne exekuovať digitalizačné projekty.

**ODRM sa skladá zo 6 kategórií (A–F),** kde každá meria inú dimenziu prevádzkovej digitálnej zrelosti.

---

## 3. Šesť kategórií ODRM

### Kategória A: Procesy a miera digitalizácie práce (váha: 20 %)

**Čo meriame:** Mieru, do akej sú reálne pracovné procesy digitalizované — nie len či firma "má systém", ale či ním naozaj pracuje.

**Dimenzie:**
- Miera manuálnej/papierovej práce
- Ručný prepis medzi systémami (double data entry)
- E-mailové schvaľovanie vs. workflow engine
- Duplicitné dáta a procesy
- Miera automatizácie kľúčových procesov (fakturácia, objednávky, HR onboarding, sklad, servis, reporting)

**Maturity škála:**
| Level | Popis |
|-------|-------|
| 0 — Ad hoc | Prevažne papier, Excel, e-mail. Žiadna štandardizácia. |
| 1 — Čiastočná digitalizácia | Niektoré procesy v systéme, ale veľa ručných krokov. |
| 2 — Štandardizované | Väčšina procesov v systémoch, existujú definované workflow. |
| 3 — Automatizované | Automatické workflow, minimálny ručný zásah, merateľné KPI. |
| 4 — Optimalizované | Kontinuálne zlepšovanie procesov na základe dát, prediktívne riadenie. |

**Rozhodnutie a trade-off:**
- *Prečo 5-stupňová škála?* CMM-inšpirovaný model je dobre pochopiteľný a dostatočne granulárny pre SME segment. 3-stupňová by bola príliš hrubá, 7-stupňová zbytočne komplikovaná pre cieľovú skupinu.
- *Alternatíva:* Percentuálna miera pre každý proces. Nevhodné pre MVP — vyžadovalo by detailné procesné mapovanie.

### Kategória B: Aplikácie, systémy a integrácie (váha: 20 %)

**Čo meriame:** Ekosystém aplikácií, ich prepojenosť a to, či existuje "source of truth".

**Dimenzie:**
- Počet a typ používaných systémov (ERP, CRM, HR, účtovníctvo...)
- Kritickosť systémov
- Úroveň integrácie (API, middleware vs. CSV export/import)
- Source of truth — existuje? Je definovaný?
- Master data ownership
- CSV/export-import chaos vs. real-time integrácia
- Dvojitý zápis (rovnaký údaj sa zadáva do viacerých systémov)

**Maturity škála:**
| Level | Popis |
|-------|-------|
| 0 — Izolované | Systémy neintegrované. CSV/copy-paste medzi nimi. |
| 1 — Bodové prepojenia | Niektoré systémy prepojené, ale ad hoc, bez governance. |
| 2 — Definovaná architektúra | Jasný source of truth, väčšina systémov prepojených. |
| 3 — Integrovaná platforma | Centrálna integračná vrstva, master data management. |
| 4 — Riadený ekosystém | API-first prístup, monitoring integrácie, verzované kontrakty. |

**Rozhodnutie:**
- Integrácia je kľúčová dimenzia, pretože SME často majú systémy ale bez prepojenia — to vytvára ilúziu digitalizácie.

### Kategória C: Dáta, reporting a rozhodovanie (váha: 15 %)

**Čo meriame:** Schopnosť firmy používať dáta pre rozhodovanie.

**Dimenzie:**
- Dostupnosť reportingu
- Miera automatizácie reportov
- Dashboardy a BI
- Kvalita a konzistencia dát
- Rozhodovanie na základe dát vs. intuície
- Data analytics kapabilita

**Maturity škála:**
| Level | Popis |
|-------|-------|
| 0 — Žiadne dáta | Rozhodnutia na základe intuície. Reporty neexistujú alebo sú manuálne. |
| 1 — Základné reporty | Existujú reporty, ale manuálne (Excel). Žiadna konzistencia. |
| 2 — Automatizované reporty | Reporty sa generujú automaticky z dát. Existujú dashboardy. |
| 3 — Data-driven | BI nástroje, KPI monitoring, dáta ako základ rozhodovania. |
| 4 — Prediktívne | Pokročilá analytika, prediktívne modely, dáta ako konkurenčná výhoda. |

**Trade-off:**
- *Prečo nižšia váha (15 %)?* Pre väčšinu SME je reporting dôsledok dobrých procesov a systémov, nie samostatný pilier. Pre MVP stačí merať reporting readiness, nie hĺbku BI.

### Kategória D: Infraštruktúra, pracovné prostredie a cloud (váha: 15 %)

**Čo meriame:** Technologický základ, na ktorom firma stojí.

**Dimenzie:**
- Internet konektivita (rýchlosť, redundancia)
- Zariadenia (vek, správa, životný cyklus)
- Remote access a hybridná práca
- On-prem vs. hybrid vs. cloud
- Cloud maturity (IaaS/PaaS/SaaS, governance)
- Lifecycle serverov a staníc
- Support status kritického softvéru

**Maturity škála:**
| Level | Popis |
|-------|-------|
| 0 — Zastaralé | Stará infraštruktúra, žiadna správa, žiadny remote access. |
| 1 — Základné | Funkčná infraštruktúra, ale žiadna stratégia. Reaktívna údržba. |
| 2 — Spravované | Definovaný lifecycle, basic cloud, remote access funguje. |
| 3 — Cloud-ready | Hybridný/cloud model, automatizovaná správa, monitoring. |
| 4 — Cloud-native | Plne cloud-native alebo optimalizovaný hybrid, IaC, DevOps. |

### Kategória E: Kyberbezpečnosť, kontinuita a technologický dlh (váha: 20 %)

**Čo meriame:** Bezpečnostnú pozíciu firmy a mieru technologického dlhu. **Toto je first-class kategória s penalizačnou logikou.**

**Dimenzie:**
- Out-of-support systémy (OS, databázy, aplikácie)
- Patch management
- Asset inventory (viem čo mám?)
- MFA (multi-factor authentication)
- Zálohy — existencia, off-site separácia, testovanie obnovy
- RPO/RTO definícia a testovanie
- Risk assessment
- Logovanie a monitoring
- Single point of failure
- BC/DR pripravenosť (Business Continuity / Disaster Recovery)

**Maturity škála:**
| Level | Popis |
|-------|-------|
| 0 — Kritické riziko | Out-of-support systémy, žiadne zálohy, žiadna bezpečnostná politika. |
| 1 — Reaktívne | Základné zálohy, ale netestované. Žiadne MFA. Patch management ad hoc. |
| 2 — Základná hygiena | MFA na kritických systémoch, testované zálohy, basic monitoring. |
| 3 — Proaktívne | Risk assessment, BC plán, pravidelný patching, incident response. |
| 4 — Robustné | Automatizovaný patching, monitored SOC/SIEM, testovaný DR, zero trust princípy. |

**Penalizačná logika:**
Kategória E má **špeciálnu penalizačnú mechaniku** — kritické bezpečnostné nedostatky generujú tvrdú penalizáciu v Technical Debt & Risk Index a zároveň znižujú celkový Operational Readiness Score. Detaily v SCORING_SPEC.md.

**Rozhodnutie:**
- *Prečo rovnaká váha ako Procesy (20 %)?* Pretože bezpečnostný a technologický dlh je systematicky podhodnocovaný v SME segmente a jeho zanedbanie má asymetrický dopad — jediný incident môže vymazať prínosy digitalizácie za roky. Váhu podporuje aj regulačný kontext: NIS2 (v SR transponovaná zákonom č. 366/2024 Z. z., účinným od 1. 1. 2025, s vyhláškou NBÚ č. 227/2025 Z. z.) rozširuje bezpečnostné povinnosti na tisíce stredných firiem. Firma s pekným CRM, ale neaktualizovaným serverom, je ticking time bomb.
- *Alternatíva:* Ešte vyššia váha (25 %). Pre MVP zachovávame 20 % s tým, že Risk Index je separátny output.

### Kategória F: Governance, ľudia a execution schopnosť (váha: 10 %)

**Čo meriame:** Či firma má schopnosť digitalizáciu nielen chcieť, ale aj reálne realizovať.

**Dimenzie:**
- Vlastníctvo digitalizácie (kto je zodpovedný?)
- Vlastníctvo procesov (kto vlastní ktorý proces?)
- Existencia roadmapy / stratégie
- Rozpočet na digitalizáciu
- Skill gap
- Change readiness
- Interné kapacity vs. závislosť na externých dodávateľoch
- Schopnosť doručiť digitalizačný projekt bez chaosu

**Maturity škála:**
| Level | Popis |
|-------|-------|
| 0 — Žiadna governance | Nikto nezodpovedá, žiadna stratégia, žiadny rozpočet. |
| 1 — Reaktívna | Digitalizácia na ad hoc báze, keď "treba". Žiadna roadmapa. |
| 2 — Definovaná | Existuje zodpovedná osoba, základný rozpočet, plán na 12 mesiacov. |
| 3 — Riadená | Roadmapa, governance board, merateľné KPI, pravidelné review. |
| 4 — Strategická | Digitalizácia je súčasť business stratégie, kontinuálne investície. |

**Trade-off:**
- *Prečo najnižšia váha (10 %)?* Pre SME je execution capability dôležitá, ale nemeriame ju priamo — prejavuje sa v kvalite ostatných kategórií. Pre MVP je 10 % dostatočných na identifikáciu blokerov.
- *Pre budúcnosť:* Zvýšiť na 15 % keď pridáme detailnejšie otázky na execution history.

---

## 4. Vzťah medzi DII a ODRM

```
┌─────────────────────────────────────────────────┐
│                  VÝSLEDOK                        │
├────────────────────┬────────────────────────────┤
│  DII-Compatible    │  Operational Readiness     │
│  Score (0-100)     │  Score (0-100)             │
│                    │                            │
│  = Adopcia         │  = Reálna zrelosť          │
│    nástrojov a     │    procesov, systémov,     │
│    technológií     │    bezpečnosti a           │
│                    │    governance              │
├────────────────────┴────────────────────────────┤
│  Technical Debt & Risk Index (0-100)            │
│  = Samostatný penalizačný index                 │
├─────────────────────────────────────────────────┤
│  Business Impact Potential                      │
│  = Transparentný odhad dopadu                   │
└─────────────────────────────────────────────────┘
```

**Kľúčový insight:** Firma môže mať vysoký DII (veľa nástrojov) ale nízky ODRM (chaos v procesoch). Alebo nízky DII (málo nástrojov) ale slušný ODRM (dobre organizovaná, ale manuálna). Tieto dva pohľady spolu tvoria kompletný obraz.

---

## 5. Scoring logika — prehľad

Detailný popis je v `SCORING_SPEC.md`. Tu je prehľad:

### 5.1 DII-Compatible Score (0–100)

- Mapuje 12 DII premenných (v3/2025) na otázky.
- Každý indikátor sa hodnotí 0–100 (nie binárne); indikátory majú **rovnaké váhy** (zhodne s Eurostatom, kde každá premenná = 1 bod).
- Výsledné skóre = priemer indikátorov; prepočet na 0–12: `dii_12 = round(score_100 / 100 * 12)`.
- ⚠️ *MVP aproximácia:* implementácia zatiaľ priemeruje odpovede označené `dii` bez per-indikátorovej agregácie (jedna premenná pokrytá viacerými otázkami má vyššiu váhu) — per-indikátorové mapovanie `DII1–DII12` je v checkliste vylepšení. Prepočet `dii_12` je granulárna aproximácia, nie binárny Eurostat count; do benchmark porovnaní preto vstupuje s disclaimerom (viď 9.4).

### 5.1b Spracovanie odpovede „Neviem" a preskočených otázok

- Odpovede „Neviem" a otázky preskočené vetvením sa **vylučujú z menovateľa** kategórie (neskórujú sa ako 0).
- Vysoký podiel nezodpovedaných otázok znižuje confidence rating kategórie (prah 25 % → medium, 50 % → low).
- Bezpečnostná penalizácia ORS sa aplikuje **len ak je kategória E reálne meraná** (aspoň 1 zodpovedaná otázka).
- Risk index (TDRI) ignoruje „Neviem"/preskočené odpovede v odvodzovaní čiastočných rizík — neznalosť sa neinterpretuje ako potvrdené riziko, znižuje však confidence.

### 5.2 Operational Readiness Score (0–100)

- Vyhodnocuje 6 kategórií A–F.
- Každá kategória má skóre 0–100 na základe odpovedí.
- Celkové skóre = vážený priemer:
  - A: 20 %, B: 20 %, C: 15 %, D: 15 %, E: 20 %, F: 10 %
- Váhy sú konfigurovateľné v datastructure.

### 5.3 Technical Debt & Risk Index (0–100, vyššie = horšie)

- **Samostatný** index — nesmie byť rozpustený v celkovom skóre.
- Penalizuje: out-of-support systémy, chýbajúce zálohy, žiadny patch management, absencia MFA, single point of failure, nezdokumentované systémy, závislosť na jednom človeku.
- Každý risk faktor má severity weight.
- Index sa počíta ako suma penalizácií, normalizovaná na 0–100.

### 5.4 AI & Automatizácia Readiness Index (0–100)

**Účel:** Digitalizácia, automatizácia a nasadzovanie AI sú pre platformu prioritnou témou — namiesto zaradenia AI ako podkategórie jednej z 6 ODRM oblastí je preto **samostatným prierezovým výstupom**, architektonicky rovnakým ako Technical Debt & Risk Index (5.3): nezávislý index počítaný z otázok naprieč viacerými kategóriami, nie jedna zo 6 kategórií v radare.

**Prečo nie 7. kategória ODRM?** Pridanie novej kategórie by si vyžiadalo prerozdelenie váh existujúcich 6 kategórií, novú os v radarovom grafe a nový benchmark bez akejkoľvek Eurostat opory (na rozdiel od DII, kde je AI oficiálny indikátor #11). Prierezový index dáva AI plnú viditeľnosť (vlastná karta vo výsledkoch, vlastné odporúčania) bez oslabenia už zavedenej a s Eurostatom zosúladenej 6-osovej štruktúry.

**Vstupné otázky** (označené `ai_readiness` v `maps_to_score`):
- Indikatívny kvíz: `ind_15_ai` — využívanie AI nástrojov (zároveň oficiálny DII indikátor #11).
- Komplexný kvíz: `cx_DII03` (využívanie AI), `cx_A06_ai_automation` (AI vs. pravidlová automatizácia procesov, kategória A), `cx_F07_ai_governance` (AI politika a zodpovednosť, kategória F).

**Výpočet:** vážený priemer skóre zodpovedaných `ai_readiness` otázok (rovnaká logika ako kategóriové skóre v ORS). Nezmeraný stav (žiadna zodpovedaná otázka) vracia `null`, nie 0 — neznalosť sa nezobrazuje ako "žiadne využitie AI".

**Pásma:**
| Skóre | Úroveň |
|-------|--------|
| 0–25 | Bez využitia AI |
| 26–55 | Experimentálne využitie AI |
| 56–80 | Pokročilé využitie AI |
| 81–100 | AI ako súčasť stratégie |

### 5.4 Business Impact Potential

- Odhaduje: ušetrené hodiny/MD/€ ročne, redukciu rizika, opportunity gap.
- Vstupné premenné: počet ľudí, frekvencia procesu, čas na prípad, podiel automatizovateľnosti, hodinová cena.
- Výstup je **interval** s confidence level, nie presné číslo.

---

## 6. ROI logika — prehľad

Detailný popis je v `ROI_MODEL.md`. Tu je prehľad:

### 6.1 Základný výpočet

```
ročná_strata_hodín = frekvencia_ročne × čas_na_prípad × podiel_automatizovateľnosti
ušetrené_MD = ušetrené_hodiny / 8
ročný_€_dopad = ušetrené_hodiny × plná_hodinová_cena
```

### 6.2 Transparentnosť

- Ak nemáme vstupné dáta → používame benchmark s disclaimerom.
- Výstup obsahuje: konzervatívny odhad, stredný odhad, hrubý potenciál.
- Risk-adjusted faktor zohľadňuje neistotu.
- Pri každom čísle je jasné, z čoho vzniklo.

### 6.3 Hodinová cena práce — vždy benchmark, nie otázka

Dotazník sa **nepýta** na hodinovú cenu práce vo firme — je to citlivý údaj, respondenti ho odhadujú nepresne, a v praxi spôsoboval nekonzistenciu (indikatívny a komplexný kvíz sa pýtali na odlišne definovanú cenu — hrubú vs. plnú). Namiesto toho ROI model vždy počíta s **priemernou plnou hodinovou cenou práce na Slovensku** (Eurostat `lc_lci_lev`, aktuálne 19,8 €/h — pozri `ROI_MODEL.md` §7). Toto je vedomý trade-off: nižšia presnosť pre firmy s výrazne pod-/nadpriemernými mzdami výmenou za vyššiu completion rate a jednoduchší, dôveryhodnejší dotazník.

---

## 7. Adaptivita dotazníka

### 7.1 Dva režimy

1. **Indikatívny kvíz** (15 otázok): Rýchly screening. Výsledok = orientačné skóre + rozhodnutie či pokračovať.
2. **Komplexný kvíz** (47 otázok v banke, reálne 43–47 podľa vetvenia): Hlbšia diagnostika rozdelená do modulov.

### 7.2 Branching princípy

Otázkový strom, nie fixný formulár. Povinné branching pravidlá:

| Podmienka | Akcia |
|-----------|-------|
| Firma používa iba 1 systém | Preskočiť detailné otázky o integráciách |
| Používa on-prem server | Rozviniť otázky na vek, support, patching, virtualizáciu |
| Je cloud-only | Rozviniť SaaS governance, identity, vendor lock-in |
| Nemá dokumentované security postupy | Rozviniť security modul |
| Nemá reporting | Nerozvíjať BI detaily, pýtať sa na readiness |
| Nemá e-commerce | Preskočiť online sales otázky |
| Outsourcuje IT | Pýtať sa na SLA, ownership, escalation |

### 7.3 Typy otázok

- Single choice, Multi select, Yes/No, Numeric input
- Maturity scale (5-bodová)
- Conditional matrix
- Confidence / "Neviem" (vždy dostupné)

---

## 8. Benchmark layer — prehľad

Detailný popis je v `BENCHMARK_SPEC.md`. Tu je prehľad:

### 8.1 Zdroj benchmarkov

- **Eurostat `isoc_e_dii`** (ICT usage in enterprises) — DII distribúcia SK/EÚ-27, prieskum 2025 (DII v3). Pozn.: DESI ako samostatný index bol od r. 2023 začlenený do reportingu Digitálnej dekády — správne označenie zdroja je Eurostat dataset, nie „DESI".
- **Digital Decade Country Report 2026 — Slovensko** (DESI 2026, dátový rok 2025) — kontextové KPI (cloud, AI, dátová analytika).
- Sektorové a veľkostné mediány — expertné odhady (explicitne označené).
- Vlastné agregované dáta (v budúcnosti).

**Politika aktualizácie:** benchmark dataset sa obnovuje ročne, do 3 mesiacov od decembrovej publikácie Eurostat prieskumu; verzia datasetu (napr. `2025-DII-v3`) je súčasťou každého výsledku.

### 8.2 Čo benchmarkujeme

- DII skóre firmy vs. priemer EU / SK / sektor.
- Operačnú zrelosť po kategóriách.
- Risk index vs. typická firma rovnakej veľkosti.

### 8.3 MVP disclaimer

Pre MVP používame **statické benchmark hodnoty** odvodené z verejných Eurostat dát. Tieto sú verzované a explicitne označené ako približné.

---

## 9. Otvorené metodické riziká a dilemy

### 9.1 Presnosť self-reportovaných dát

**Riziko:** Respondent nevie alebo nesprávne odpovedá (napr. tvrdí že má MFA, ale nemá ho na všetkých systémoch).

**Mitigácia pre MVP:** 
- "Neviem" opcia pri každej otázke.
- Evidence hints (čo presne myslíme, príklady).
- Confidence scoring v ROI modeli.

**Pre budúcnosť:** Verifikačné otázky, technický audit plugin.

### 9.2 Váhy kategórií

**Dilema:** Default váhy (20/20/15/15/20/10) sú expertným odhadom. Rôzne sektory a veľkosti firiem by mohli mať rôzne optimálne váhy.

**Rozhodnutie pre MVP:** Fixné default váhy v konfigurácii. Konfigurovateľné pre admin.

**Pre budúcnosť:** Sektorové profily váh, machine learning optimalizácia na základe zhromaždených dát.

### 9.3 Granularita vs. záťaž respondenta

**Dilema:** Viac otázok = presnejšie meranie, ale nižšia completion rate.

**Rozhodnutie:** 
- Indikatívny kvíz (15 otázok) = nízka záťaž, nižšia presnosť.
- Komplexný kvíz (43–47 otázok) = vyššia záťaž, vyššia presnosť.
- Branching znižuje reálny počet otázok.

### 9.4 DII mapovanie nie je 1:1

**Riziko:** Naše granularizované DII otázky produkujú skóre, ktoré nie je priamo porovnateľné s oficiálnymi Eurostat číslami.

**Mitigácia:** 
- Jasný disclaimer pri DII skóre.
- Odvoditeľný binárny DII pre presné porovnanie.
- Granulárne skóre označené ako "DII-kompatibilné", nie "DII".

### 9.5 ROI presnosť

**Riziko:** Bez detailných vstupných dát je ROI odhad veľmi hrubý.

**Mitigácia:**
- Interval miesto presného čísla.
- Scenáre (konzervatívny/stredný/optimistický).
- Confidence level.
- Jasný disclaimer čo je benchmark a čo self-reported.

### 9.6 AI pripravenosť a regulačný kontext (2026)

**Medzera:** AI je v modeli zachytená len ako DII premenná č. 12. ODRM nemá samostatnú AI dimenziu (data readiness pre AI, governance AI use-casov, AI zručnosti) — pritom adopcia AI je od 2025 najrýchlejšie rastúca os digitalizácie (EÚ 20,0 % podnikov, SR 18,0 %, medziročne +67 %; cieľ Digitálnej dekády 75 % do 2030).

**Plán:** rozšíriť kategórie C (data readiness pre AI) a F (AI governance/zručnosti) o dimenzie AI pripravenosti; zvážiť samostatnú kategóriu G po pilotnej validácii.

**Regulačné časové okná relevantné pre odporúčania:**
- **NIS2 / zákon č. 366/2024 Z. z.** — účinný od 1. 1. 2025 (bezpečnostné opatrenia do 12 mesiacov od registrácie NBÚ; vyhláška č. 227/2025 Z. z. od 1. 9. 2025).
- **Povinná elektronická B2B fakturácia v SR** — od 1. 1. 2027 (novela zákona o DPH, Peppol model, EN 16931); rozšírenie na cezhraničné transakcie (ViDA) od 1. 7. 2030.
- **AI Act** — povinnosti nabiehajú postupne 2025–2027 (transparentnosť, vysokorizikové systémy).

### 9.7 Malá vs. stredná firma

**Dilema:** 5-osobová firma a 200-osobová firma majú fundamentálne iné digitalizačné výzvy.

**Rozhodnutie pre MVP:** Veľkosť firmy je vstupná premenná, ktorá ovplyvňuje branching a benchmark porovnanie. Scoring logika je rovnaká.

**Pre budúcnosť:** Sektorové a veľkostné normalizačné tabuľky.

---

## 10. Čo je hotové, čo je aproximácia, čo zostáva otvorené

### Hotové pre MVP
- ✅ Dvojvrstvový model (DII + ODRM)
- ✅ 6 kategórií s definíciou a maturity škálou
- ✅ 4 výstupné skóre (DII, ODRM, Risk Index, Business Impact)
- ✅ Default váhy
- ✅ Princípy branching logiky
- ✅ Princípy ROI modelu

### Aproximácie
- ⚠️ Váhy kategórií sú expertný odhad, nie empiricky validované (chýba sensitivity analýza — viď checklist)
- ⚠️ DII mapovanie je aproximácia originálneho Eurostat modelu; MVP navyše priemeruje otázky bez per-indikátorovej agregácie (DII1–DII12)
- ⚠️ Benchmark hodnoty sú statické (Eurostat isoc_e_dii 2025 + expertné odhady), verzované, s ročnou aktualizačnou politikou
- ⚠️ ROI model používa zjednodušené predpoklady (bez investičných nákladov a adopčnej krivky; výstup = ročný run-rate po plnej implementácii); hodinová cena práce je vždy fixný priemer SR, nie self-reported hodnota (viď 6.3)
- ⚠️ Niektoré otázky mapujú súčasne DII aj ODRM vrstvu — prekryv vrstiev zatiaľ nie je zdokumentovaný per otázka (riziko korelácie vrstiev „by construction")

### Otvorené pre budúcnosť
- ❓ Sektorové normalizačné profily
- ❓ Empirická validácia váh
- ❓ Dynamické benchmarky z vlastných dát
- ❓ Verifikačné mechanizmy pre self-reported dáta
- ❓ Detailnejší ROI model pre špecifické procesy
