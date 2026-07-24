import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'História zmien platformy digitalizuj.to — verzie, nové funkcie a vylepšenia Adaptívneho modelu DAP.',
  alternates: {
    canonical: '/changelog',
  },
  openGraph: {
    title: 'Changelog | digitalizuj.to',
    description:
      'História zmien platformy digitalizuj.to — verzie, nové funkcie a vylepšenia Adaptívneho modelu DAP.',
    url: '/changelog',
    type: 'article',
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
    version: '1.2.0-pre-alpha',
    date: '2026-07-24',
    sections: [
      {
        title: 'Pridané',
        type: 'added' as const,
        items: [
          {
            title: 'AI & Automatizácia Readiness Index',
            description: 'Nový 5. nezávislý výstup (0-100) popri DII/ORS/TDRI/Business Impact — prierezový index naprieč otázkami (rovnaká architektúra ako Technical Debt & Risk Index), vlastná karta vo výsledkoch, vlastné odporúčania. Nová otázka o AI aj v indikatívnom kvíze, dve nové otázky v komplexnom kvíze (automatizácia s AI, AI governance).',
          },
          {
            title: 'Vizuálny redizajn v apple.com štýle',
            description: 'Svetlé hero pozadie, konzistentný tmavý nav bar, gradientový akcent v nadpise, plávajúca karta s náhľadom výsledkov. Opravený font bug (telo stránky renderovalo v Arial namiesto načítaného fontu) — nový primárny font Onest.',
          },
        ],
      },
      {
        title: 'Odstránené',
        type: 'known' as const,
        items: [
          {
            title: 'Otázka na hodinovú cenu práce',
            description: 'Citlivý údaj, ktorý respondenti odhadovali nepresne a oba kvízy sa naň pýtali s odlišnou definíciou. ROI model teraz vždy počíta s priemernou hodinovou cenou práce na Slovensku (19,8 €/h, Eurostat 2025) namiesto self-reported hodnoty. Indikatívny kvíz má opäť 15 otázok.',
          },
        ],
      },
    ],
  },
  {
    version: '1.1.0-pre-alpha',
    date: '2026-07-23',
    sections: [
      {
        title: 'Zmenené',
        type: 'added' as const,
        items: [
          {
            title: 'Benchmark dáta aktualizované na Eurostat DII 2025',
            description: 'Nahradené zastarané „DESI 2024" dáta — nový dataset 2025-DII-v3 (isoc_e_dii, prieskum 2025, DII verzia 3): SK 41,6/32,0/20,4/6,0 %, EÚ-27 27,9/34,5/27,5/10,1 % podľa pásiem intenzity; odvodené mediány SK 4,3 / EÚ 5,4.',
          },
          {
            title: 'Metodika ukotvená na DII v3 (prieskum 2025)',
            description: 'Opravená tabuľka 12 DII premenných, zdokumentovaná rotácia verzií (v4/2024 vs. v3/2025), korektné citovanie datasetu isoc_e_dii namiesto „DESI", ročná aktualizačná politika benchmarkov.',
          },
          {
            title: 'ROI model — mzdové kotvy 2025/2026',
            description: 'Hodinová cena práce naviazaná na Eurostat lc_lci_lev 2025 (SK 19,8 €/h), ŠÚ SR mzdy 2025 (1 620 €/mes.), odvodový multiplikátor 1,362; doplnený zdrojový apendix.',
          },
          {
            title: 'Opravy scoringu a rizík',
            description: 'Bezpečnostná penalizácia sa aplikuje len na meranú kategóriu E; risk index ignoruje „Neviem" odpovede a informačné otázky; benchmark gap prahy prepočítané pre DII škálu 0–12; transformačné odporúčania (12+ mes.) sa opäť zobrazujú.',
          },
          {
            title: 'Otázková banka v1.1',
            description: 'Doplnená možnosť „Nemáme žiadne z uvedeného" pri bezpečnostnej otázke, risk flagy v indikatívnom kvíze zosúladené s komplexným, kontext povinnej B2B e-fakturácie od 2027, opravené poradie otázok.',
          },
        ],
      },
    ],
  },
  {
    version: '1.0.0-pre-alpha',
    date: '2026-04-10',
    sections: [
      {
        title: 'Pridané',
        type: 'added' as const,
        items: [
          {
            title: 'Dvojvrstvový model hodnotenia',
            description: 'DII-Compatible Layer (EU benchmark) + Operational Digital Readiness Model (ODRM)',
          },
          {
            title: 'Indikatívny kvíz',
            description: 'Rýchly screening — 12 otázok, orientačné skóre s confidence pásmom',
          },
          {
            title: 'Komplexný kvíz',
            description: '30+ otázok s adaptívnym branchingom, rozdelený do modulov A–F',
          },
          {
            title: 'Scoring engine — 4 nezávislé výstupy',
            description: 'DII-Compatible Score (0–100 → 0–12), Operational Readiness Score (0–100), Technical Debt & Risk Index (0–100), Business Impact Potential (hodiny/MD/€)',
          },
          {
            title: 'Interaktívny výsledkový dashboard',
            description: 'Score cards, radarový graf, executive summary, risk panel, business impact s 3 scenármi, odporúčania v 3-fázovej roadmape, benchmark porovnanie, audit trail',
          },
          {
            title: 'Adaptívny dotazník',
            description: 'Branching logika — skip_if, include_if, flag_risk. Otázky sa prispôsobujú odpovediam.',
          },
          {
            title: 'Benchmark dáta',
            description: 'Eurostat DESI 2024, 8 sektorov, 4 veľkostné kategórie, porovnanie SK vs. EU27',
          },
          {
            title: '12 DII indikátorov',
            description: 'Kompletné pokrytie Digital Intensity Index s granulárnym scoringom',
          },
          {
            title: '12 risk faktorov (RF01–RF12)',
            description: 'Technical Debt & Risk Index s kritickými, vysokými a strednými penalizáciami',
          },
          {
            title: 'ROI model',
            description: 'Process benchmarky pre fakturáciu, reporting, schvaľovanie, objednávky, HR onboarding',
          },
          {
            title: 'Konfiguračný priečinok',
            description: '/config/model/ — editovateľné JSON súbory, metodická dokumentácia, pokyny na editovanie',
          },
          {
            title: 'Lokálne spracovanie',
            description: 'Žiadne dáta sa neodosielajú na server. Všetko beží v prehliadači.',
          },
        ],
      },
      {
        title: 'Technológie',
        type: 'tech' as const,
        items: [
          { title: 'Next.js', description: 'App Router' },
          { title: 'TypeScript', description: 'Typový systém' },
          { title: 'Tailwind CSS v4', description: 'Utility-first styling' },
          { title: 'Recharts', description: 'Radarový graf' },
          { title: 'React Context API', description: 'State management' },
        ],
      },
      {
        title: 'Známe obmedzenia',
        type: 'known' as const,
        items: [
          { title: 'Statické benchmark dáta', description: 'Eurostat isoc_e_dii — aktualizujú sa manuálne podľa ročnej politiky' },
          { title: 'Expertné ORS benchmarky', description: 'ORS mediány sú odhady, nie empirické dáta' },
          { title: 'Zjednodušený ROI model', description: 'Iba úspory — nezahŕňa investičné náklady ani payback period' },
          { title: 'Mikrofirmy', description: 'Firmy s menej ako 10 zamestnancami nie sú pokryté Eurostatom' },
          { title: 'Self-reported dáta', description: 'Bez verifikácie — respondent môže odpovedať nepresne' },
        ],
      },
    ],
  },
];

const sectionConfig = {
  added: {
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-green-600',
    bg: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  tech: {
    color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  known: {
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-600',
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-mesh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-6">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            História zmien
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Changelog
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Prehľad všetkých verzií, nových funkcií a zmien v platforme digitalizuj.to
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-blue-200 to-transparent hidden md:block" />

          {changelog.map((release) => (
            <div key={release.version} className="relative mb-16">
              {/* Version badge */}
              <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    v{release.version}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium">
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
                      className={`rounded-3xl bg-gradient-to-br ${config.bg} border ${config.border} p-6 md:p-8 animate-fade-in-up`}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center shadow-md`}>
                          {config.icon}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {section.title}
                        </h3>
                        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${config.badge}`}>
                          {section.items.length}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {section.items.map((item, i) => (
                          <div
                            key={i}
                            className="group flex gap-3 p-3 rounded-2xl hover:bg-white/60 transition-colors"
                          >
                            <div className="mt-1 flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${config.gradient}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">
                                {item.title}
                              </p>
                              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
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
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm text-slate-500 font-medium">
              Ďalšie verzie pripravujeme
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
