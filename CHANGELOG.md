# Changelog

Všetky významné zmeny v projekte digitalizuj.to sú dokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt používa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — vo vývoji

> **Otvorená verzia.** Tento záznam sa priebežne dopĺňa až do uzavretia
> verzie 1. Posledná aktualizácia: 2026-08-05.

### Ukladanie a zdieľanie výsledkov (5. 8. 2026)

- **Výsledky sa ukladajú na server.** Do tohto dátumu výsledok neopustil
  prehliadač, takže permanentný odkaz aj QR kód fungovali len na tom jednom
  zariadení a administrácia nemala čo zobraziť. Nová tabuľka
  `assessment_results` v MariaDB drží **plné znenie** vrátane odpovedí po
  otázkach; `localStorage` zostáva ako prvá, okamžitá vrstva. Zápis ide cez
  `api/result-save.php` (strop 512 kB, kontrola tvaru hashu aj UUID, 20 zápisov
  z IP za hodinu, idempotencia), čítanie cez `api/result.php`, ktorý **zámerne
  vracia len anonymizovaný súhrn** — odpovede sú pre administráciu, nie pre
  každého, komu sa odkaz prepošle.
- **Zmena sľubu o súkromí.** Web na štyroch miestach tvrdil, že sa nič
  neodosiela na server (vrátane FAQ, ktorá šla aj do štruktúrovaných dát pre
  Google). Texty sú prepísané v sk/en/cs. Právny základ, retenčná lehota a
  stránka o ochrane osobných údajov zatiaľ **chýbajú** — automatické mazanie
  nie je nastavené.
- **Permanentné odkazy prestali vracať 404.** Statický export vie vyrobiť
  stránku len pre vopred známe hashe, takže vlastný výsledok návštevníka
  končil na chybovej stránke skôr, než sa stihol spustiť komponent, ktorý ho
  číta. Export teraz vyrába generickú stránku `/{jazyk}/r/view.html` a
  `.htaccess` na ňu neznáme hashe interne prepisuje.
- **Nový formát identifikátora** — 64 hex znakov, SHA-256 z UUIDv7 a náhodnej
  soli. UUIDv7 sa ukladá vedľa hashu ako chronologický zoraďovací kľúč; do URL
  ide len hash, z ktorého sa čas ani poradie odvodiť nedá. Staršie formáty
  zostávajú platné.

### Presnosť modelu — P1 opravy (5. 8. 2026)

- **Inverzia penált v TDRI.** Závažnosť sa počítala dvakrát, takže potvrdené
  stredné riziko skórovalo **nižšie** než to isté riziko iba odvodené z
  nízkeho skóre — priznanie problému sa oplatilo menej než dohad a zlepšenie
  odpovede vedelo index rizika zvýšiť. Teraz sa násobí len sila dôkazu.
