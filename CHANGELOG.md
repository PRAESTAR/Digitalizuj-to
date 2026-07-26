# Changelog

Všetky významné zmeny v projekte digitalizuj.to sú dokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt používa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

_Zatiaľ žiadne zmeny od poslednej vydanej verzie._

---

## [1.1.0] — 2026-07-24

Dokončenie výsledkového zážitku, plošná dizajnová konzistencia, oprava chyby v branching logike a dvoch mŕtvych risk faktorov, aktualizácia otázkovej banky na kontext 2026, výkonové a bezpečnostné opravy.

### Trvalé odkazy

- **Automatické QR + hash** — permanentný odkaz a QR kód sa teraz vygenerujú a zobrazia hneď po dokončení kvízu (predtým vyžadovalo kliknutie na tlačidlo „Vygenerovať odkaz"), platí pre `/results` aj `/r/[hash]`.
- Opravený zavádzajúci titulok stránky pre vlastný (nie peer) zdieľaný výsledok — predtým vždy zobrazoval „Výsledok nenájdený" aj pre platný hash.

### Živá výsledková karta v hero sekcii

- Karta v slučke **strieda štyri ukážkové profily** (skóre 91 / 34 / 78 / 52 spolu s DII, rizikom a odhadom úspory), aby bolo na prvý pohľad zrejmé, že nástroj vracia rôzne výsledky, nie jeden statický obrázok. Hodnoty sa nevymieňajú preblikom — vysunú sa zospodu, takže to pôsobí ako prepočítanie.
- **Radar sa prekresľuje** pri každej výmene (stiahnutie a rozvinutie do nového tvaru) a jeho vonkajší obrys pomaly „dýcha".
- Bodka „naživo v prehliadači" je teraz **radarový ping** — okolo bodky sa rozpína prstenec namiesto obyčajného blikania.
- Karta sa presunula do samostatného klientskeho komponentu `components/ui/HeroResultCard.tsx`, takže homepage zostáva serverovým komponentom (žiadna regresia výkonu z predchádzajúceho kola).
- Pri `prefers-reduced-motion` sa nič nestrieda ani nepulzuje.

### Výsledková karta sa pri skrolovaní roztrhne a rozpadne

- Hero karta „Vaša výsledková karta" sa pri skrolovaní cez hero **roztrhne pozdĺž štyroch zubatých zvislých línií na päť pásov**, ktoré sa rozostúpia do strán, pootočia a mierne padajú — ako roztrhnutý papier. Súčasne sa obsah (hlavička, radar, headline skóre, tri čiastkové metriky) rozsype cez vzniknuté trhliny, každý prvok s vlastným oneskorením. Rozpad dobehne presne vtedy, keď používateľ dorazí k sekcii „Vyberte si diagnostiku".
- Plocha karty je zložená z piatich `clip-path` pásov, ktoré v pokoji na seba presne nadväzujú (karta vyzerá ako jeden celok, bez viditeľných švov). Tieň nesie samostatná vrstva, pretože `clip-path` by inak orezal aj tieň mimo boxu.
- **Text sa trhá spolu s papierom.** Každý pás nesie úplnú kópiu obsahu karty orezanú na svoj tvar, takže nápisy aj čísla sú fyzicky prerezané trhacou líniou a zostávajú na svojom útržku („78/1|00", „Operačná zr|elosť") — nepadajú zvlášť popri papieri ako predtým. Prístupná je len prvá kópia, zvyšné štyri sú `aria-hidden`.
- Pásy ani obsah počas rozpadu **nestrácajú krytie** — zostávajú na 100 % a jednoducho odídu zo záberu spolu so skrolovaním. Vytráca sa len tieň a ambientný glow, ktoré po roztrhnutí karty už nedávajú zmysel.
- Nejde o dekoráciu: metodika sľubuje, že *„každé skóre je auditovateľné a spätne rozložiteľné"* — karta to teraz doslova predvedie. Poradie oddelenia kopíruje poradie odvodenia (headline skóre drží najdlhšie, lebo je to výsledok, z ktorého sa ostatné rozpadá).
- Implementované ako **CSS scroll-driven animácia** (`view-timeline`), nie JS scroll listener — beží na kompozítore mimo hlavného vlákna a animuje len `transform`/`opacity`, takže neprispieva k sekaniu pri skrolovaní. Dvojito ošetrené: `@supports (animation-timeline: view())` + `prefers-reduced-motion: no-preference`; bez podpory alebo pri redukovanom pohybe karta zostane staticky taká, ako bola. Efekt je len na desktope (karta je `hidden lg:block`).

### Plynulý prechod hero → „Vyberte si diagnostiku"

- Aurora wash v hero sekcii sa už neorezáva natvrdo na hranici sekcie (`overflow-hidden`), ale plynulo sa stráca (`mask-image` fade) do plochého pozadia nasledujúcej sekcie — predtým bol na hranici viditeľný ostrý „šev".
- Pridané `scroll-behavior: smooth` — kliknutie na „Začať diagnostiku"/„Čo presne dostanete" (`#quizzes`, `#what-you-get`) teraz plynulo skroluje namiesto okamžitého skoku.
- Aurora-blob animácie už neanimujú `scale()` (len `translate3d`) — škálovanie rozmazaného prvku nútilo prehliadač prekresľovať blur pri každom framee, čo pri skrolovaní cez hero sekciu sekalo.

### Business Impact — krivky namiesto jedného čísla

- **Kumulatívna úspora zobrazená ako tri krivky v čase** (konzervatívny / reálny / optimistický scenár), analogicky k projekcii výnosu pri investovaní — predtým len jedno statické ročné číslo za scenár. Krivky predpokladajú lineárny nábeh k plnému ročnému run-rate (3/6/9 mesiacov podľa scenára) na 24-mesačnom horizonte.
- Stredný scenár premenovaný na **„Reálny"** naprieč UI aj dokumentáciou (interný kód naďalej používa kľúč `mid`).
- Nová konfigurácia `realizationRates`, `rampUpMonthsByScenario`, `savingsProjectionHorizonMonths` v `data/scoringConfig.ts` / `config/model/scoringConfig.json` — `roiEngine.ts` už nemá realizačné sadzby natvrdo zapísané v kóde.

### Vizuálny dizajn — plošná konzistencia

Apple.com štýl (predtým len na homepage) teraz naprieč **celou** aplikáciou: kvíz, výsledkový dashboard (všetkých 6 komponentov), `/peers`, `/changelog`, zdieľané výsledky (`/r/[hash]` a súvisiace komponenty), 404/error stránky. Nahradené sýte indigo/blue/violet/red/green gradienty a farebné glow tiene neutrálnou paletou (`#1d1d1f`/`#6e6e73`/`#86868b`/`#0068d6`), zjednotené CTA tlačidlá na `.btn-apple-primary` (rounded-full, čierny gradient, bez scale-bounce hoveru), odstránené nekonečné idle animácie (`animate-float`) mimo hero sekcie. Reklamný banner v pätičke zostáva ako placeholder pre budúcu reklamu, ale bez pôvodného pestrého animovaného gradientu.

### Oprava branching logiky (P0)

- Akcia `include` bola v `AssessmentContext.tsx` implementovaná ako no-op — 5 otázok (`cx_B06_ecommerce`, `cx_B05b_outsource`, `cx_D03_server`, `cx_D04_virtualization`, `cx_D05_cloud`) sa preto zobrazovalo **úplne všetkým** respondentom bez ohľadu na relevanciu podmienky. Nahradené funkčnými invertovanými `skip` pravidlami; `cx_D02` navyše teraz správne pokrýva aj hodnotu `saas_only`, ktorá predtým nespúšťala žiadnu z vetiev.
- `complex_quiz` teraz zobrazuje reálne premenlivý počet otázok (43–49 podľa vetvy) namiesto takmer fixných ~48 pre každého.

### Risk faktory — opravené a nové

- **RF06** (single point of failure) a **RF12** (nepodporované vedľajšie aplikácie) boli trvalo mŕtve — žiadna otázka ich nemohla aktivovať. RF06 napojený na novú možnosť „nemáme jeden kritický systém" v `cx_B02`; RF12 napojený na novú otázku `cx_D08_app_lifecycle`.
- **RF13** (nepripravenosť na povinnú e-fakturáciu od 1. 1. 2027) a **RF14** (nepripravenosť na NIS2) — dva nové risk faktory, spolu teraz **14** (RF01–RF14) namiesto 12.
- Nová screening otázka `cx_E08_nis2` (zákon č. 366/2024 Z. z.) — zobrazuje sa len stredným/veľkým firmám vo výrobe, doprave/logistike a IT/telekomunikáciách.

### Otázková banka — aktuálnosť 2026

- Tooltip `cx_F07_ai_governance` doplnený o EU AI Act (nariadenie EÚ 2024/1689, fázovo účinný 2025–2027).
- Tooltipy AI otázok doplnené o „AI agenti" popri chatbotoch/generatívnej AI.
- `questionBank.json` verzia 1.3-MVP → 1.4-MVP, `scoringConfig` verzia 1.3-MVP → 1.4-MVP.

### Výkon

- `AssessmentProvider` (a s ním 80 KB otázkovej banky + scoring enginy) presunutý z root layoutu do route grupy `app/(assessment)/` — `/peers` a `/changelog` už tento kód vôbec nesťahujú.
- `RadarChart` (recharts, ~110 KB gzip) a QR generovanie lazy-loadované cez `next/dynamic` namiesto blokovania hydratácie celej výsledkovej stránky.
- `opengraph-image` už nebeží na edge runtime — statické generovanie namiesto dynamického behu pri každom requeste.
- Font Onest doplnený o váhu 900 (predtým sa `font-black` syntetizoval prehliadačom z 800).
- Odstránené nepoužité `create-next-app` SVG z `public/`.

### Bezpečnosť

- Opravené 3 zvyšné high-severity zraniteľnosti (`postcss`, `sharp`, transitívne cez `next`) pomocou `package.json` `overrides` namiesto downgradu Next.js na `9.3.3` (čo bol jediný návrh `npm audit fix --force`) — `npm audit` teraz hlási 0 zraniteľností.

---

## [1.0.0] — 2026-07-24

Prvé vydanie digitalizuj.to — digitálnej auditnej platformy pre malé a stredné podniky. Táto verzia zlučuje celý vývoj od úvodného MVP (apríl 2026) po finálnu revíziu metodiky, dát a dizajnu pred releasom.

### Jadro platformy

- **Adaptívny dotazník** — indikatívny kvíz (15 otázok, 5–7 min) a komplexný kvíz (45+ otázok v 6 moduloch A–F, 15–20 min), branching logika (`skip`, `include`, `flag_risk`), možnosť „Neviem" pri každej otázke.
- **5 nezávislých výstupov:**
  - **DII-Compatible Score** (0–100, prepočet na 0–12) — porovnanie voči EU Digital Intensity Index.
  - **Operational Readiness Score** (0–100) — 6 kategórií ODRM (Procesy, Systémy, Dáta, Infraštruktúra, Bezpečnosť, Governance) s bezpečnostnou penalizáciou pri kritickom stave kategórie E.
  - **AI & Automatizácia Readiness** (0–100) — prierezový index naprieč otázkami (rovnaká architektúra ako Risk Index), meria využitie AI a automatizácie nezávisle od 6 ODRM kategórií.
  - **Technical Debt & Risk Index** (0–100, vyššie = horšie) — 12 risk faktorov (RF01–RF12) s critical/high/medium severitou.
  - **Business Impact Potential** — odhad úspor v hodinách/MD/€ ročne, 3 scenáre (konzervatívny/stredný/optimistický), model chybovosti a reworku.
- **Výsledkový dashboard** — score cards, radarový graf 6 kategórií, Executive Summary, Risk panel, Business Impact tabuľka, 3-fázová roadmapa odporúčaní, benchmark porovnanie (SK/EÚ/sektor/veľkosť), audit trail s rozpadom výpočtov.
- **Trvalé odkazy a peer porovnanie** — zdieľateľný výsledok (`/r/hash`) s QR kódom, anonymizovaný snapshot bez PII, porovnanie voči firmám podobnej veľkosti/sektora.
- **Lokálne spracovanie** — žiadne dáta sa neodosielajú na server, všetko beží v prehliadači (`localStorage` pre trvalé odkazy).
- **Konfiguračný priečinok** `config/model/` — editovateľné JSON/MD súbory pre otázky, scoring parametre, benchmark dáta a kompletnú metodickú dokumentáciu.

### Metodika a benchmark dáta

- **Benchmark ukotvený na Eurostat DII 2025** (`isoc_e_dii`, dataset `2025-DII-v3`, DII verzia 3, prieskum 2025) — SK distribúcia 41,6/32,0/20,4/6,0 %, EÚ-27 27,9/34,5/27,5/10,1 % podľa pásiem digitálnej intenzity; odvodené mediány SK 4,3 / EÚ 5,4 s zdokumentovanou interpoláciou.
- **12 DII premenných** zosúladených s aktuálnou v3/2025 sadou Eurostatu (dvojročná rotácia verzií v4/2024 ↔ v3/2025 zdokumentovaná); referenčné KPI Digitálnej dekády (SME ≥ základná digitálna intenzita: SK 57,1 % vs. EÚ 71,4 %, cieľ 90 % do 2030).
- **ROI model s hodinovou cenou práce IT/telekomunikačného sektora SR** (30,8 €/h, Eurostat `lc_lci_lev` 2025, NACE J) — otázka na hodinovú cenu bola z dotazníka odstránená (citlivý údaj, nekonzistentné self-reported odhady); model teraz vždy počíta s benchmarkom naviazaným na sektor, ktorý digitalizačné projekty typicky rieši.
- **Regulačný kontext 2025–2027** — NIS2 (zákon č. 366/2024 Z. z.), povinná B2B e-fakturácia od 1. 1. 2027 (Peppol, EN 16931), AI Act — premietnuté do metodiky a odporúčaní.
- **Ročná aktualizačná politika** benchmark dát a mzdových kotiev, zdokumentovaná v `BENCHMARK_SPEC.md` a `ROI_MODEL.md`.

### Dokumentácia zosúladená s implementáciou

Kompletná revízia metodických dokumentov tak, aby presne opisovali skutočné správanie kódu (predtým viaceré popisovali plánovanú, neimplementovanú logiku):

- `SCORING_SPEC.md` — prepísané podľa reálnych vzorcov `scoringEngine.ts`/`riskEngine.ts`/`aiReadinessEngine.ts` (vrátane známych aproximácií, napr. plochý priemer DII namiesto per-indikátorovej agregácie).
- `RECOMMENDATION_RULES.md` — prepísané podľa reálnych pravidiel `recommendationEngine.ts` (odstránené neimplementované answer-level podmienky a nepodložené benchmark tvrdenia).
- `QUESTION_BANK_GUIDE.md` — prepísané podľa skutočnej schémy `questionBank.json` (predtým dokumentoval schému, akú kód nikdy neimplementoval — polia, branching gramatika, konvencie).
- `METHODOLOGY.md`, `BENCHMARK_SPEC.md`, `ARCHITECTURE.md` — odstránené „MVP draft" rámcovanie, doplnená AI & Automatizácia Readiness, opravený zastaraný dátový model a štruktúra súborov.
- `README.md` — doplnené dva Mermaid diagramy (technologická architektúra vrstiev, aplikačný tok od dotazníka po zdieľaný odkaz).

### Vizuálny dizajn

- **Redizajn v apple.com štýle** — svetlé pozadie, veľký nadpis s gradientovým akcentom, plávajúca náhľadová karta výsledkov, čierne „Buy"-štýl CTA tlačidlo.
- **Font Onest** (SF Pro–podobné proporcie, plná slovenská diakritika) nahradil predchádzajúci fallback — opravený bug, kde telo stránky ignorovalo načítaný font a renderovalo v Arial/Helvetica.
- Horný navigačný panel dočasne odstránený (komponent zostáva pripravený v `components/ui/SiteHeader.tsx`).

### Opravy scoringu a logiky

- Bezpečnostná penalizácia ORS sa aplikuje len na **meranú** kategóriu E (predtým nemeraná kategória dostala maximálnu penalizáciu −30 %).
- Risk index (TDRI) ignoruje „Neviem"/preskočené odpovede a informačné otázky bez bodovateľných možností (predtým napr. RF06 penalta pre každého respondenta komplexného kvízu bez ohľadu na odpoveď).
- Benchmark gap prahy prepočítané pre DII škálu 0–12 (±0,6/±2,4) — extrémne popisky boli na 0–12 škále predtým matematicky nedosiahnuteľné.
- Transformačné odporúčania (12+ mesiacov) sa vracajú vo výsledku a zobrazujú v roadmape (predtým sa zahadzovali).
- AI odporúčanie sa generuje len pri explicitnej odpovedi „nevyužívame AI" (nie pri chýbajúcej/„Neviem").
- UI reťazce a audit trail čítajú verzie benchmarku/scoringu priamo z modelu namiesto natvrdo zapísaných konštánt.

### Známe obmedzenia

- Benchmark hodnoty pre sektor/veľkosť firmy a Operational Readiness mediány sú expertné odhady, nie empirické dáta z vlastného datasetu.
- ROI model odhaduje len potenciál úspor (bez investičných nákladov, bez adopčnej krivky) — výstup je ročný run-rate po plnej implementácii.
- Mikrofirmy (< 10 zamestnancov) nie sú pokryté Eurostat DII dátami.
- Self-reported dáta bez nezávislej verifikácie.
- DII skóre je aproximácia (plochý priemer označených otázok), nie per-indikátorová agregácia podľa oficiálnej Eurostat metodiky — podrobnosti v `SCORING_SPEC.md` §2.
- Ďalšie otvorené položky sledované v `IMPROVEMENT_CHECKLIST.md`.

### Technológie

Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · Recharts 3 · React Context + `useReducer` (state management) · žiadny backend/databáza (MVP beží plne client-side).
