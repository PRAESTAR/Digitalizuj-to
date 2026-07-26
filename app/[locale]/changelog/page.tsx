import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — zmeny metodiky a scoringu digitálnej zrelosti',
  description:
    'Verejná história zmien metodiky merania digitálnej zrelosti: úpravy scoringu, benchmark dát (Eurostat DII 2025), rizikových faktorov a otázkovej banky.',
  keywords: [
    'metodika digitálnej zrelosti',
    'zmeny scoringu DII',
    'Eurostat DII 2025',
    'ODRM model',
    'changelog digitalizuj.to',
  ],
  alternates: {
    canonical: '/changelog',
  },
  openGraph: {
    title: 'Changelog — zmeny metodiky a scoringu digitálnej zrelosti',
    description:
      'Verejná história zmien metodiky merania digitálnej zrelosti: scoring, benchmark dáta (Eurostat DII 2025), rizikové faktory a otázková banka.',
    url: '/changelog',
    type: 'article',
    // Signál čerstvosti — legislatívne a metodické témy sa re-crawlujú
    // častejšie a AI vyhľadávače uprednostňujú datovaný obsah.
    modifiedTime: '2026-07-24T00:00:00.000Z',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Úvod',
      item: 'https://digitalizuj.to/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Changelog',
      item: 'https://digitalizuj.to/changelog',
    },
  ],
};

