# Audit predajnosti — pohľad CTO kupujúcej konzultačnej firmy

> **Scenár:** hypotetický predaj nástroja veľkej konzultačnej firme (KPMG, PwC,
> Deloitte, EY) ako **prvotný screening klientov**, ktorí chcú poradenstvo
> v automatizácii a digitalizácii. Audit hodnotí predajnosť pre tento use-case,
> nie kvalitu kódu. Predaj sa nechystá — dokument je podklad na rozhodovanie,
> ktoré námietky odstrániť, obísť alebo zapracovať.
>
> **Stav produktu v čase auditu:** commit `1a6a673` · banka `1.8` · scoring `1.6`
> · benchmark `2025-DII-v3` · 0 uložených výsledkov v produkcii · 8. 8. 2026
>
> **Ako audit vznikol:** štyri nezávislé optiky (obchodný lievik/BD, metodologický
> board a brand risk, procurement/CISO, produkt a delivery), každá s adversariálnou
> oponentúrou, ktorá overovala dôkazy v repozitári. Nálezy bez dôkazu boli zamietnuté
> alebo opravené; nosné tvrdenia (verejnosť GitHub repa, autorstvo commitov, token
> v query stringu, rozpor v ROI_MODEL) boli následne overené ešte raz nezávisle.

---

## Verdikt

V dnešnom stave NEKÚPIM — ako screening kanál klientov by som rozhovor ukončil na prvom stretnutí. Nástroj je konštrukčný protiklad screeningového lievika: nevyprodukuje jediný kontaktovateľný lead, konzultant sa o dokončenom hodnotení nemá ako dozvedieť a výsledok môže ktokoľvek s odkazom nenávratne zmazať. Dodávateľská organizácia neexistuje (bus factor 1, zdieľaný hosting, žiadne DPA/ISO/SLA), takže vendor due diligence skončí pri prvom formulári — a exkluzivitu na dnešný kód vrátane otázkovej banky nemožno predať, lebo repo je verejné na GitHube pod neodvolateľnou MIT licenciou. Nástroj s nulou reálnych výsledkov a eurovými ROI číslami z nezdrojovaných expertných odhadov by risk partner pod našou značkou nepodpísal. Zároveň platí, že metodické jadro (audit trail s replay testami, validátor, verzovanie porovnateľnosti, Eurostat ukotvenie) je nadpriemerné a poctivejšie než bežné interné nástroje konzultačných firiem. Kúpiteľné by to bolo ako licencia metodiky a kódu nasadená do našej infraštruktúry, s oddeleným intake režimom a po vykonanom pilote — nie ako hotový SaaS kanál.

## Hlavné NIE — dôvody, pre ktoré kupujúci reálne ukončí rozhovor

### 1. Anonymný dizajn nevyprodukuje lead ani prístup konzultanta

Nezbiera sa meno, e-mail ani IČO (types/index.ts:183-187; INSERT v hosting/api/result-save.php bez kontaktných polí), backoffice bol 5. 8. 2026 zadaný aj vyradený a jediný prístup k výsledku je 64-hex hash v rukách klienta, pričom ktokoľvek s odkazom ho môže zmazať (result-delete.php). Náprava koliduje so zobrazovanými sľubmi súkromia (quiz.localNotice, share.privacyText) a podľa vlastnej dokumentácie práve anonymita drží ochotu firiem pravdivo priznávať slabiny — kupujúci si vyberá medzi lievikom a kvalitou dát.

### 2. Dodávateľská organizácia neexistuje — vendor due diligence končí pri prvom formulári

Žiadne ISO 27001, SOC 2, SLA, DPA ani pentest; zdieľaný hosting bez cron a bez dokumentovaných záloh DB, FTP deploy, DB heslá v PHP súbore na FTP, GDPR stránka nehotová, jediný vývojár (všetkých 72 commitov jeden autor). Procurement Big 4 onboarding vendor-hosted SaaS od jednej fyzickej osoby vôbec nezačne — to je dealbreaker nezávislý od kvality metodiky.

### 3. Exkluzivita sa nedá predať: MIT licencia na verejnom GitHube

