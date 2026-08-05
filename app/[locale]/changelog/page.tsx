import type { Metadata } from 'next';

/**
 * Canonical na /sk/changelog vo všetkých mutáciách — obsah je len slovenský,
 * jazykové varianty sú duplicitné kópie (rovnaká politika ako /peers,
 * viď lib/seo.ts). Titulok skrátený pod ~60 znakov aj so sufixom šablóny.
 */
export const metadata: Metadata = {
  title: 'Changelog metodiky a scoringu',
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
    canonical: '/sk/changelog',
  },
  openGraph: {
    title: 'Changelog metodiky a scoringu',
    description:
      'Verejná história zmien metodiky merania digitálnej zrelosti: scoring, benchmark dáta (Eurostat DII 2025), rizikové faktory a otázková banka.',
    url: '/sk/changelog',
    type: 'article',
    // Signál čerstvosti — legislatívne a metodické témy sa re-crawlujú
    // častejšie a AI vyhľadávače uprednostňujú datovaný obsah.
    modifiedTime: '2026-08-02T00:00:00.000Z',
    // openGraph sa na podstránke nahrádza celý — bez explicitného obrázka
    // by karta zdieľania prišla o vizuál z file-konvencie v [locale].
    images: ['/sk/opengraph-image'],
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
      item: 'https://matpex.sk/sk',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Changelog',
      item: 'https://matpex.sk/sk/changelog',
    },
  ],
};

