import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PEER_DATA,
  SECTOR_LABELS_SK,
  SIZE_BAND_LABELS_SK,
  getCountryAverages,
} from '@/data/peerData';

export const metadata: Metadata = {
  title: 'Anonymizované výsledky',
  description:
    'Preskúmajte 50 anonymizovaných výsledkov diagnostiky digitálnej zrelosti slovenských firiem.',
  alternates: { canonical: '/peers' },
  robots: { index: false, follow: false },
};

const SECTORS = Array.from(new Set(PEER_DATA.map((p) => p.sector)));

export default function PeersPage() {
  const country = getCountryAverages();
  const sortedBySector = [...PEER_DATA].sort((a, b) =>
    a.sector === b.sector
      ? a.sizeBand.localeCompare(b.sizeBand)
      : a.sector.localeCompare(b.sector)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">
          Zákaznícka zóna &middot; Demo dáta
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Anonymizované výsledky ({PEER_DATA.length})
        </h1>
        <p className="text-slate-600 max-w-3xl leading-relaxed">
          Testovacia vzorka 50 firiem naprieč {SECTORS.length} sektormi a 4 veľkostnými
          kategóriami. Každý riadok je preklikateľný na vlastnú stránku s peer porovnaním
          a QR kódom.
        </p>
      </div>

      {/* Country averages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
        <Stat label="Priemer DII" value={`${country.diiScore100}/100`} accent="indigo" />
        <Stat label="Priemer ORS" value={`${country.orsScore}/100`} accent="cyan" />
        <Stat label="Priemer Risk" value={`${country.tdriScore}/100`} accent="rose" />
        <Stat
          label="Priemer Business Impact"
          value={new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(country.businessImpactEur)}
          accent="emerald"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 font-bold text-slate-500">#</th>
                <th className="text-left py-3 px-4 font-bold text-slate-500">Sektor</th>
                <th className="text-left py-3 px-4 font-bold text-slate-500">Veľkosť</th>
                <th className="text-right py-3 px-4 font-bold text-indigo-600">DII</th>
                <th className="text-right py-3 px-4 font-bold text-cyan-600">ORS</th>
                <th className="text-right py-3 px-4 font-bold text-rose-600">Risk</th>
                <th className="text-right py-3 px-4 font-bold text-emerald-600">Impact</th>
                <th className="text-right py-3 px-4 font-bold text-slate-500">Hash</th>
                <th className="text-right py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {sortedBySector.map((p, i) => (
                <tr
                  key={p.hash}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                    {String(i + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                    {SECTOR_LABELS_SK[p.sector] ?? p.sector}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {SIZE_BAND_LABELS_SK[p.sizeBand]}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                    {p.diiScore100}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-700">
                    {p.orsScore}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    {p.tdriScore}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">
                    {new Intl.NumberFormat('sk-SK', {
                      notation: 'compact',
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(p.businessImpactEur)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                    {p.hash.slice(0, 8)}…
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/r/${p.hash}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
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

      <p className="text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-700">Poznámka:</strong> tieto výsledky sú deterministické testovacie
        dáta — žiadna konkrétna firma nie je reprezentovaná. Distribúcie sú nakalibrované voči Eurostat
        DII 2025 (isoc_e_dii) priemerom pre Slovensko.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'indigo' | 'cyan' | 'rose' | 'emerald';
}) {
  const accentClass = {
    indigo: 'from-indigo-500 to-blue-600',
    cyan: 'from-cyan-500 to-teal-500',
    rose: 'from-rose-500 to-orange-500',
    emerald: 'from-emerald-500 to-green-600',
  }[accent];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div
        className={`inline-block w-1 h-5 rounded-full bg-gradient-to-b ${accentClass} mb-2`}
        aria-hidden="true"
      />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}