Repo github.com/PRAESTAR/Digitalizuj-to je verejné (overené: origin remote, LICENSE MIT, Copyright 2026 Matej Langsfeld) a obsahuje celé jadro IP — otázkovú banku, engines/, metodiku aj publish endpoint. MIT grant je neodvolateľný pre každého, kto kópiu získal, vrátane konkurenčnej Big 4; predmetom kúpy môže byť len značka, dáta, know-how a budúce proprietárne verzie.

### 4. Nulová empirická validácia a eurové ROI z nezdrojovaných odhadov pod našou značkou

V produkčnej DB je 0 výsledkov, kognitívny pretest je len naplánovaný (METHODOLOGY §13), peer vzorka je modelovaná a hodiny v ROI súčine stoja na interných expertných odhadoch s TODO o chýbajúcich zdrojoch (data/scoringConfig.ts:193-195). Pod logom Big 4 sa konkrétne euro stáva radou firmy — risk partner headline číslo, v ktorom čitateľ nerozozná Eurostat od odhadu autora, nepodpíše.

---

## Register nálezov

Priorita = ako veľmi nález bráni predaju: **vysoká** — dealbreaker, kupujúci končí
rozhovor; **stredná** — prejde len s plánom nápravy; **nízka** — poznámka do zmluvy
alebo backlogu. Riešenie: *odstrániť* (prestať to robiť), *obísť* (zmluvne alebo
prevádzkovo), *zapracovať* (zmena produktu).

### Vysoká priorita (5)

#### V1. Žiadny lead, backoffice ani IAM — výsledok drží len klient a ktokoľvek s odkazom ho zmaže

**Problém:** Nezbiera sa identita (result-save.php, types/index.ts:183-187), admin panel vyradený 5. 8., API nemá list/notifikáciu/webhook (5 endpointov), autorizácia = znalosť hashu vrátane nenávratného výmazu.

**Dôsledok pre predaj:** Konzultant sa o screeningu nedozvie, nemá koho kontaktovať a evidenciu leadov môže zmazať klient; use-case v produkte neexistuje.

**Riešenie** *(zapracovať · náročnosť veľká)*: Intake fork: post-result opt-in kontakt, prepis sľubov súkromia, právny základ + DPIA; konzultantský backoffice so SSO, rolami a audit logom; notifikácia dokončenia; autentizovaný výmaz namiesto hashu.

#### V2. MIT licencia na verejnom GitHub repe — exkluzivita na existujúce dielo nepredajná

**Problém:** PRAESTAR/Digitalizuj-to je verejné s MIT licenciou; jadro IP (banka, engines, metodika, publish.php) je voľne použiteľné kýmkoľvek.

**Dôsledok pre predaj:** Akvizičný/exkluzívny model padá; predať možno len značku, dáta, know-how a budúce verzie.

**Riešenie** *(obísť · náročnosť stredná)*: Sprivátniť repo a prelicencovať budúce verzie na proprietárne, IP assignment v zmluve, transparentne priznať verejnú distribúciu a deal štruktúrovať okolo budúcich verzií a služieb.

#### V3. Vendor-hosted model neprejde procurementom: compliance a prevádzka

**Problém:** Žiadne ISO/SOC2/SLA/DPA/pentest; shared hosting bez cron, FTP deploy (FORCE_ALL=1), secrets na FTP, žiadne dokumentované zálohy, údržba obsahu cez phpMyAdmin+git+FTP.

**Dôsledok pre predaj:** TPRM dotazník zastaví rozhovor pred metodickým hodnotením; delivery proces Big 4 to nedokáže prevziať.

**Riešenie** *(obísť · náročnosť stredná)*: Predávať ako licenciu/asset deal s nasadením do infraštruktúry kupujúceho (statický export + 5 PHP súborov + MariaDB je prenositeľné); jednorazový pentest, security whitepaper, CI/CD namiesto FTP, vault na secrets.

#### V4. Nulová empirická validácia — kupujúci by bol prvým reálnym používateľom

**Problém:** 0 výsledkov v produkcii, pretest nevykonaný, architektúra bez odpovedí po položkách robí psychometriku nespočítateľnou (METHODOLOGY §13); známy bias otázky cx_F01 nevyriešený.

