import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PEER_DATA,
  SECTOR_LABELS_SK,
  SIZE_BAND_LABELS_SK,
  getCountryAverages,
} from '@/data/peerData';

const SITE_URL = 'https://digitalizuj.to';

const SECTORS = Array.from(new Set(PEER_DATA.map((p) => p.sector)));

const COMPLETED_DATES = PEER_DATA.map((p) => p.completedAt).sort();
const COVERAGE_FROM = COMPLETED_DATES[0].slice(0, 10);
const COVERAGE_TO = COMPLETED_DATES[COMPLETED_DATES.length - 1].slice(0, 10);

/**
 * Táto stránka je od revízie SEO indexovateľná (predtým `noindex` + Disallow
 * v robots.txt). Je to jediná stránka s vlastnými štruktúrovanými dátami —
 * kým bola blokovaná, nemohla ju zaindexovať ani odcitovať žiadna
 * vyhľadávacia ani AI plocha. Neobsahuje žiadne osobné ani firemné údaje.
 */
export const metadata: Metadata = {
  title: `Benchmark digitálnej zrelosti — ${PEER_DATA.length} profilov firiem`,
  description: `Referenčná vzorka ${PEER_DATA.length} anonymizovaných profilov digitálnej zrelosti podľa sektora a veľkosti firmy: DII skóre, prevádzková zrelosť, index rizík a odhad úspor.`,
  keywords: [
    'benchmark digitálnej zrelosti',
    'digitálna zrelosť slovenských firiem',
    'DII skóre podľa sektora',
    'porovnanie digitalizácie firiem',
    'index digitálnej intenzity DII',
  ],
  alternates: { canonical: '/peers' },
  openGraph: {
    type: 'website',
    url: '/peers',
    title: `Benchmark digitálnej zrelosti — ${PEER_DATA.length} profilov firiem`,
    description: `Referenčná vzorka ${PEER_DATA.length} anonymizovaných profilov digitálnej zrelosti naprieč ${SECTORS.length} sektormi a 4 veľkostnými kategóriami.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
};

/**
 * Dataset markup — podceňovaný typ, z ktorého čerpá Google Dataset Search
 * aj AI research asistenti, a pre tému digitalizácie slovenských MSP je
 * tento fond prázdny.
 *
 * Popis explicitne hovorí, že ide o deterministickú referenčnú vzorku
 * kalibrovanú na Eurostat DII 2025, NIE o zber reálnych odpovedí — rovnako
 * ako viditeľná poznámka na konci stránky. Zámerne tu nie je `distribution`
 * ani `license`: stiahnuteľný CSV/JSON export zatiaľ neexistuje a licenčné
 * podmienky nie sú stanovené, takže by šlo o vymyslené údaje.
 */
const datasetSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  '@id': `${SITE_URL}/peers#dataset`,
  name: 'Benchmark digitálnej zrelosti slovenských MSP — referenčná vzorka',
  description: `Referenčná vzorka ${PEER_DATA.length} anonymizovaných profilov digitálnej zrelosti malých a stredných podnikov na Slovensku, rozložená naprieč ${SECTORS.length} sektormi a 4 veľkostnými kategóriami (mikro, malé, stredné, veľké). Pre každý profil: DII-Compatible Score (0–100 a 0–12), Operational Readiness Score (0–100) vrátane 6 čiastkových kategórií, Technical Debt & Risk Index (0–100) a Business Impact Potential v EUR ročne. Ide o deterministickú testovaciu vzorku kalibrovanú na distribúcie Eurostat DII 2025 (ISOC_E_DII) pre Slovensko — nie o zber reálnych odpovedí; žiadna konkrétna firma nie je reprezentovaná.`,
  url: `${SITE_URL}/peers`,
  inLanguage: 'sk-SK',
  isAccessibleForFree: true,
  creator: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
  spatialCoverage: {
    '@type': 'Country',
    name: 'Slovakia',
  },
  temporalCoverage: `${COVERAGE_FROM}/${COVERAGE_TO}`,
  isBasedOn: [
    'https://ec.europa.eu/eurostat/databrowser/view/isoc_e_dii/default/table',
  ],
  variableMeasured: [
    'DII-Compatible Score (0–100)',
    'DII raw score (0–12)',
    'Operational Readiness Score (0–100)',
    'Technical Debt & Risk Index (0–100)',
    'Business Impact Potential (EUR / rok)',
    'Sektor (NACE skupina)',
    'Veľkostná kategória podniku',
  ],
  keywords: [
    'digitálna zrelosť',
    'digitalizácia MSP',
    'Digital Intensity Index',
    'Slovensko',
    'benchmark',
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Úvod',
      item: `${SITE_URL}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Benchmark digitálnej zrelosti',
      item: `${SITE_URL}/peers`,
    },
  ],
};

export default function PeersPage() {
  const country = getCountryAverages();
  const sortedBySector = [...PEER_DATA].sort((a, b) =>
    a.sector === b.sector
      ? a.sizeBand.localeCompare(b.sizeBand)
      : a.sector.localeCompare(b.sector)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pt-16 pb-6 sm:pt-8 sm:pb-8 space-y-6 sm:space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Header */}
      <div className="animate-fade-in-up">
        <p className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide mb-2">
          Zákaznícka zóna &middot; Demo dáta
        </p>
        {/* H1 zosúladený s <title> — stránka je teraz indexovateľná, takže
            nadpis musí niesť cieľovú frázu, nie len interné pomenovanie. */}
        {/* Pri 150 % texte potrebovalo samotné slovo „anonymizovaných“ ~380 px
            pri 288 px dostupných — menšia mobilná veľkosť + break-words je
            jediné, čo udrží nadpis vnútri viewportu. */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-2 break-words">
          Benchmark digitálnej zrelosti &mdash; {PEER_DATA.length} anonymizovaných profilov
        </h1>
        <p className="text-[#6e6e73] max-w-3xl leading-relaxed">
          Testovacia vzorka 50 firiem naprieč {SECTORS.length} sektormi a 4 veľkostnými
          kategóriami. Každý riadok je preklikateľný na vlastnú stránku s peer porovnaním
          a QR kódom.
        </p>
      </div>

      {/* Country averages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in-up">
        <Stat label="Priemer DII" value={`${country.diiScore100}/100`} />
        <Stat label="Priemer ORS" value={`${country.orsScore}/100`} />
        <Stat label="Priemer Risk" value={`${country.tdriScore}/100`} />
        <Stat
          label="Priemer Business Impact"
          value={new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(country.businessImpactEur)}
        />
      </div>

      {/* Mobil: kartový zoznam namiesto tabuľky.
          Tabuľka má 9 stĺpcov a pri 320 px šírku 930 px — používateľ videl len
          ~30 % obsahu a jediná akcia riadku („Otvoriť“) bola úplne mimo
          obrazovky. Celá karta je preto odkaz: jeden veľký touch target
          namiesto 12 px vysokého textového odkazu za horizontálnym scrollom. */}
      <ul className="md:hidden space-y-3">
        {sortedBySector.map((p, i) => (
          <li key={p.hash}>
            <Link
              href={`/r/${p.hash}`}
              className="block bg-white rounded-3xl border border-black/5 shadow-sm p-4 hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[#1d1d1f] break-words">
                    {SECTOR_LABELS_SK[p.sector] ?? p.sector}
                  </p>
                  <p className="text-sm text-[#6e6e73] break-words">
                    {SIZE_BAND_LABELS_SK[p.sizeBand]}
                  </p>
                </div>
                <span className="shrink-0 pt-0.5 font-mono text-xs text-[#86868b]">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 mt-4">
                <CardMetric label="DII" value={`${p.diiScore100}`} />
                <CardMetric label="ORS" value={`${p.orsScore}`} />
                <CardMetric label="Risk" value={`${p.tdriScore}`} />
                <CardMetric
                  label="Impact"
                  value={new Intl.NumberFormat('sk-SK', {
                    notation: 'compact',
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(p.businessImpactEur)}
                />
              </dl>

              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-black/5">
                <span className="min-w-0 font-mono text-xs text-[#86868b] break-all">
                  {p.hash.slice(0, 8)}…
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[#0068d6]">
                  Otvoriť
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        {/* Na tablete sa 9 stĺpcov stále nezmestí — bez tohto textu nemal
            používateľ žiadny náznak, že sa dá scrollovať do boku. */}
        <p className="lg:hidden px-4 pt-3 text-xs text-[#86868b]">
          Tabuľku posuniete do boku.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.02]">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-[#86868b]">#</th>
                <th className="text-left py-3 px-4 font-semibold text-[#86868b]">Sektor</th>
                <th className="text-left py-3 px-4 font-semibold text-[#86868b]">Veľkosť</th>
                <th className="text-right py-3 px-4 font-semibold text-[#86868b]">DII</th>
                <th className="text-right py-3 px-4 font-semibold text-[#86868b]">ORS</th>
                <th className="text-right py-3 px-4 font-semibold text-[#86868b]">Risk</th>
                <th className="text-right py-3 px-4 font-semibold text-[#86868b]">Impact</th>
                <th className="text-right py-3 px-4 font-semibold text-[#86868b]">Hash</th>
                <th className="text-right py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {sortedBySector.map((p, i) => (
                <tr
                  key={p.hash}
                  className="border-t border-black/5 hover:bg-black/[0.02] transition-colors"
                >
                  <td className="py-3 px-4 text-[#86868b] font-mono text-xs">
                    {String(i + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4 text-[#1d1d1f] font-medium whitespace-nowrap">
                    {SECTOR_LABELS_SK[p.sector] ?? p.sector}
                  </td>
                  <td className="py-3 px-4 text-[#6e6e73] whitespace-nowrap">
                    {SIZE_BAND_LABELS_SK[p.sizeBand]}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#1d1d1f]">
                    {p.diiScore100}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#1d1d1f]">
                    {p.orsScore}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#1d1d1f]">
                    {p.tdriScore}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#6e6e73]">
                    {new Intl.NumberFormat('sk-SK', {
                      notation: 'compact',
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(p.businessImpactEur)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-[#86868b]">
                    {p.hash.slice(0, 8)}…
                  </td>
                  <td className="py-3 px-4 text-right">
                    {/* Tabuľka beží už od md, teda aj na dotykových tabletoch —
                        14 px vysoký textový odkaz je hlboko pod minimom 44×44.
                        Záporný margin drží pôvodnú výšku riadku. */}
                    <Link
                      href={`/r/${p.hash}`}
                      className="inline-flex items-center gap-1 min-h-11 -my-2 px-2 -mx-2 text-xs font-bold text-[#0068d6] hover:text-[#004a99] transition-colors"
                    >
                      Otvoriť
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#6e6e73] leading-relaxed">
        <strong className="text-[#1d1d1f]">Poznámka:</strong> tieto výsledky sú deterministické testovacie
        dáta — žiadna konkrétna firma nie je reprezentovaná. Distribúcie sú nakalibrované voči Eurostat
        DII 2025 (ISOC_E_DII) priemerom pre Slovensko.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    // Karta nemá overflow-hidden, takže hodnota „84 124 €“ pri zväčšenom texte
    // vytekala mimo rámček — menšie písmo na mobile plus break-words to drží dnu.
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-3 sm:p-4">
      <p className="text-[11px] sm:text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1 break-words">
        {label}
      </p>
      <p className="text-lg sm:text-xl font-bold text-[#1d1d1f] tracking-tight tabular-nums break-words">
        {value}
      </p>
    </div>
  );
}

/** Jedna metrika v mobilnej karte firmy — náhrada za stĺpec tabuľky. */
function CardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/[0.02] px-3 py-2 min-w-0">
      <dt className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
        {label}
      </dt>
      <dd className="font-mono font-bold text-[#1d1d1f] tabular-nums break-words">
        {value}
      </dd>
    </div>
  );
}