const changelog = [
  {
    version: '1.0',
    date: '2026-08-03',
    status: 'Otvorená verzia — priebežne dopĺňaná až do uzavretia v1',
    sections: [
      {
        title: 'Metodika a model',
        type: 'added' as const,
        items: [
          {
            title: 'Dvojvrstvový model merania',
            description: 'DII-Compatible Layer (12 premenných Eurostat DII, dataset isoc_e_dii verzia 3, prieskum 2025) + Operational Digital Readiness Model so 6 váženými oblasťami A–F. Benchmark: SK 41,6/32,0/20,4/6,0 % vs EÚ-27 27,9/34,5/27,5/10,1 %.',
          },
          {
            title: 'Otázková banka v1.5 — 65 otázok, kontext 2026',
            description: 'Adaptívny branching (15 alebo 43–49 otázok), nové otázky na NIS2 a zákon č. 366/2024 Z. z., povinnú B2B e-fakturáciu od 1. 1. 2027 (Peppol, EN 16931) a AI Act. Každá single-choice otázka má deklarovanú škálu; 35 ad-hoc škál normalizovaných.',
          },
          {
            title: '14 rizikových faktorov a index technologického dlhu',
            description: 'RF01–RF14 vrátane nepripravenosti na e-fakturáciu a NIS2; kritické riziká nemiznú v priemere — TDRI je samostatná dimenzia. Súčasťou aj AI & Automatizácia Readiness index.',
          },
          {
            title: 'Business Impact ako tri krivky',
            description: 'Konzervatívny, reálny a optimistický scenár úspor s ramp-up krivkou (9/6/3 mesiace) na 24-mesačnom horizonte — logika ako pri investičnom výhľade. Hodinová cena práce 30,8 €/h (Eurostat lc_lci_lev 2025, NACE J).',
          },
          {
            title: 'Validátor modelu v builde',
            description: 'Sedem tried integritných kontrol (branching ciele, poradie, osirotené rizikové faktory, škály…) beží pri každom builde — nekonzistentný model build zastaví. Pri prvom nasadení odhalil odpojený RF08.',
          },
        ],
      },
      {
        title: 'Výsledky a zdieľanie',
        type: 'added' as const,
        items: [
          {
            title: 'Automatický QR kód a permanentný odkaz',
            description: 'Po dokončení kvízu sa hneď vygeneruje 16-znakový base62 hash, QR kód a trvalý odkaz /r/[hash] — bez klikania. Zdieľa sa len anonymizovaný agregát; plný výsledok zostáva v prehliadači.',
          },
          {
            title: 'Výsledkový dashboard',
            description: 'DII skóre vs. EÚ a SK, radar 6 oblastí, risk panel, business impact s audit trailom a prioritizovaná roadmapa odporúčaní v 3 fázach. Benchmark tabuľka 50 anonymizovaných profilov na /peers.',
          },
        ],
      },
      {
        title: 'Dizajn a UX',
        type: 'added' as const,
        items: [
          {
            title: 'Apple-style dizajn naprieč celým webom',
            description: 'Jednotný vizuálny jazyk, aurora pozadie so spojitým gradientom bez švov medzi sekciami, svetelná stopa za kurzorom (kométa s guľôčkou presne na kurzore) na celej úvodnej stránke.',
          },
          {
            title: 'Živá výsledková karta s trhacou animáciou',
            description: 'Karta v hero sekcii strieda štyri ukážkové profily a pri skrolovaní sa roztrhne na 5 zvislých pásov aj s textom — CSS scroll-driven animácia na kompozítore, žiadny JS listener. Rešpektuje prefers-reduced-motion.',
          },
          {
            title: 'Mobile-first optimalizácia',
            description: 'Kartové zoznamy namiesto tabuliek, 44 px dotykové plochy (WCAG 2.2), skryté dekoratívne ikony na malých displejoch, ovládač veľkosti textu (100/125/150 %) na desktope.',
          },
        ],
      },
      {
        title: 'Viacjazyčnosť',
        type: 'added' as const,
        items: [
          {
            title: 'Tri trhy: Slovensko, Česko a EÚ',
            description: 'Voľba vlajky určuje jazyk AJ referenčné čísla: slovenčina nesie slovenský benchmark, čeština český (Eurostat DII 2025: ČR medián 5,6 — tesne nad priemerom EÚ), EÚ vlajka anglické rozhranie s priemerom EÚ-27. Routy pod /sk, /cs, /en; negociácia koreňa podľa Accept-Language.',
          },
          {
            title: 'UI chrome preložený vo všetkých komponentoch',
            description: '232 kľúčov na jazyk s overenou paritou; kvíz, výsledky, zákaznícka zóna aj chybové stránky. Formátovanie mien a dátumov cez Intl s locale odvodeným od jazyka. Obsahová vrstva (texty otázok, odporúčania) sa prekladá v ďalšom kroku cez databázu.',
          },
          {
            title: 'Ponuka jazyka podľa krajiny návštevníka',
            description: 'GeoIP hostingu (Cloudflare CF-IPCountry) cez same-origin /geo.php — žiadne tretie strany. Nenásilný banner v cieľovom jazyku namiesto tvrdého redirectu; manuálna voľba (vlajky či banner) sa pamätá rok v cookie a koreňová negociácia ju rešpektuje pred jazykom prehliadača.',
          },
        ],
      },
      {
        title: 'SEO a viditeľnosť',
        type: 'added' as const,
        items: [
          {
            title: 'Kompletná SEO revízia po i18n migrácii',
            description: 'Self-canonical každej jazykovej mutácie s preloženými titulkami, plný hreflang cluster s x-default, sitemap so 4 jazykmi homepage, per-locale OG obrázky a metadáta. Nepreložené podstránky poctivo canonicalizujú na /sk verziu.',
          },
          {
            title: 'Viditeľné FAQ a verejná metodika',
            description: '7 otázok (vrátane e-fakturácie 2027 a NIS2) viditeľných na stránke — FAQPage schéma sa stavia z tých istých prekladových kľúčov. Nová stránka /sk/metodika s DII pásmami, ODRM váhami a známymi obmedzeniami.',
          },
          {
            title: 'Pripravené pre AI vyhľadávače',
            description: 'llms.txt s metodikou a kľúčovými stránkami, explicitné povolenia pre AI crawlery v robots.txt, JSON-LD graf (Organization, WebSite, WebApplication, Dataset) s lokalizovaným inLanguage.',
          },
          {
            title: 'Core Web Vitals',
            description: 'Variabilný font namiesto 12 samostatných váh (3 preloady namiesto 13), immutable cache na statické assety, klientská navigácia bez layout shiftov, recharts len na výsledkovej ceste.',
          },
        ],
      },
      {
        title: 'Databáza a správa obsahu',
        type: 'added' as const,
        items: [
          {
            title: 'Otázková banka v MariaDB 11.4',
            description: '13 tabuliek s referenčnou integritou — cieľ vetvenia aj rizikový faktor musia existovať už na úrovni dát. Podmienky vetvenia uložené surovo aj štruktúrovane, i18n stĺpce pripravené na preklad obsahu.',
          },
          {
            title: 'Publish s integritnou bránou',
            description: 'Editácia v phpMyAdmin → publish.php spustí SQL kontroly (odmietne nekonzistentný model) a skompiluje verziovaný artefakt. Kompilát je hĺbkovo zhodný s pôvodným JSON; PHP a Node kompilátory dávajú bajtovo identický výstup (SHA-256).',
          },
          {
            title: 'model:pull — most medzi DB a repozitárom',
            description: 'Stiahne publikovaný artefakt, zvaliduje ho validátorom buildu a až potom prepíše zdrojové súbory; pri zlyhaní rollback. Git zostáva nasadzovacím zdrojom pravdy, DB editačným.',
          },
        ],
      },
      {
        title: 'Hosting a nasadenie',
        type: 'tech' as const,
        items: [
          {
            title: 'Statický export pre Apache/PHP webhosting',
            description: 'Build cez output:export (231 stránok); serverovú logiku preberá .htaccess — bezpečnostné hlavičky (CSP, HSTS), legacy 301 presmerovania, jazyková negociácia s Vary a mapovanie čistých URL na .html súbory.',
          },
          {
            title: 'Staging na app.magors.net',
            description: 'FTPS deploy s resume a paralelnými spojeniami počas prípravy; staging niesol X-Robots-Tag noindex. Bajtovo overená zhoda nasadených stránok s buildom.',
          },
          {
            title: 'Produkčná doména matpex.sk spustená',
            description: 'Nový FTP účet a nová databáza Digitalizuj (rotované prihlasovacie údaje a publish token). Pôvodný docroot niesol aktívny WordPress, ktorý bol pred nasadením appky odstránený. Canonicaly mieria priamo na matpex.sk, staging noindex blok sa na produkcii nepoužíva.',
          },
          {
            title: 'Overenie Cloudflare Turnstile pred spustením kvízu',
            description: 'Výzva sa overuje na serveri (PHP volá Cloudflare siteverify), takže samotný klientsky callback bránu neotvorí. Token platí jednorazovo, päť minút, a je viazaný na konkrétnu akciu aj na doménu. Pred zdieľaným výsledkom je widget tiež, ale vedome len ako prvok rozhrania — tie stránky sú predgenerované súbory a rovnaký anonymizovaný dataset je verejne dostupný na stránke benchmarku.',
          },
          {
            title: 'Meranie návštevnosti so súhlasom vopred',
            description: 'Google Analytics 4 sa načíta až po udelení súhlasu — dovtedy na Google neodíde ani IP adresa. Alternatíva (skript beží, úložisko odmietnuté) by dáta posielala, ale do reportov by sa dostali len cez modelovanie od 1 000 súhlasiacich používateľov denne, čo je pre web tejto veľkosti nedosiahnuteľné. Preklik na spodný reklamný banner sa meria ako select_promotion.',
          },
          {
            title: 'Súkromie ako architektúra',
            description: 'Odpovede a výsledky sa spracúvajú výlučne v prehliadači — na server sa neodosielajú a databáza drží len obsah modelu. Návštevnosť meriame cez Google Analytics 4, ktorý sa načíta až po udelení súhlasu: dovtedy na Google neodchádza nič, ani IP adresa, a nenastaví sa žiadna cookie. Obsah odpovedí sa do merania nedostane nikdy.',
          },
        ],
      },
      {
        title: 'Kvalita a testy',
        type: 'tech' as const,
        items: [
          {
            title: 'Vitest v projekte',
            description: 'Prvé jednotkové testy (16 testov roiEngine) vrátane opravy: indikatívny ROI už nemieša hodnoty otázky o systémoch do zoznamu manuálnych procesov.',
          },
          {
            title: 'Bezpečnostný a výkonový audit',
            description: 'CSP bez unsafe-eval v produkcii, security headers, audit výkonu načítavania; priebežné multi-agentové revízie dizajnu, otázkovej banky aj SEO s adversariálnou verifikáciou nálezov.',
          },
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
      <div className="site-container pt-16 pb-10 sm:pt-12 sm:pb-12">
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
                  {release.status && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#0068d6]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0068d6] shrink-0" aria-hidden="true" />
                      {release.status}
                    </p>
                  )}
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