**Dôsledok pre predaj:** Board nepodpíše nálepky zrelosti a odporúčania klientom bez jediného dôkazu, že skóre triedi reálne firmy správne.

**Riešenie** *(zapracovať · náročnosť veľká)*: Vykonať kognitívny pretest (5-10 firiem), zmraziť banku a scoring, externý pilot 30-50 firiem pod consentom kupujúceho mimo produkčnej DB, pilot-readiness metriky nad agregátmi.

#### V5. Eurový ROI odhad = zdrojovaná sadzba × nezdrojované hodiny

**Problém:** processBenchmarks (frekvencie, časy, automatizovateľné podiely) sú expertné odhady s TODO (scoringConfig.ts:193-273); adminAgendaShareOfFte, realizationRates a ramp-up krivka nezdrojované; ROI_MODEL.md si navyše protirečí (jednotná vs. sektorová sadzba).

**Dôsledok pre predaj:** Pod značkou kupujúceho sa euro stáva investičnou radou s profesionálnou zodpovednosťou; metodologický board sa zasekne tu.

**Riešenie** *(zapracovať · náročnosť stredná)*: Headline z hodinových pásiem, eurá len ako interval s viditeľným pôvodom vstupov; doplniť zdroje (APQC) alebo kalibrovať z pilotov; zmluvne vymedziť ROI ako orientačný screening; opraviť rozpor v ROI_MODEL.md.

### Stredná priorita (12)

#### S1. Lokalizácia je škrupina a dáta sú jednotrhové

**Problém:** Otázky aj odporúčania existujú len po slovensky (question_sk, QuestionCard.tsx:69) — cs/en používateľ dostane slovenský obsah; benchmark len SK/CZ/EU27 a hodinové sadzby výhradne SK, takže CZ trh už dnes počíta ROI so slovenskými mzdami.

**Dôsledok pre predaj:** CEE rollout (DE/PL/HU) nie je preklad, ale rekalibrácia; falošný dojem viacjazyčnosti due diligence vyvráti za minútu.

**Riešenie** *(zapracovať · náročnosť veľká)*: Per-jazykové kompiláty z question_i18n (schéma pripravená), CZ sadzby z lc_lci_lev, krajinová parametrizácia benchmarkov; do dokončenia cs/en stiahnuť alebo označiť beta.

#### S2. White-label neexistuje a odporúčania sú zapečené v kóde vrátane SK legislatívy

**Problém:** Značka, doména a farby natvrdo (lib/seo.ts:10, inline hexy), DB bez tenanta; 18+14 šablón odporúčaní v TypeScripte, rec_str_security cituje zákon č. 366/2024 Z. z., e-fakturácia 2027.

**Dôsledok pre predaj:** Nasadenie pod cudzou značkou = fork a ručný prepis; SK legislatívne rady sa v PL/HU/DE stanú vecne nesprávnymi radami.

**Riešenie** *(zapracovať · náročnosť veľká)*: Extrahovať brand vrstvu do konfigurácie (inštancia-per-značka je pri statickom exporte prirodzený model), externalizovať katalóg odporúčaní do DB s poľom country a mapovaním na služby kupujúceho.

#### S3. Plný report je jednorazový — permalink vracia len 4 skóre, PDF export neexistuje

**Problém:** result.php zámerne vracia len súhrn; plný ResultSnapshot žije len v pamäti relácie, hoci sa do DB ukladá (result_json) a žiadny endpoint ho nevydáva; PDF deklarovaný v ARCHITECTURE.md:23 nie je implementovaný.

**Dôsledok pre predaj:** Konzultant z odkazu dostane 4 score karty namiesto pre-meeting briefu a firma po zavretí karty odporúčania už nikdy neuvidí.

**Riešenie** *(zapracovať · náročnosť stredná)*: Autentifikované čítanie uloženého result_json pre advisor mód (bez otvárania §13), @media print ako lacný one-pager, neskôr konzultantský PDF export; opraviť ARCHITECTURE.md.

#### S4. Percentily a Top 25 % voči modelovanej vzorke 50 profilov

**Problém:** Percentilové čipy sa počítajú voči 50 syntetickým profilom (peerData.ts priznáva: žiadna nie je reálna firma); kohorty peer mediánu n=1-3.