- **Škála TDRI má dosiahnuteľných 100** (predtým ~93, takže pásmo „kritické
  61–100" bolo fakticky 61–93). Menovateľ sa počíta z definícií, nie z literálu.
- **Percentil DII už nemá posun o tretinu pásma.** Firma presne na mediáne
  videla na jednej karte „odchýlka 0,0" vedľa percentilu 55; teraz je percentil
  inverziou mediánu a platí, že medián = 50. percentil.
- **Porovnanie podľa veľkosti firmy** (`diiVsSize`, `orsVsSize`) a voči
  domácemu trhu (`orsVsCountry`). Veľkosť sa dovtedy zbierala, odovzdávala do
  enginu a tam zahadzovala — päťčlenná firma sa porovnávala s rovnakým
  mediánom ako dvestočlenná.
- **ROI reaguje na zbierané vstupy.** Objem fakturácie prebíja benchmarkovú
  frekvenciu, počet administratívcov funguje ako strop kapacity. Dve firmy s
  desaťnásobne odlišným objemom faktúr dostávali dovtedy identické číslo.
- **Sklad, servis a nákup sa konečne počítajú** — ich hodnoty sa volali inak
  než benchmarky, takže sa odfiltrovali a nahradili defaultmi.
- **Optimistický scenár sa skrýva** pri nízkej alebo nezmeranej organizačnej
  pripravenosti (a pri neuvedenej veľkosti firmy). Predtým sa k nemu len
  pridával disclaimer, ktorý číslo nijako nekrotil.
- **Benchmark dáta majú jeden zdroj pravdy** a build ich stráži. Drift bol
  reálny: editovateľná kópia nemala celý blok ČR, hoci runtime s ním počítal.
- **Priznaný pôvod referenčných hodnôt** — karty sú rozdelené na merané
  Eurostat dáta a expertné odhady; sektorové a veľkostné mediány dovtedy
  vyzerali rovnako dôveryhodne ako meraná distribúcia.

### Ostatné

- **Reklamný slot** nesie skutočnú kreatívu s meraním zobrazení aj kliknutí
  (dovtedy sa merali len kliknutia, takže sa nedal počítať CTR).
- **Jednotná šírka obsahu** naprieč celým webom vrátane kvízu a pätičky.
- **Ikony odstránené** (5. 8. 2026) — favicon aj generovaná PNG ikona, kým
  nevznikne nová vizuálna identita. Dôsledok: PWA je dovtedy neinštalovateľná.
- **Meranie prepnuté** na GA4 property `G-VY93FHZ43M`.
> Podrobná história jednotlivých krokov žije v git logu; sem patrí
> konsolidovaný obraz toho, čo verzia 1 prináša.

### Metodika a model

- **Dvojvrstvový model merania** — DII-Compatible Layer (12 premenných
  Eurostat DII, dataset `isoc_e_dii` verzia 3, prieskum 2025) + Operational
  Digital Readiness Model so 6 váženými oblasťami A–F (20/20/15/15/20/10 %).
  Benchmark SK 41,6/32,0/20,4/6,0 % vs EÚ-27 27,9/34,5/27,5/10,1 %.
- **Per-indikátorová DII agregácia (scoring v1.5)** — mapovanie otázok na
  12 indikátorov v3/2025 s odôvodnenými prahmi (`data/diiIndicators.json`),
  striktné vylúčenie otázok mimo v3, extrapolovaný `score12` s priznaným
  pokrytím (komplexný kvíz 10/12, indikatívny 8/12) a 12-riadkový audit
  trail indikátorov vo výsledku.
- **Nezmerané ≠ nula (scoring v1.5)** — nemeraná ODRM kategória má `null`
  skóre a do ORS nevstupuje (renormalizácia váh cez merané kategórie —
  koniec fantómového stropu pri preskočených kategóriách); odporúčania a
  ROI disclaimer sa nespúšťajú nad nemeranými dátami; peer snapshoty v2
  (`schemaVersion: 2`) ukladajú N/A ako `null` a staršie v1 snapshoty sa
  zobrazujú s poznámkou o staršej metodike.
- **Otázková banka v1.5** — 65 otázok s adaptívnym branchingom (15 alebo
  43–49 podľa vetvy), kontext 2026: NIS2 a zákon č. 366/2024 Z. z., povinná
  B2B e-fakturácia od 1. 1. 2027 (Peppol, EN 16931), AI Act. Normalizácia
  35 ad-hoc škál na deklarované (`scale` + zdôvodnenie odchýlok).
- **14 rizikových faktorov (RF01–RF14)** a Technical Debt & Risk Index ako
  samostatná dimenzia — kritické riziká nemiznú v priemernom skóre. K tomu
  prierezový AI & Automatizácia Readiness index.
- **Business Impact ako tri krivky** — konzervatívny/reálny/optimistický
  scenár s ramp-up 9/6/3 mesiacov na 24-mesačnom horizonte. Hodinová cena
  práce 30,8 €/h (Eurostat `lc_lci_lev` 2025, NACE J), dotazník sa na mzdy
  nepýta.
- **Validátor modelu v builde** — 8 tried integritných kontrol (vrátane
  úplnosti a vyhodnotiteľnosti DII mapovania); pri prvom behu odhalil
  odpojený rizikový faktor RF08.

### Výsledky a zdieľanie

- Automatický **QR kód + permanentný odkaz** hneď po dokončení kvízu:
  16-znakový base62 hash, `/r/[hash]` s anonymizovaným snapshotom; plný
  výsledok zostáva len v prehliadači používateľa.
- Výsledkový dashboard: DII vs. EÚ a SK, radar 6 oblastí, risk panel,
  business impact s audit trailom, prioritizovaná roadmapa v 3 fázach.
  Benchmark tabuľka 50 anonymizovaných profilov na `/peers`.

### Dizajn a UX

- Apple-style vizuálny jazyk naprieč webom; aurora pozadie so spojitým
  gradientom (žiadny šev medzi sekciami) a svetelná stopa za kurzorom
  (kométa + guľôčka presne na kurzore) na celej úvodnej stránke.
- Živá výsledková karta: strieda 4 ukážkové profily a pri skrolovaní sa
  roztrhne na 5 zvislých pásov aj s textom — CSS scroll-driven animácia
  na kompozítore, `prefers-reduced-motion` rešpektované.
- Mobile-first: kartové zoznamy namiesto tabuliek, 44 px dotykové plochy
  (WCAG 2.2), ovládač veľkosti textu 100/125/150 % na desktope.

### Viacjazyčnosť

- Tri trhy — Slovensko, Česko a EÚ: voľba vlajky určuje jazyk AJ referenčné
  čísla (sk→SK benchmark, cs→ČR benchmark s Eurostat DII 2025 dátami ČR —
  medián 5,6, tesne nad priemerom EÚ; EÚ vlajka→angličtina + priemer EÚ-27).
  Routy pod `/{locale}`, inline SVG vlajky, negociácia koreňa podľa
  Accept-Language.
- UI chrome preložený vo všetkých komponentoch (232 kľúčov/jazyk, overená
  parita); `Intl` formátovanie odvodené od jazyka. Obsahová vrstva (texty
  otázok, odporúčania) sa prekladá v ďalšom kroku cez databázu.

- **Ponuka jazyka podľa krajiny návštevníka** — GeoIP hostingu
  (Cloudflare CF-IPCountry) cez same-origin ; nenásilný banner
  v cieľovom jazyku namiesto tvrdého redirectu (geo redirecty rozbíjajú
  SEO aj cache). Manuálna voľba jazyka (vlajky alebo banner) sa pamätá
  rok v cookie a koreňová negociácia ju číta pred Accept-Language.

### SEO a viditeľnosť

- Self-canonical každej mutácie s preloženými metadátami, plný hreflang
  cluster + x-default, sitemap so 4 jazykmi homepage; nepreložené
  podstránky canonicalizujú na `/sk` verziu (poctivý signál duplicity).
- Viditeľné FAQ (7 otázok vrátane e-fakturácie a NIS2) stavané z tých
  istých kľúčov ako FAQPage schéma; nová verejná stránka `/sk/metodika`.
- AI vyhľadávače: `llms.txt`, explicitné povolenia crawlerov, JSON-LD graf
  s lokalizovaným `inLanguage`.
- Core Web Vitals: variabilný font (3 preloady namiesto 13), immutable
  cache statických assetov, recharts mimo homepage bundle.

### Databáza a správa obsahu

- Otázková banka v **MariaDB 11.4** — 13 tabuliek s referenčnou integritou;
  podmienky vetvenia surovo aj štruktúrovane; i18n stĺpce pripravené na
  preklad obsahu.
- **Publish s integritnou bránou**: phpMyAdmin → `publish.php` (SQL kontroly
  odmietnu nekonzistentný model) → verziovaný artefakt `/model/v{N}.json`.
  Kompilát hĺbkovo zhodný s pôvodným JSON; PHP a Node kompilátory bajtovo
  identické (SHA-256).
- `npm run model:pull` — artefakt → repo s validáciou a rollbackom.

### Hosting a nasadenie

- Statický export (`output: 'export'`, 231 stránok) pre Apache/PHP
  webhosting; `.htaccess` preberá bezpečnostné hlavičky (CSP, HSTS…),
  legacy 301, jazykovú negociáciu s `Vary` a mapovanie čistých URL.
- Staging `app.magors.net` s `X-Robots-Tag: noindex` počas prípravy;
  FTPS deploy s resume; bajtovo overená zhoda nasadenia s buildom.
- **Produkčná doména `matpex.sk` spustená (3. 8. 2026)** — nový FTP účet aj
  nová databáza `Digitalizuj` (rotované prihlasovacie údaje aj publish
  token); pôvodný docroot niesol aktívny WordPress, ktorý bol pred
  nasadením appky odstránený. Staging noindex blok sa na produkcii
  nepoužíva, canonicaly mieria priamo na `matpex.sk`.
- **Cloudflare Turnstile pred spustením kvízu** — výzva sa overuje SERVEROVO
  (PHP → siteverify), takže samotný klientsky callback bránu neotvorí. Token
  je jednorazový, viazaný na akciu aj na hostname. Pred zdieľaným výsledkom
  (`/r/<hash>`) je widget tiež, ale vedome len ako UX prvok, nie ochrana:
  tie stránky sú statické súbory a ten istý anonymizovaný dataset verejne
  stojí na `/peers`. Na botov slúži WAF v Cloudflare, nie táto výzva.
- Značka rozlíšená: `digitalizuj.to` je marketingový názov nástroja,
  `MATPEX SK` je spoločnosť, ktorá za projektom stojí — premietnuté do
  štruktúrovaných dát (Organization vs. WebApplication) aj do názvu karty
  prehliadača.
- **Meranie návštevnosti (GA4) so súhlasom vopred** — Google Analytics 4 sa
  načíta až po udelení súhlasu; bez neho na Google neodíde ani IP adresa.
  Rozhodnutie je meraný záver, nie opatrnosť: v režime „denied" by pingy
  odchádzali, ale do reportov by sa dostali výlučne cez behaviorálne
  modelovanie od 1 000 súhlasiacich používateľov denne — prah pre web tejto
  veľkosti nedosiahnuteľný, čiže dáta von a reporty prázdne. Preklik na
  spodný reklamný banner sa meria ako `select_promotion`.
- Súkromie ako architektúra: odpovede sa nikdy neodosielajú na server,
  DB drží len obsah modelu. Meranie návštevnosti (GA4) sa načíta až po
  udelení súhlasu — dovtedy na Google neodchádza nič, ani IP adresa;
  obsah odpovedí sa nemeria nikdy.

### Kvalita a testy

- Vitest v projekte — prvých 16 jednotkových testov (roiEngine) vrátane
  opravy miešania hodnôt `ind_05` do manuálnych procesov.
- Bezpečnostný a výkonový audit; multi-agentové revízie dizajnu, otázkovej
  banky aj SEO s adversariálnou verifikáciou nálezov.

### Známe obmedzenia

- Benchmark hodnoty pre sektor/veľkosť firmy a Operational Readiness mediány sú expertné odhady, nie empirické dáta z vlastného datasetu.
- ROI model odhaduje len potenciál úspor (bez investičných nákladov, bez adopčnej krivky) — výstup je ročný run-rate po plnej implementácii.
- Mikrofirmy (< 10 zamestnancov) nie sú pokryté Eurostat DII dátami.
- Self-reported dáta bez nezávislej verifikácie.
- DII skóre je aproximácia (plochý priemer označených otázok), nie per-indikátorová agregácia podľa oficiálnej Eurostat metodiky — podrobnosti v `SCORING_SPEC.md` §2.
- CS/EN mutácie majú preložené rozhranie, obsahové podstránky zatiaľ po slovensky. ROI hodinová sadzba je zatiaľ jednotná (SK NACE J 30,8 €/h) — per-trh sadzby sú v pláne (ČR 2025: 34,9 €/h už zresearchované).
- Ďalšie otvorené položky sledované v `IMPROVEMENT_CHECKLIST.md`.

### Technológie

Next.js 16 (App Router, statický export) · React 19 · TypeScript 5 · Tailwind CSS 4 · Recharts 3 · next-intl · React Context + `useReducer` · Vitest · MariaDB 11.4 (obsah modelu; publish cez PHP 8) · Apache 2.4 + `.htaccess` — výpočty bežia plne client-side, odpovede neopúšťajú prehliadač.
