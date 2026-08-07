# digitalizuj.to — Digitálna auditná platforma

**Metodika merania digitálnej zrelosti SME — Adaptívny model DAP**

> **Platí pre:** otázková banka `1.8` · scoring config `1.5` · benchmark dáta `2025-DII-v3` · overené 2026-08-07
>
> Dokument nemá vlastné číslo verzie — má ho model, ktorý opisuje.
> Zhodu pečiatky so zdrojmi kontroluje build (`validate-model.mjs` #16),
> takže revízia modelu bez prečítania dokumentácie zhodí build.
> História zmien modelu: [`MODEL_VERSIONS.md`](MODEL_VERSIONS.md).
> Status: Implementované — release 1.0.0  
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

- Mapuje 12 DII premenných (v3/2025) na otázky — **per-indikátorovo** cez `data/diiIndicators.json` (kritériá s odôvodnenými prahmi, audit trail v `DIIScore.indicators`).
- Každý indikátor je meraný (aspoň 1 platná kritériová odpoveď) a splnený/nesplnený podľa kritérií; `dii_12 = round(splnené / merané × 12)` je **extrapolácia** so zverejneným pokrytím (komplexný kvíz 10/12, indikatívny 8/12; nepokryté: DII1, DII11).
- Nemerané DII (nula meraných indikátorov) je explicitné N/A, nie skóre 0; jemná metrika `score_100` je priemer platných odpovedí namapovaných otázok.
- Otázky s `dii` tagom mimo v3 zoznamu (security, e-fakturácia, remote access, skills, ICT špecialisti, invoicing) sú **striktne vylúčené** z DII s dôvodom v mapovaní — v súlade s poznámkou o rotácii verzií vyššie.
- ⚠️ `dii_12` je extrapolovaný odhad, nie binárny Eurostat count z plného dotazníka — do benchmark porovnaní vstupuje s disclaimerom (viď 9.4) a UI priznáva „odhad z N/12 meraných indikátorov".

### 5.1b Spracovanie odpovede „Neviem" a preskočených otázok

- Odpovede „Neviem" a otázky preskočené vetvením sa **vylučujú z menovateľa** kategórie (neskórujú sa ako 0).
- Kategória bez jedinej platnej odpovede je **nemeraná (N/A)**: `score = null` a jej váha sa do ORS nezapočítava — celkové ORS je vážený priemer **len meraných kategórií** (renormalizácia menovateľa váh). Nemerané teda nie je nula a neexistuje fantómový strop skóre.
- Vysoký podiel nezodpovedaných otázok znižuje confidence rating kategórie (prah 25 % → medium, 50 % → low).
- Bezpečnostná penalizácia ORS sa aplikuje **len ak je kategória E reálne meraná** (aspoň 1 zodpovedaná otázka).
- Rovnaká sémantika platí pre DII (indikátor bez platnej kritériovej odpovede = nemeraný) aj pre odporúčania (`recommendationEngine` nespúšťa pravidlá nad nemeranými kategóriami).
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

Dotazník sa **nepýta** na hodinovú cenu práce vo firme — je to citlivý údaj, respondenti ho odhadujú nepresne, a v praxi spôsoboval nekonzistenciu (indikatívny a komplexný kvíz sa pýtali na odlišne definovanú cenu — hrubú vs. plnú). Namiesto toho ROI model vždy počíta s **priemernou plnou hodinovou cenou práce v IT/telekomunikačnom sektore na Slovensku** (Eurostat `lc_lci_lev`, NACE J, aktuálne 30,8 €/h — pozri `ROI_MODEL.md` §7). IT sektor namiesto celého hospodárstva preto, že procesy, ktoré platforma pomáha automatizovať, typicky rieši alebo zastrešuje IT/technický tím. Toto je vedomý trade-off: nižšia presnosť pre firmy s výrazne pod-/nadpriemernými mzdami výmenou za vyššiu completion rate a jednoduchší, dôveryhodnejší dotazník.

---

## 7. Adaptivita dotazníka

### 7.1 Dva režimy

1. **Indikatívny kvíz** (19 otázok): Rýchly screening. Výsledok = orientačné skóre + rozhodnutie či pokračovať.
2. **Komplexný kvíz** (58 otázok v banke, reálne 50–58 podľa vetvenia): Hlbšia diagnostika rozdelená do modulov.

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

### 8.3 Disclaimer k benchmark dátam

Používame **statické benchmark hodnoty** odvodené z verejných Eurostat dát. Tieto sú verzované a explicitne označené ako približné.

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
- Indikatívny kvíz (19 otázok) = nízka záťaž, nižšia presnosť.
- Komplexný kvíz (50–58 otázok) = vyššia záťaž, vyššia presnosť.
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

**Pôvodná medzera (vyriešená v 1.0.0):** AI bola v modeli zachytená len ako DII premenná č. 12, bez samostatnej dimenzie v ODRM — pritom adopcia AI je od 2025 najrýchlejšie rastúca os digitalizácie (EÚ 20,0 % podnikov, SR 18,0 %, medziročne +67 %; cieľ Digitálnej dekády 75 % do 2030).

**Riešenie:** namiesto rozšírenia kategórií C/F alebo pridania 7. kategórie (čo by si vyžiadalo prerozdelenie váh a nový, Eurostatom nepodložený benchmark) pribudol **AI & Automatizácia Readiness Index** — samostatný prierezový výstup rovnakej architektúry ako Technical Debt & Risk Index (§5.4). Počíta sa z otázok naprieč kategóriami A (automatizácia procesov), F (AI governance) a DII vrstvou (využívanie AI), má vlastnú kartu vo výsledkoch aj vlastné odporúčania. 6-osový ODRM radar a Eurostat DII benchmark zostali nezmenené.

**Regulačné časové okná relevantné pre odporúčania:**
- **NIS2 / zákon č. 366/2024 Z. z.** — účinný od 1. 1. 2025 (bezpečnostné opatrenia do 12 mesiacov od registrácie NBÚ; vyhláška č. 227/2025 Z. z. od 1. 9. 2025).
- **Povinná elektronická B2B fakturácia v SR** — od 1. 1. 2027 (novela zákona o DPH, Peppol model, EN 16931); rozšírenie na cezhraničné transakcie (ViDA) od 1. 7. 2030.
- **AI Act** — povinnosti nabiehajú postupne 2025–2027 (transparentnosť, vysokorizikové systémy).

### 9.7 Malá vs. stredná firma

**Dilema:** 5-osobová firma a 200-osobová firma majú fundamentálne iné digitalizačné výzvy.

**Rozhodnutie pre MVP:** Veľkosť firmy je vstupná premenná, ktorá ovplyvňuje branching a benchmark porovnanie. Scoring logika je rovnaká.

**Revízia 7. 8. 2026:** rovnaká scoring logika sa ukázala ako neudržateľná pri
otázkach, ktorých vrchné možnosti opisujú **štruktúru, nie prax** — „dedikovaný
IT tím s viacerými rolami" (`cx_DII04`) alebo „interný IT + externý dodávateľ
s SLA" (`cx_B05`). Päťčlenná firma ich nedosiahne ani pri najlepšom vedení, čiže
tie otázky merali počet zamestnancov. Dostali **veľkostné kotvy**: pre dané
pásmo sa vyhlási najvyššia dosiahnuteľná možnosť a rebríček sa prepočíta tak,
aby znamenala plný počet bodov. Zásah je zámerne úzky — dve otázky, tri
vyhlásené stropy — a oplotený validátorom (#17), aby sa z neho nestala tichá
normalizácia celého modelu. Mechanika a jej priznané slabiny: `SCORING_SPEC.md`
§13; dopad na porovnateľnosť: `MODEL_VERSIONS.md`.

**Pre budúcnosť:** Sektorové a veľkostné normalizačné tabuľky — teda plošná
normalizácia namiesto per-otázkových stropov. Vyžaduje reálne hodnotenia; kým
nie sú, kotvy sú maximum, ktoré sa dá obhájiť bez dát.

---

## 10. Čo je hotové, čo je aproximácia, čo zostáva otvorené

### Hotové pre release 1.0.0
- ✅ Dvojvrstvový model (DII + ODRM)
- ✅ 6 kategórií ODRM s definíciou a maturity škálou
- ✅ 5 nezávislých výstupných skóre (DII, ORS, AI & Automatizácia Readiness, Technical Debt & Risk Index, Business Impact)
- ✅ Default váhy
- ✅ Branching logika (`skip`/`flag_risk`; `include` je v aktuálnej verzii enginu no-op a v otázkovej banke sa nepoužíva — podmienená viditeľnosť sa autoruje cez invertované `skip` páry, viď `QUESTION_BANK_GUIDE.md` §5.2)
- ✅ ROI model s fixnou benchmarkovou hodinovou cenou práce

### Aproximácie
- ⚠️ Váhy kategórií sú expertný odhad, nie empiricky validované (chýba sensitivity analýza — viď checklist)
- ⚠️ DII mapovanie je aproximácia originálneho Eurostat modelu; per-indikátorová agregácia (DII1–DII12, `data/diiIndicators.json`) extrapoluje z meraných indikátorov — pokrytie je čiastočné (10/12 komplexný, 8/12 indikatívny) a dva indikatívne riadky sú priznané proxy
- ⚠️ Benchmark hodnoty sú statické (Eurostat isoc_e_dii 2025 + expertné odhady), verzované, s ročnou aktualizačnou politikou
- ⚠️ ROI model používa zjednodušené predpoklady (bez investičných nákladov a adopčnej krivky; výstup = ročný run-rate po plnej implementácii); hodinová cena práce je vždy fixný priemer IT sektora SR, nie self-reported hodnota (viď 6.3)
- ⚠️ Niektoré otázky mapujú súčasne DII aj ODRM vrstvu — prekryv vrstiev zatiaľ nie je zdokumentovaný per otázka (riziko korelácie vrstiev „by construction")

### Otvorené pre budúcnosť
- ❓ Sektorové normalizačné profily
- ❓ Empirická validácia váh
- ❓ Dynamické benchmarky z vlastných dát
- ❓ Verifikačné mechanizmy pre self-reported dáta
- ❓ Detailnejší ROI model pre špecifické procesy

---

## 11. Item mapa — prekryv vrstiev per otázka

Politika prekryvu: **priznaný prekryv** — jedna otázka smie sýtiť DII aj ODRM vrstvu súčasne, ale prekryv je zdokumentovaný nižšie per otázka (odpoveď na aproximáciu „riziko korelácie vrstiev by construction" z §10). DII stĺpec vychádza z `data/diiIndicators.json`; „vylúčená (mimo v3)" = otázka má `dii` tag, ale nezodpovedá žiadnej v3/2025 premennej (striktný v3 režim, dôvod v mapovaní). Otázky `cx_DII02b` a `cx_DII04` majú kategóriu `dii`, takže po vyradení nesýtia žiadne skóre — známy stav, rekategorizácia je DB operácia.

Tabuľka je generovaná zo zdrojov pravdy (questionBank + diiIndicators) — pri zmene modelu ju treba pregenerovať.

| Otázka | Kvíz | Kategória | Vrstvy (maps_to_score) | DII indikátory |
|---|---|---|---|---|
| `ind_01` | indikatívny | meta | benchmark_sector | — |
| `ind_02` | indikatívny | meta | benchmark_size | — |
| `ind_03` | indikatívny | A | ors_A | — |
| `ind_03b` | indikatívny | A | ors_A | — |
| `ind_03c_manual` | indikatívny | A | ors_A | — |
| `ind_04` | indikatívny | A | ors_A, ors_B | — |
| `ind_05` | indikatívny | B | ors_B, dii | DII7, DII8, DII9 |
| `ind_06_integration` | indikatívny | B | ors_B | — |
| `ind_07` | indikatívny | C | ors_C, dii | DII9 |
| `ind_08` | indikatívny | D | ors_D, dii | DII5 |
| `ind_09_server_age` | indikatívny | D | ors_D, ors_E | — |
| `ind_10` | indikatívny | E | ors_E, dii | vylúčená (mimo v3) |
| `ind_11` | indikatívny | E | ors_E | — |
| `ind_11b` | indikatívny | E | ors_E | — |
| `ind_12` | indikatívny | dii | dii | DII3, DII4, DII10 |
| `ind_13` | indikatívny | F | ors_F | — |
| `ind_14` | indikatívny | F | ors_F, ors_E | — |
| `ind_15_ai` | indikatívny | dii | dii, ai_readiness | DII12 |
| `ind_16_intent` | indikatívny | F | — | — |
| `cx_01` | komplexný | meta | benchmark_sector | — |
| `cx_02` | komplexný | meta | benchmark_size | — |
| `cx_03` | komplexný | meta | — | — |
| `cx_04_role` | komplexný | meta | — | — |
| `cx_A01` | komplexný | A | ors_A | — |
| `cx_A02` | komplexný | A | ors_A, dii | vylúčená (mimo v3) |
| `cx_A03` | komplexný | A | ors_A, ors_B | — |
| `cx_A04` | komplexný | A | ors_A | — |
| `cx_A04b` | komplexný | A | ors_A | — |
| `cx_A05` | komplexný | A | ors_A | — |
| `cx_A06_ai_automation` | komplexný | A | ors_A, ai_readiness | — |
| `cx_B01` | komplexný | B | ors_B, dii | DII7, DII8, DII9 |
| `cx_B02` | komplexný | B | — | — |
| `cx_B03` | komplexný | B | ors_B | — |
| `cx_B04` | komplexný | B | ors_B | — |
| `cx_B04b` | komplexný | B | ors_B | — |
| `cx_B05` | komplexný | B | ors_B, ors_F | — |
| `cx_B05b_outsource` | komplexný | B | ors_B | — |
| `cx_B06_ecommerce` | komplexný | B | dii | DII10 |
| `cx_C01` | komplexný | C | ors_C, dii | DII9 |
| `cx_C02` | komplexný | C | ors_C | — |
| `cx_C03` | komplexný | C | ors_C | — |
| `cx_D01` | komplexný | D | ors_D, dii | DII2 |
| `cx_D02` | komplexný | D | ors_D, dii | DII5 |
| `cx_D03_server` | komplexný | D | ors_D, ors_E | — |
| `cx_D04_virtualization` | komplexný | D | ors_D | — |
| `cx_D05_cloud` | komplexný | D | ors_D | — |
| `cx_D06` | komplexný | D | ors_D, dii | vylúčená (mimo v3) |
| `cx_D07` | komplexný | D | ors_D | — |
| `cx_D07b` | komplexný | D | ors_D | — |
| `cx_D08_app_lifecycle` | komplexný | D | ors_D | — |
| `cx_E01` | komplexný | E | ors_E | — |
| `cx_E02` | komplexný | E | ors_E | — |
| `cx_E03` | komplexný | E | ors_E | — |
| `cx_E04` | komplexný | E | ors_E | — |
| `cx_E05` | komplexný | E | ors_E | — |
| `cx_E06` | komplexný | E | ors_E | — |
| `cx_E06b` | komplexný | E | ors_E | — |
| `cx_E07` | komplexný | E | ors_E | — |
| `cx_E09_endpoint` | komplexný | E | ors_E | — |
| `cx_E10_awareness` | komplexný | E | ors_E | — |
| `cx_E08_nis2` | komplexný | E | ors_E | — |
| `cx_F01` | komplexný | F | ors_F | — |
| `cx_F02` | komplexný | F | ors_F | — |
| `cx_F03` | komplexný | F | ors_F | — |
| `cx_F04` | komplexný | F | ors_F, dii | vylúčená (mimo v3) |
| `cx_F05` | komplexný | F | ors_F | — |
| `cx_F06` | komplexný | F | ors_F, ors_E | — |
| `cx_F07_ai_governance` | komplexný | F | ors_F, ai_readiness | — |
| `cx_F07_intent` | komplexný | F | — | — |
| `cx_ROI02` | komplexný | meta | — | — |
| `cx_ROI03` | komplexný | meta | — | — |
| `cx_DII01` | komplexný | dii | dii | DII3 |
| `cx_DII02` | komplexný | dii | dii | DII4 |
| `cx_DII02b` | komplexný | dii | dii | vylúčená (mimo v3) |
| `cx_DII03` | komplexný | dii | dii, ai_readiness | DII12 |
| `cx_DII03b` | komplexný | dii | dii | DII5, DII6 |
| `cx_DII04` | komplexný | dii | dii, ors_F | vylúčená (mimo v3) |



---

## 12. Váhy kategórií — pôvod, citlivosť a protokol revízie

### 12.1 Odkiaľ váhy sú

Váhy A–F (20/20/15/15/20/10 %) sú **expertne stanovené**. Nevznikli z dát,
lebo žiadne neboli — model bol postavený pred prvým hodnotením. Zdôvodnenie
každej váhy je pri príslušnej kategórii vyššie (§ Kategória A–F).

**Čo NIE JE zdokumentované:** ako presne sa k tým číslam dospelo. Neexistuje
záznam o elicitácii — kto sa jej zúčastnil, aké alternatívy sa zvažovali, ako
sa riešili nezhody. Váhy sú teda odôvodnené, ale nie **doložené**. Tento
dokument to priznáva namiesto toho, aby to zakrýval; protokol pre ďalšiu
revíziu je v §12.4.

### 12.2 Ako veľmi na váhach záleží (sensitivity analýza)

Otázka, ktorú si položí každý recenzent metodiky: keď sú váhy expertný odhad,
nerozhodujú o výsledku viac než odpovede?

Merateľné to je. `scripts/weight-sensitivity.mjs` posunie každú váhu o ±5
percentuálnych bodov, zvyšné renormalizuje a prepočíta ORS nad **2 000
deterministickými kombináciami odpovedí** komplexného kvízu:

| Váha | Priem. zmena ORS | Max. zmena | Preklopený maturity level |
|---|---|---|---|
| A (20 %) | 0,68 b | 1,94 b | 5,5–6,0 % |
| B (20 %) | 0,37 b | 1,22 b | 3,2–3,4 % |
| C (15 %) | 0,65 b | 2,22 b | 5,8 % |
| D (15 %) | 0,46 b | 1,58 b | 3,2–3,6 % |
| E (20 %) | 0,86 b | 1,67 b | **7,1–8,0 %** |
| F (10 %) | 0,47 b | 1,76 b | 4,0–4,9 % |

**Záver, ktorý z toho vyplýva — a nie je celkom pohodlný.**

*Skóre je robustné.* Posun ktorejkoľvek váhy o 5 p. b. zmení ORS v priemere
o menej než 1 bod a v najhoršom prípade o 2,2 bodu. Na stupnici 0–100 je to
šum a expertné nastavenie váh je tam prijateľné riziko.

*Nálepka robustná nie je.* Maturity level sa preklopí v **3–8 %** prípadov —
pri kategórii E v jednom z dvanástich. Pritom práve nálepka („Rozvíjajúci sa"
vs. „Pokročilý") je to, čo si respondent zapamätá a zopakuje ďalej, nie číslo.
Najkrehkejší výstup je teda ten najviditeľnejší.

Dôsledok pre interpretáciu: **rozdiel jednej úrovne zrelosti medzi dvoma
firmami nie je spoľahlivý signál.** Rozdiel dvoch úrovní už áno. Platí to
najmä pri firmách blízko prahu (20/40/60/80).

### 12.3 Porovnanie s inými maturity modelmi

Váženie kategórií nie je v tejto triede modelov samozrejmosť — väčšina
zavedených rámcov ho nepoužíva vôbec:

| Rámec | Štruktúra | Váženie |
|---|---|---|
| **CMMI** | 5 úrovní vyspelosti, procesné oblasti | Žiadny vážený priemer — úroveň sa dosahuje splnením kritérií, nie skóre |
| **Acatech Industrie 4.0 Maturity Index** | 6 vývojových stupňov, 4 štrukturálne oblasti | Stupňový postup, nie vážený súčet |
| **IMPULS Industrie 4.0 Readiness** (VDMA) | 6 dimenzií, 6 úrovní pripravenosti | Dimenzie sa agregujú; presnú váhovú schému treba overiť v origináli |
| **DREAMY** | Procesne orientovaný, maturity per proces | Hodnotenie per proces, nie jedno súhrnné skóre |
| **ODRM (tento model)** | 6 kategórií, vážený priemer 0–100 | Explicitné váhy 20/20/15/15/20/10 |

> **Poznámka o presnosti tejto tabuľky.** Štruktúra rámcov je uvedená podľa
> ich všeobecne známeho usporiadania. Konkrétne váhové schémy — najmä pri
> IMPULS — **neboli overené proti primárnym zdrojom**. Kým sa tak nestane,
> tabuľka slúži na orientáciu v type modelu, nie ako citácia. Doplniť
> presné odkazy je súčasťou §12.4.

Podstatný rozdiel: CMMI a Acatech sú **stupňové** — vyššiu úroveň dosiahnete
splnením podmienok, nie priemerom. Vážený priemer, ktorý používame, umožňuje
kompenzáciu: silná oblasť vykryje slabú. Bezpečnostná penalizácia (§3.3) je
čiastočná protiváha práve k tomu, ale len pre kategóriu E.

### 12.4 Protokol pre ďalšiu revíziu váh

Aby ďalšia zmena váh nebola opäť nedoložená:

1. **Zaznamenať vstupy.** Kto sa elicitácie zúčastnil, aká je jeho doména
   a koľko rokov praxe v SME segmente.
2. **Nezávislé priradenie.** Každý účastník rozdelí 100 bodov medzi kategórie
   samostatne, bez videnia ostatných — inak dominuje ten, kto hovorí prvý.
3. **Zaznamenať rozptyl.** Ak sa účastníci na váhe kategórie líšia o viac než
   10 p. b., je to samostatné zistenie, nie šum na spriemerovanie.
4. **Druhé kolo po diskusii.** Klasický Delphi krok: ukázať rozptyl,
   nechať prehodnotiť, znovu zapísať.
5. **Overiť sensitivity znovu.** `npm run weights:sensitivity` a porovnať
   s číslami v §12.2 — ak nová schéma preklápa level častejšie, je horšia
   bez ohľadu na to, ako presvedčivo znie.
6. **Zapísať do `MODEL_VERSIONS.md`** so stupňom porovnateľnosti. Zmena váh
   je **prerušenie** — staré výsledky sa novými váhami neprepočítavajú.

Kým takýto záznam nevznikne, váhy zostávajú tým, čím sú: odôvodneným
expertným odhadom s doloženou citlivosťou.



---

## 13. Reliabilita: čo sa dá zistiť a čo nie

### 13.1 Prahy, ktoré nemali z čoho vzniknúť

Do 7. 8. 2026 niesla konfigurácia šesť pilotných kritérií:

```
cronbachAlphaMin: 0.80 · itemDiscriminationMin: 0.30
completionRateMin: 0.85 · unknownAnswerRateMax: 0.10
orsToCorrelationMin: 0.50 · minPilotSampleSize: 200
```

**Sú zmazané.** Nečítal ich žiadny engine — boli to konštanty, ktoré vyzerali
prevádzkovo, ale nič sa podľa nich nerozhodovalo. Štyri z nich sa navyše
s dnešným úložiskom spočítať nedali a nie je to otázka počtu respondentov:

| Kritérium | Prečo je nedosiahnuteľné |
|---|---|
| `cronbachAlphaMin` | potrebuje odpovede po položkách; `answers_json` je zámerne `NULL` |
| `itemDiscriminationMin` | to isté — item-total korelácia sa bez položiek nedá |
| `unknownAnswerRateMax` | podiel „Neviem" je vlastnosť odpovedí, nie agregátu |
| `completionRateMin` | nedokončené kvízy sa neukladajú, menovateľ neexistuje |

Nahradiť ich novou sadou čísel by bolo premenovanie vady, nie jej odstránenie.
Prah, ktorý nemá z čoho vzniknúť, do konfigurácie nepatrí — je to to isté
pravidlo ako „nezmerané ≠ nula", uplatnené na akceptačné kritériá.

### 13.2 Prečo alfa nesmie byť prijímacím prahom

Cronbachova alfa nie je zakázaná metrika — príručka OECD/JRC ju pri
kompozitných indikátoroch používa ako **diagnostiku**. Neobstojí ako
**prijímací prah**, a to z troch dôvodov, ktoré platia bez ohľadu na dáta.

**1. Alfa rastie s počtom položiek, nie s kvalitou merania.** Spearman-Brownov
vzťah `α = k·r̄ / (1 + (k−1)·r̄)` znamená, že ten istý prah kladie na rôzne
kategórie úplne rôzne nároky:

| Položiek `k` | Aké `r̄` vyžaduje α = 0,80 |
|---|---|
| 1 | nedefinované |
| 3 | 0,571 |
| 5 | 0,444 |
| 13 | 0,235 |

Kategórie tohto modelu sa v `k` líšia rádovo — **C má v komplexnom kvíze
3 položky a v indikatívnom 1, E má 13**. Jednotný prah 0,80 by teda od
kategórie C žiadal viac než dvojnásobne prísnejšiu homogenitu než od E,
a pri indikatívnom kvíze by nebol vôbec definovaný.

**2. Vysoká alfa by tu bola zlá správa.** Kategória E meria MFA, zálohy,
patchovanie, inventár zariadení, monitoring, DR plán, kontinuitu, politiku,
ochranu koncových staníc a školenia. Firma môže mať vynikajúce zálohy a žiadne
MFA. Ak by tie položky navzájom silno korelovali, znamenalo by to, že sa
dotazník pýta na to isté viackrát a mohol by byť kratší — nie že meria presne.

**3. Chýbanie odpovedí nie je náhodné.** Kvíz je adaptívny: osem otázok
vetvením preskakuje ďalšie. Ktoré položky respondentovi chýbajú, je určené
jeho vlastnými odpoveďami (MNAR). Alfa počítaná nad takou maticou je skreslená
spôsobom, ktorý sa nedá odhadnúť bez modelu chýbania.

**Merací model kategórií zostáva otvorenou otázkou.** Vyššie uvedené naznačuje
skôr formatívny index (položky konštrukt spoločne definujú) než reflektívnu
škálu (položky sú zameniteľné prejavy jednej príčiny). Je to **interpretácia,
nie doložený fakt** — model nikdy nebol takto špecifikovaný a rozhodnúť to
znamená empirickú prácu, nie prečítanie dokumentácie.

### 13.3 Čo sa z agregátov spočítať DÁ

`npm run pilot:readiness` počíta nad uloženými výsledkami:

- veľkosť vzorky a jej **rozpad podľa `model_version`**,
- koreláciu **ORS ↔ DII** (konvergentná validita: dve vrstvy majú merať
  príbuznú, nie totožnú vec),
- koreláciu **ORS ↔ TDRI** (očakáva sa záporná — vyššia zrelosť, nižšie riziko),
- **medzikategóriové korelácie** A–F,
- distribúciu NPS.

Medzikategóriové korelácie sú tá najhodnotnejšia časť: odpovedajú na otázku,
či šesť ODRM oblastí meria šesť rôznych vecí, alebo sa duplikujú. Korelácia
nad 0,85 medzi dvoma kategóriami by znamenala, že ich oddelenie je zdanlivé —
a to je zistenie o modeli, ktoré odpovede po položkách nepotrebuje.

**Stratifikácia podľa verzie je povinná, nie voliteľná.** Banka sa medzi
4. a 7. 8. 2026 zmenila štyrikrát (1.5 → 1.8). Korelácia počítaná naprieč
verziami je zmes viacerých nástrojov, nie zistenie o jednom. Paušálne
„potrebujeme 200 respondentov" je preto zavádzajúce — rozhoduje počet
v rámci JEDNEJ verzie.

### 13.4 Rozhodnutie o zbere (7. 8. 2026)

**Odpovede po položkách sa zbierať nebudú.** Ani opt-in, ani agregovanou
telemetriou, ani externým pilotom — teraz nie.

- **Opt-in pilot** padá na cene: znamenal by odvolávanie sľubu, ktorý sa
  respondentovi zobrazuje priamo počas kvízu, a samovýberovú vzorku skreslenú
  práve v meranej premennej (kto dobrovoľne zdieľa odpovede o svojej
  bezpečnosti, sa od ostatných systematicky líši v bezpečnosti). Samostatná
  retencia navyše nemá čím bežať — hosting nemá cron a mazanie visí na zápise.
- **Agregovaná telemetria** nedá ani alfu, ani diskrimináciu položiek: obe
  potrebujú odpovede spárované v rámci jedného respondenta.
- **Externý pilot** sa parkuje s podmienkou: psychometrická vzorka potrebuje
  **zmrazený nástroj**, a banka sa za štyri dni zmenila štyrikrát.

Čo sa robí namiesto toho: **kognitívny pretest na 5–10 firmách** (think-aloud
a verbal probing). Je to jediný zdroj dôkazu o validite dostupný pri nula
respondentoch a mieri na obsahovú validitu, teda na otázku, či respondenti
čítajú položky tak, ako sú mienené. Prioritne `cx_F01`/`ind_13` (možnosť za
25 bodov je formulovaná ako test veľkosti) a osem vetviacich otázok.
**Zápisy z rozhovorov sú osobné údaje** a potrebujú vlastný právny základ
a retenciu — pretest je bez zásahu do produkcie, nie bez GDPR.

**Test-retest a medzirespondentná zhoda sú dosiahnuteľné výhradne externým
pilotom.** Nástroj je bez konta a bez identity, takže dva behy tej istej firmy
nevie spárovať. Vedie sa to ako fakt, nie ako kritérium, ktoré raz splní.

Po týchto krokoch bude mať nástroj **plán dôkazov a jeden vykonaný krok** —
nie splnené prahy. Tvrdiť, že je validovaný, by bolo nepresné.