**Dôsledok pre predaj:** Klient, ktorý zistí, že jeho percentil bol voči vymysleným firmám, má legitímnu sťažnosť — reputačné riziko pod značkou.

**Riešenie** *(odstrániť · náročnosť malá)*: V klientskom režime peer panel vypnúť, ponechať len meranú Eurostat DII distribúciu; peer percentily vrátiť po n≥30 reálnych hodnotení v segmente.

#### S5. Model sa mení tempom, ktoré láme porovnateľnosť — bez release governance

**Problém:** Banka 1.5→1.8 a scoring 1.5→1.6 za 4 dni, trikrát prerušená porovnateľnosť; eurá spred 7. 8. nadhodnotené 21-58 % pre 7 z 8 odvetví; navyše plánovaný zlom DII v4 (12/2026).

**Dôsledok pre predaj:** Meranie klienta pred/po intervencii a agregácia kohort sa rozpadnú; konzultant to klientovi nevysvetlí.

**Riešenie** *(zapracovať · náročnosť stredná)*: Zmluvné zmrazenie modelu počas kampane, release okná s ex-ante dopadovou analýzou, change board min. 2 ľudí, doložka o v4 zlome a duálnom vykazovaní.

#### S6. Krehká nálepka zrelosti z jedného respondenta

**Problém:** Sebahodnotenie 1 osoby; ±5 p. b. váh preklopí nálepku v 3-8 % prípadov; indikatívny kvíz má pri stredných odpovediach pásmo ORS široké 29,2 bodu cez dve maturity pásma (SCORING_SPEC §8.3); kompenzačný vážený priemer prekryje kritickú slabinu.

**Dôsledok pre predaj:** Pod značkou sa z orientačného údaja stáva výrok o firme, ktorý model podľa vlastnej dokumentácie neunesie.

**Riešenie** *(zapracovať · náročnosť malá)*: Headline preformulovať na orientačný profil podľa sebahodnotenia, pri skóre blízko prahu zobrazovať pásma namiesto nálepky, rolu respondenta ako kontext, multi-respondentný mód do roadmapy.

#### S7. Bus factor 1 a kontinuita ročného Eurostat cyklu

**Problém:** Všetkých 72 commitov jeden autor; model vyžaduje ročnú obnovu dát a premapovanie na DII v4 (12/2026, IMPROVEMENT_CHECKLIST r. 177); žiadna zastupiteľnosť.

**Dôsledok pre predaj:** Bez záväzku údržby nástroj do roka metodicky zastará; business continuity je povinná sekcia vendor risku.

**Riešenie** *(obísť · náročnosť stredná)*: Escrow alebo prevod repa, zmluvný maintenance na min. 2 ročné cykly vrátane v4, štruktúrovaný handover (data:freshness, validate-model, MODEL_VERSIONS už tvoria návod), vlastník metodiky u kupujúceho.

#### S8. 50-58 otázok bez perzistencie draftu a drop-off sa nemeria

**Problém:** Stav kvízu žije len v useReducer pamäti, žiadny beforeunload guard; lievik opustenia sa zámerne nemeria a merania cez GA4 sú za consent bránou (bez súhlasu trackEvent nespraví nič).

**Dôsledok pre predaj:** Každý zavretý tab je stratený lead, o ktorom sa firma nedozvie; KPI kanála by boli systematicky podhodnotené.

**Riešenie** *(zapracovať · náročnosť malá)*: Draft do localStorage + obnova (čisto client-side, neporušuje sľub), beforeunload guard, drop-off cez first-party agregované počítadlo (vlastný PHP endpoint), ako checklist sám navrhuje.

#### S9. Výsledková stránka bez obchodného CTA, s cudzím affiliate bannerom a bez mostíka do hĺbkového kvízu

**Problém:** Nula výskytov konzult/objedna/kontaktuj; jediné klikateľné CTA je provízny banner Websupportu na každej stránke vrátane kvízu (AdBanner.tsx); po 19-otázkovom kvíze niet upsellu na komplexný.

**Dôsledok pre predaj:** Moment najvyššej motivácie vyjde obchodne naprázdno a Big 4 nemôže prevádzkovať intake s cudzím sponzorovaným odkazom.