const changelog = [
  {
    version: '1.1.0',
    date: '2026-07-24',
    sections: [
      {
        title: 'Trvalé odkazy',
        type: 'added' as const,
        items: [
          {
            title: 'Automatické QR + hash',
            description: 'Permanentný odkaz a QR kód sa vygenerujú a zobrazia hneď po dokončení kvízu — predtým vyžadovalo kliknutie na tlačidlo. Platí pre /results aj /r/[hash].',
          },
          {
            title: 'Opravený titulok zdieľaného výsledku',
            description: 'Vlastný (nie peer) výsledok cez /r/[hash] už nezobrazuje zavádzajúci titulok „Výsledok nenájdený".',
          },
        ],
      },
      {
        title: 'Živá výsledková karta v hero sekcii',
        type: 'added' as const,
        items: [
          {
            title: 'Karta strieda ukážkové výsledky',
            description: 'V slučke sa striedajú štyri profily (skóre, DII, riziko, odhad úspory), aby bolo vidieť, že nástroj vracia rôzne výsledky. Hodnoty sa vysunú zospodu ako pri prepočítaní, radar sa prekreslí do nového tvaru.',
          },
          {
            title: 'Radarový ping namiesto blikania',
            description: 'Bodka „naživo v prehliadači" má teraz rozpínajúci sa prstenec; vonkajší obrys radaru pomaly dýcha. Pri prefers-reduced-motion sa nič nehýbe.',
          },
        ],
      },
      {
        title: 'Výsledková karta sa pri skrolovaní roztrhne a rozpadne',
        type: 'added' as const,
        items: [
          {
            title: 'Text sa trhá spolu s papierom',
            description: 'Každý pás nesie vlastnú kópiu obsahu orezanú na svoj tvar, takže nápisy a čísla sú prerezané trhacou líniou a zostávajú na svojom útržku („78/1|00"), namiesto aby padali zvlášť popri papieri.',
          },
          {
            title: 'Roztrhnutie karty na päť zvislých pásov',
            description: 'Karta sa pri skrolovaní roztrhne pozdĺž štyroch zubatých zvislých línií na päť pásov, ktoré sa rozostúpia do strán, pootočia a mierne padajú — ako roztrhnutý papier. Obsah sa súčasne rozsype cez vzniknuté trhliny. Pásy nestrácajú krytie, len odídu zo záberu. V pokoji na seba presne nadväzujú, karta vyzerá ako jeden celok.',
          },
          {
            title: 'Animácia zodpovedá metodike',
            description: 'Metodika sľubuje, že každé skóre je auditovateľné a spätne rozložiteľné — karta to predvedie. Poradie oddelenia kopíruje poradie odvodenia; headline skóre drží najdlhšie.',
          },
          {
            title: 'Bez dopadu na plynulosť skrolovania',
            description: 'CSS scroll-driven animácia (view-timeline) na kompozítore, nie JS scroll listener; animuje len transform a opacity. Pri prefers-reduced-motion alebo bez podpory v prehliadači zostane karta statická.',
          },
        ],
      },
      {
        title: 'Plynulý prechod hero → „Vyberte si diagnostiku"',
        type: 'added' as const,
        items: [
          {
            title: 'Zmiznutý „šev" na hranici hero sekcie',
            description: 'Aurora wash sa už neorezáva natvrdo na hranici sekcie (overflow-hidden), ale plynulo sa stráca (mask-image fade) do pozadia nasledujúcej sekcie.',
          },
          {
            title: 'Plynulé skrolovanie na kotvy',
            description: `Pridané scroll-behavior: smooth — „Začať diagnostiku" a „Čo presne dostanete" už neskáču na cieľ okamžite.`,
          },
          {
            title: 'Menej trhané skrolovanie cez hero',
            description: 'Aurora-blob animácie už neanimujú scale() (len translate3d), čo predtým pri skrolovaní spôsobovalo sekanie.',
          },
        ],
      },
      {
        title: 'Business Impact — krivky namiesto jedného čísla',
        type: 'added' as const,
        items: [
          {
            title: 'Kumulatívna úspora ako tri krivky v čase',
            description: 'Konzervatívny/reálny/optimistický scenár zobrazené ako krivky na 24-mesačnom horizonte (analogicky k investičnej projekcii), nie ako jedno statické ročné číslo. Lineárny nábeh k plnému run-rate za 3/6/9 mesiacov podľa scenára.',
          },
          {
            title: `Scenár „Stredný" premenovaný na „Reálny"`,
            description: 'Naprieč UI aj dokumentáciou — interný dátový kľúč zostáva mid.',
          },
        ],
      },
      {
        title: 'Vizuálny dizajn — plošná konzistencia',
        type: 'added' as const,
        items: [
          {
            title: 'Apple.com štýl naprieč celou aplikáciou',
            description: 'Predtým len na homepage — teraz aj kvíz, výsledkový dashboard, /peers, /changelog, zdieľané výsledky a 404/error stránky. Zjednotená neutrálna paleta, jedno CTA tlačidlo (.btn-apple-primary), odstránené sýte gradienty, farebné glow tiene a bounce/idle animácie.',
          },
          {
            title: 'Reklamný banner bez animácie',
            description: 'Placeholder pre budúcu reklamu zostáva, ale bez pôvodného pestrého animovaného gradientu.',
          },
        ],
      },
      {
        title: 'Oprava branching logiky',
        type: 'added' as const,
        items: [
          {
            title: `Akcia 'include' bola no-op`,
            description: '5 otázok (cx_B06_ecommerce, cx_B05b_outsource, cx_D03_server, cx_D04_virtualization, cx_D05_cloud) sa zobrazovalo úplne všetkým respondentom bez ohľadu na relevanciu. Nahradené funkčnými invertovanými skip pravidlami; cx_D02 teraz správne pokrýva aj hodnotu saas_only.',
          },
          {
            title: 'Reálne premenlivý počet otázok',
            description: 'Komplexný kvíz teraz zobrazuje 43–49 otázok podľa vetvy namiesto takmer fixných ~48 pre každého.',
          },
        ],
      },
      {
        title: 'Risk faktory — opravené a nové',
        type: 'added' as const,
        items: [
          {
            title: 'RF06 a RF12 už nie sú mŕtve',
            description: 'Boli trvalo neaktivovateľné — žiadna otázka ich nemohla vyvolať. RF06 napojený na novú možnosť v cx_B02, RF12 na novú otázku cx_D08_app_lifecycle.',
          },
          {
            title: 'RF13 a RF14 — dva nové risk faktory',
            description: 'Nepripravenosť na povinnú e-fakturáciu od 1.1.2027 a nepripravenosť na NIS2 — spolu teraz 14 risk faktorov (RF01–RF14) namiesto 12.',
          },
          {
            title: 'Nová NIS2 screening otázka',
            description: 'cx_E08_nis2 (zákon č. 366/2024 Z. z.) sa zobrazuje len stredným/veľkým firmám vo výrobe, doprave/logistike a IT/telekomunikáciách.',
          },
        ],
      },
      {
        title: 'Otázková banka — aktuálnosť 2026',
        type: 'added' as const,
        items: [
          {
            title: 'EU AI Act v tooltipe AI governance otázky',
            description: 'Nariadenie EÚ 2024/1689, fázovo účinné 2025–2027.',
          },
          {
            title: 'AI agenti v tooltipoch AI otázok',
            description: 'Doplnené popri chatbotoch a generatívnej AI ako rýchlo rastúca kategória použitia.',
          },
        ],
      },
      {
        title: 'Výkon',
        type: 'added' as const,
        items: [
          {
            title: 'AssessmentProvider scoped na kvízové routy',
            description: '/peers a /changelog už nesťahujú 80 KB otázkovej banky a scoring enginov, ktoré nikdy nepoužijú.',
          },
          {
            title: 'Lazy-loading RadarChart a QR kódu',
            description: 'next/dynamic namiesto blokovania hydratácie celej výsledkovej stránky (~110 KB gzip recharts).',
          },
          {
            title: 'Statické opengraph-image',
            description: 'Odstránený edge runtime — generuje sa raz pri builde namiesto pri každom requeste.',
          },
        ],
      },
      {
        title: 'Bezpečnosť',
        type: 'added' as const,
        items: [
          {
            title: 'Opravené 3 high-severity zraniteľnosti',
            description: 'postcss a sharp (transitívne cez next) opravené cez package.json overrides namiesto downgradu Next.js na 9.3.3 — npm audit teraz hlási 0 zraniteľností.',
          },
        ],
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-24',
    sections: [
      {
        title: 'Jadro platformy',
        type: 'added' as const,
        items: [
          {
            title: 'Adaptívny dotazník',
            description: 'Indikatívny kvíz (15 otázok, 5–7 min) a komplexný kvíz (45+ otázok v 6 moduloch A–F, 15–20 min). Branching logika (skip, include, flag_risk), možnosť „Neviem" pri každej otázke.',
          },
          {
            title: '5 nezávislých výstupov',
            description: 'DII-Compatible Score (0–100 → 0–12), Operational Readiness Score (0–100, 6 kategórií), AI & Automatizácia Readiness (0–100, prierezový index), Technical Debt & Risk Index (0–100, 12 risk faktorov), Business Impact Potential (3 scenáre).',
          },
          {
            title: 'Interaktívny výsledkový dashboard',
            description: 'Score cards, radarový graf, Executive Summary, Risk panel, Business Impact tabuľka, 3-fázová roadmapa odporúčaní, benchmark porovnanie SK/EÚ/sektor/veľkosť, audit trail.',
          },
          {
            title: 'Trvalé odkazy a peer porovnanie',
            description: 'Zdieľateľný výsledok (/r/hash) s QR kódom, anonymizovaný snapshot bez PII, porovnanie voči firmám podobnej veľkosti a sektora.',
          },
          {
            title: 'Lokálne spracovanie',
            description: 'Žiadne dáta sa neodosielajú na server — všetko beží v prehliadači (localStorage pre trvalé odkazy).',
          },
          {
            title: 'Konfiguračný priečinok',
            description: 'config/model/ — editovateľné JSON/MD súbory pre otázky, scoring parametre, benchmark dáta a kompletnú metodickú dokumentáciu.',
          },
        ],
      },
      {
        title: 'Metodika a benchmark dáta',
        type: 'added' as const,
        items: [
          {
            title: 'Benchmark ukotvený na Eurostat DII 2025',
            description: 'Dataset ISOC_E_DII, verzia 2025-DII-v3 (prieskum 2025): SK distribúcia 41,6/32,0/20,4/6,0 %, EÚ-27 27,9/34,5/27,5/10,1 % podľa pásiem digitálnej intenzity; odvodené mediány SK 4,3 / EÚ 5,4.',
          },
          {
            title: '12 DII premenných zosúladených s aktuálnou v3/2025 sadou',
            description: 'Dvojročná rotácia verzií Eurostatu (v4/2024 ↔ v3/2025) zdokumentovaná; referenčné KPI Digitálnej dekády (SME so základnou digitálnou intenzitou: SK 57,1 % vs. EÚ 71,4 %, cieľ 90 % do 2030).',
          },
          {
            title: 'ROI model s hodinovou cenou práce IT sektora SR',
            description: '30,8 €/h (Eurostat lc_lci_lev 2025, NACE J — Informácie a komunikácia). Otázka na hodinovú cenu bola z dotazníka odstránená (citlivý údaj, nekonzistentné self-reported odhady) — model vždy počíta s benchmarkom naviazaným na sektor, ktorý digitalizačné projekty typicky rieši.',
          },
          {
            title: 'Regulačný kontext 2025–2027',
            description: 'NIS2 (zákon č. 366/2024 Z. z.), povinná B2B e-fakturácia od 1. 1. 2027 (Peppol, EN 16931), AI Act — premietnuté do metodiky a odporúčaní.',
          },
        ],
      },
      {
        title: 'Dokumentácia zosúladená s implementáciou',
        type: 'added' as const,
        items: [
          {
            title: 'Kompletná revízia metodických dokumentov',
            description: 'SCORING_SPEC.md, RECOMMENDATION_RULES.md a QUESTION_BANK_GUIDE.md prepísané tak, aby presne opisovali skutočné správanie kódu — predtým viaceré popisovali plánovanú, neimplementovanú logiku.',
          },
          {
            title: 'METHODOLOGY.md, BENCHMARK_SPEC.md, ARCHITECTURE.md',
            description: 'Odstránené „MVP draft" rámcovanie, doplnená AI & Automatizácia Readiness, opravený zastaraný dátový model a štruktúra súborov.',
          },
          {
            title: 'README.md s diagramami architektúry',
            description: 'Dva Mermaid diagramy — technologická architektúra vrstiev a aplikačný tok od dotazníka po zdieľaný odkaz.',
          },
        ],
      },
      {
        title: 'Vizuálny dizajn',
        type: 'added' as const,
        items: [
          {
            title: 'Redizajn v apple.com štýle',
            description: 'Svetlé pozadie, veľký nadpis s gradientovým akcentom, plávajúca náhľadová karta výsledkov, čierne „Buy"-štýl CTA tlačidlo.',
          },
          {
            title: 'Font Onest',
            description: 'SF Pro–podobné proporcie s plnou podporou slovenskej diakritiky — nahradil predchádzajúci fallback (opravený bug, kde telo stránky renderovalo v Arial/Helvetica).',
          },
        ],
      },
      {
        title: 'Opravy scoringu a logiky',
        type: 'added' as const,
        items: [
          {
            title: 'Bezpečnostná penalizácia len pre meranú kategóriu E',
            description: 'Predtým nemeraná kategória dostala maximálnu penalizáciu ORS −30 % bez jediného dôkazu o probléme.',
          },
          {
            title: 'Risk index ignoruje „Neviem" a informačné otázky',
            description: 'Predtým napr. RF06 penalta pre každého respondenta komplexného kvízu bez ohľadu na odpoveď.',
          },
          {
            title: 'Benchmark gap prahy prepočítané pre DII škálu 0–12',
            description: 'Extrémne popisky („Výrazne nad/pod priemerom") boli na tejto škále predtým matematicky nedosiahnuteľné.',
          },
          {
            title: 'Transformačné odporúčania (12+ mesiacov) sa opäť zobrazujú',
            description: 'Predtým sa vypočítali, ale zahadzovali pred zobrazením v roadmape.',
          },
        ],
      },
      {
        title: 'Známe obmedzenia',
        type: 'known' as const,
        items: [
          { title: 'Expertné benchmarky', description: 'Sektorové/veľkostné a ORS mediány sú odhady, nie empirické dáta z vlastného datasetu' },
          { title: 'Zjednodušený ROI model', description: 'Odhaduje len potenciál úspor (bez investičných nákladov, bez adopčnej krivky) — výstup je ročný run-rate po plnej implementácii' },
          { title: 'Mikrofirmy', description: 'Firmy s menej ako 10 zamestnancami nie sú pokryté Eurostat DII dátami' },
          { title: 'Self-reported dáta', description: 'Bez nezávislej verifikácie' },
          { title: 'DII aproximácia', description: 'Plochý priemer označených otázok, nie per-indikátorová agregácia podľa oficiálnej Eurostat metodiky (SCORING_SPEC.md §2)' },
        ],
      },
      {
        title: 'Technológie',
        type: 'tech' as const,
        items: [
          { title: 'Next.js 16', description: 'App Router' },
          { title: 'React 19', description: 'UI framework' },
          { title: 'TypeScript 5', description: 'Typový systém' },
          { title: 'Tailwind CSS 4', description: 'Utility-first styling' },
          { title: 'Recharts 3', description: 'Radarový graf' },
          { title: 'React Context API', description: 'State management (useReducer, žiadny backend)' },
        ],
      },
    ],
  },
];

const sectionConfig = {
  added: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  tech: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  known: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-10 sm:pt-12 sm:pb-12">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm text-sm font-medium text-[#6e6e73] mb-6">
            <svg className="w-4 h-4 shrink-0 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            História zmien
          </div>
          {/* text-3xl na mobile: pri 150 % škálovaní textu má text-4xl 54 px
              a "Changelog" už presahuje 288 px dostupných na 320 px displeji. */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1d1d1f] mb-4 tracking-tight">
            Changelog
          </h1>
          <p className="text-[#6e6e73] text-base sm:text-lg max-w-xl mx-auto text-pretty">
            Prehľad všetkých verzií, nových funkcií a zmien v platforme digitalizuj.to
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-black/10 hidden md:block" />

          {changelog.map((release) => (
            <div key={release.version} className="relative mb-12 sm:mb-16">
              {/* Version badge */}
              <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
                <div className="relative z-10 w-12 h-12 shrink-0 rounded-2xl bg-[#1d1d1f]/8 flex items-center justify-center text-[#1d1d1f]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-[#1d1d1f]">
                    v{release.version}
                  </h2>
                  <p className="text-sm text-[#86868b] font-medium">
                    {new Date(release.date).toLocaleDateString('sk-SK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="md:ml-16 space-y-8">
                {release.sections.map((section) => {
                  const config = sectionConfig[section.type];
                  return (
                    <div
                      key={section.title}
                      className="rounded-3xl bg-white border border-black/5 shadow-sm p-4 sm:p-6 md:p-8 animate-fade-in-up"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center">
                          {config.icon}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] min-w-0 break-words">
                          {section.title}
                        </h3>
                        {/* shrink-0: počet položiek sa nesmie stlačiť pod
                            svoju šírku, inak vytečie zo zaobleného odznaku. */}
                        <span className="ml-auto shrink-0 text-xs font-bold px-3 py-1 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f]">
                          {section.items.length}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {section.items.map((item, i) => (
                          <div
                            key={i}
                            className="group flex gap-3 p-2 sm:p-3 rounded-2xl hover:bg-black/[0.03] transition-colors"
                          >
                            <div className="mt-1.5 flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#1d1d1f]/40" />
                            </div>
                            {/* min-w-0 + break-words: popisy obsahujú
                                nezalomiteľné identifikátory (cx_B06_ecommerce)
                                a výrazy s lomkami (Konzervatívny/reálny/…),
                                ktoré pri 150 % škálovaní pretekali stránku
                                o 127 px. hyphens-auto využíva lang="sk". */}
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1d1d1f] text-sm break-words">
                                {item.title}
                              </p>
                              <p className="text-sm text-[#6e6e73] mt-0.5 leading-relaxed break-words hyphens-auto">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="text-center mt-12 animate-fade-in">
          {/* max-w-full + flex-wrap: pri 150 % škálovaní sa text do 288 px
              širokého displeja na jeden riadok nezmestí. */}
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 px-5 py-3 rounded-3xl sm:rounded-full bg-white border border-black/5 shadow-sm">
            <span className="w-2 h-2 shrink-0 rounded-full bg-[#1d1d1f]/40" />
            <span className="text-sm text-[#6e6e73] font-medium break-words">
              Ďalšie verzie pripravujeme
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
