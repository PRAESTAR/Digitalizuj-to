# Changelog

Všetky významné zmeny v projekte digitalizuj.to sú dokumentované v tomto súbore.

Formát vychádza z [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) a projekt používa [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — vo vývoji

> **Otvorená verzia.** Tento záznam sa priebežne dopĺňa až do uzavretia
> verzie 1 (štart produkčnej domény). Posledná aktualizácia: 2026-08-02.
> Podrobná história jednotlivých krokov žije v git logu; sem patrí
> konsolidovaný obraz toho, čo verzia 1 prináša.

### Metodika a model

- **Dvojvrstvový model merania** — DII-Compatible Layer (12 premenných
  Eurostat DII, dataset `isoc_e_dii` verzia 3, prieskum 2025) + Operational
  Digital Readiness Model so 6 váženými oblasťami A–F (20/20/15/15/20/10 %).
  Benchmark SK 41,6/32,0/20,4/6,0 % vs EÚ-27 27,9/34,5/27,5/10,1 %.
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
- **Validátor modelu v builde** — 7 tried integritných kontrol; pri prvom
  behu odhalil odpojený rizikový faktor RF08.

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

- Štyri jazyky — SK (predvolený), CS, DE, EN — všetky routy pod `/{locale}`,
  prepínač cez inline SVG vlajky, jazyková negociácia koreňa podľa
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
- Staging `app.magors.net` s `X-Robots-Tag: noindex` do štartu produkčnej
  domény; FTPS deploy s resume; bajtovo overená zhoda nasadenia s buildom.
- Súkromie ako architektúra: odpovede sa nikdy neodosielajú na server,
  DB drží len obsah modelu, žiadne tracking cookies.

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
- CS/DE/EN mutácie majú preložené rozhranie, obsahové podstránky zatiaľ po slovensky; benchmark referencie sú kalibrované na SK.
- Ďalšie otvorené položky sledované v `IMPROVEMENT_CHECKLIST.md`.

### Technológie

Next.js 16 (App Router, statický export) · React 19 · TypeScript 5 · Tailwind CSS 4 · Recharts 3 · next-intl · React Context + `useReducer` · Vitest · MariaDB 11.4 (obsah modelu; publish cez PHP 8) · Apache 2.4 + `.htaccess` — výpočty bežia plne client-side, odpovede neopúšťajú prehliadač.