**Riešenie** *(zapracovať · náročnosť malá)*: V intake builde banner odstrániť (izolovaný komponent), nahradiť CTA blokom viazaným na výsledok (napr. vysoké TDRI → bezpečnostná konzultácia), doplniť mostík indikatívny → komplexný kvíz.

#### S10. GDPR dokumentácia neúplná a retencia neplatí doslovne

**Problém:** Stránka o ochrane údajov neexistuje (len plán CookieYes), informačná povinnosť čl. 13 roztrúsená v UI textoch; retencia 24 mesiacov beží len pri nových zápisoch, čo sľub automatického zmazania zamlčuje.

**Dôsledok pre predaj:** DPO kupujúceho to označí za povinnú nápravu pred pilotom; produkt so sľubom nadštandardného súkromia bez privacy policy je reputačné riziko.

**Riešenie** *(zapracovať · náročnosť malá)*: Dokončiť a publikovať privacy stránku, zosúladiť text retencie s realitou (alebo cron po migrácii), záznam o spracovateľských činnostiach ako príloha DPA.

#### S11. publish.php: statický token v GET query stringu, kód verejne čitateľný

**Problém:** Autorizácia prepisu produkčného modelu je token v URL parametri (publish.php r. 38-43) — končí v logoch a histórii; bez rotácie, rate limitu a IP obmedzenia; celá schéma je verejná na GitHube.

**Dôsledok pre predaj:** Prvý pentest kupujúceho to nájde; kompromitácia znamená tichú manipuláciu otázok a skórovania pod značkou.

**Riešenie** *(zapracovať · náročnosť malá)*: Token do Authorization hlavičky + POST, IP allowlist, rotácia a logovanie; alternatívne endpoint odstrániť a publish robiť cez CI s prístupom k DB.

#### S12. Kalibrácia na slovenské MSP — mid-market klientela Big 4 mimo ligy

**Problém:** Metodika je explicitne SME, Eurostat vzorka 10+ zamestnancov, kotvy pre large sú extrapolácie; mikrofirmy sa porovnávajú s populáciou, v ktorej nie sú (priznané caveaty existujú).

**Dôsledok pre predaj:** Enterprise CIO SME kotvy rozpozná a stratí dôveru; použiteľné pre SME advisory linky, nie core klientelu.

**Riešenie** *(obísť · náročnosť malá)*: Pozicovať výhradne pre SME prax (granty, digitalizačné programy EÚ), zmluvne vymedziť nepodporované use-casy, metodická príloha a školenie konzultantov na hranice interpretácie.

### Nízka priorita (3)

#### N1. ip_hash je pseudonymizovaný osobný údaj, kód tvrdí opak; fallback salt

**Problém:** Komentár v result-save.php (r. 124-128) tvrdí, že hash nie je osobný údaj; pri chýbajúcej soli fallback na konštantu, IPv4 hash so známou soľou invertovateľný; user_agent surový.

**Dôsledok pre predaj:** DPO údaj prekvalifikuje; chybné právne tvrdenie v kóde podkopáva dôveru v ostatné privacy deklarácie.

**Riešenie** *(zapracovať · náročnosť malá)*: Vyžadovať ip_salt (bez nej zápis odmietnuť), opraviť komentáre, rate-limit dáta do oddelenej tabuľky s krátkou retenciou, user_agent zredukovať.

#### N2. Tri subprocesori v dátovom toku (GA4, CookieYes, Turnstile)

**Problém:** Prenosy do tretích krajín, ktoré si Big 4 pod vlastnou značkou spravidla nenechá; implementácia je pritom nadpriemerne korektná (gtag sa bez súhlasu vôbec nenačíta, Turnstile server-side).

**Dôsledok pre predaj:** Nebráni predaju — vymeniteľné periférie; patrí do data flow mapy v prílohe DPA.

**Riešenie** *(obísť · náročnosť malá)*: Data flow mapa s účelmi a právnymi základmi; deklarovať GA4/CookieYes ako vymeniteľné za stack kupujúceho (analytika izolovaná v lib/analytics.ts).

#### N3. Dokumentácia si na troch miestach protirečí s kódom

**Problém:** Hlavička result.php tvrdí, že odpovede sú v DB pre administráciu (neukladajú sa a admin neexistuje); ROI_MODEL.md záver tvrdí jednotnú sadzbu v rozpore s §7.1; ARCHITECTURE.md deklaruje PDF export, ktorý nie je.

**Dôsledok pre predaj:** Due diligence to nájde za minútu a spochybní inak nadpriemerne poctivú dokumentáciu, o ktorú sa predajný príbeh opiera.

**Riešenie** *(odstrániť · náročnosť malá)*: Opraviť tri zastarané pasáže a doplniť kontrolu konzistencie dokumentácie do existujúceho validátora.

---

## Silné stránky — čo by kupujúci uznal

- Audit trail skóre s replay testami na 300 deterministických kombináciách (engines/auditEngine.test.ts) — explainability, akú bežné komerčné nástroje nemajú a ktorú si QA tím kupujúceho pýta ako prvú.
- Build-time validátor modelu s 20 kontrolami a pečiatkami dokumentácie: revízia modelu bez aktualizácie metodických dokumentov zhodí build.
- Dôsledná zásada nezmerané ≠ nula naprieč DII, ORS, TDRI aj AI indexom vrátane renormalizácie váh — metodicky nad úrovňou etablovaných indexov.
- MODEL_VERSIONS.md s trojstupňovou klasifikáciou porovnateľnosti a model_version pri každom výsledku; autor publikuje aj nepohodlné závery (citlivosť nálepky v METHODOLOGY §12.2).
- Ukotvenie na citovateľné zdroje s vintage: Eurostat isoc_e_dii v3/2025 a lc_lci_lev per odvetvie — eurové sadzby majú zdroj, nie marketingový odhad.
- Privacy-by-design vynútený v kóde, nie len v texte: answers_json vždy NULL, hashovaná IP, retencia, právo na výmaz — sľuby sedia so správaním systému a zvyšujú ochotu odpovedať pravdivo.
- Opevnený verejný zápisový endpoint (limity, whitelist polí, rate limit, idempotencia) a Turnstile overovaný výlučne server-side; consent mode prísnejší než býva zvykom.
- Obsah modelu žije v normalizovanej DB so schémou pripravenou na i18n a publish pipeline — základ pre lokalizáciu a obsahovú správu existuje, len nie je dotiahnutý.

## Stratégia: ako produkt urobiť predajným

Nepredávať SaaS, predať metodiku s cestou k intake. Konkrétne: (1) Rozdvojiť produkt — verejný matpex.sk ostane anonymnou referenciou a dôkazom metodickej poctivosti; pre kupujúceho vznikne oddelený intake build s post-result opt-in kontaktom, prepísanými sľubmi súkromia, konzultantským prístupom k už ukladanému result_json a vlastným právnym základom (DPIA). Kupujúcemu treba otvorene predložiť trade-off: identita pravdepodobne zmení rozloženie odpovedí, takže anonymná a intake kohorta sa nesmú miešať. (2) Deal štruktúrovať ako licenciu/asset predaj s nasadením do infraštruktúry kupujúceho — tým sa obídu compliance a prevádzkové dealbreakery; súčasťou je escrow/prevod repa, maintenance na dva ročné Eurostat cykly vrátane DII v4 a handover metodiky. (3) IP vyriešiť pred prvým rokovaním: sprivátniť GitHub repo, budúce verzie prelicencovať na proprietárne a verejnú MIT distribúciu transparentne priznať — predmetom exkluzivity sú značka, dáta a budúce verzie, nie dnešný kód. (4) Pred rokovaním urobiť lacné kroky dôveryhodnosti: vykonať už naplánovaný kognitívny pretest, dokončiť GDPR stránku, opraviť tri dokumentačné rozpory, vypnúť syntetické percentily a odstrániť affiliate banner z intake buildu. (5) Predajný príbeh stavať na metodike a auditovateľnosti, nie na trakcii — a namiesto sľubov ponúknuť trojmesačný spoločný pilot na 30-50 firmách so zmrazeným modelom a KPI (dokončenia, opt-in kontakty, dohodnuté stretnutia), ktorý zároveň dodá chýbajúcu empirickú validáciu.

