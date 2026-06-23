'use client';

import {
  PEER_DATA,
  getPeerCohort,
  getCountryAverages,
  percentile,
  SECTOR_LABELS_SK,
  SIZE_BAND_LABELS_SK,
} from '@/data/peerData';
import type { PeerSnapshot } from '@/types';

interface PeerComparisonPanelProps {
  /** The user's own snapshot — used to position them on the distribution. */
  current: PeerSnapshot;
}

interface MetricRow {
  label: string;
  yours: number;
  cohortValues: number[];
  countryAvg: number;
  format: (v: number) => string;
  /** When true, lower is better (e.g. risk index). */
  inverted?: boolean;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export default function PeerComparisonPanel({ current }: PeerComparisonPanelProps) {
  const cohort = getPeerCohort(current.sector, current.sizeBand).filter(
    (p) => p.hash !== current.hash
  );
  const country = getCountryAverages();

  const cohortMedian = {
    dii: median(cohort.map((p) => p.diiScore100)),
    ors: median(cohort.map((p) => p.orsScore)),
    tdri: median(cohort.map((p) => p.tdriScore)),
    eur: median(cohort.map((p) => p.businessImpactEur)),
  };

  const allDii = PEER_DATA.map((p) => p.diiScore100).sort((a, b) => a - b);
  const allOrs = PEER_DATA.map((p) => p.orsScore).sort((a, b) => a - b);
  const allTdri = PEER_DATA.map((p) => p.tdriScore).sort((a, b) => a - b);

  const userPercentiles = {
    dii: percentile(allDii, current.diiScore100),
    ors: percentile(allOrs, current.orsScore),
    // For risk, lower is better — flip the percentile semantics so 100 = best.
    tdri: 100 - percentile(allTdri, current.tdriScore),
  };

  const rows: MetricRow[] = [
    {
      label: 'DII Score',
      yours: current.diiScore100,
      cohortValues: cohort.map((p) => p.diiScore100),
      countryAvg: country.diiScore100,
      format: (v) => `${v}/100`,
    },
    {
      label: 'Operational Readiness',
      yours: current.orsScore,
      cohortValues: cohort.map((p) => p.orsScore),
      countryAvg: country.orsScore,
      format: (v) => `${v}/100`,
    },
    {
      label: 'Risk Index (TDRI)',
      yours: current.tdriScore,
      cohortValues: cohort.map((p) => p.tdriScore),
      countryAvg: country.tdriScore,
      format: (v) => `${v}/100`,
      inverted: true,
    },
    {
      label: 'Business Impact',
      yours: current.businessImpactEur,
      cohortValues: cohort.map((p) => p.businessImpactEur),
      countryAvg: country.businessImpactEur,
      format: (v) =>
        new Intl.NumberFormat('sk-SK', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(v),
    },
  ];

  const sectorLabel =
    SECTOR_LABELS_SK[current.sector] ?? current.sector;
  const sizeLabel = SIZE_BAND_LABELS_SK[current.sizeBand];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Porovnanie s peer skupinou a krajinou
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Vaša pozícia voči anonymizovaným výsledkom firiem zo segmentu
            <strong className="text-slate-800"> {sectorLabel}</strong>,
            veľkosť <strong className="text-slate-800">{sizeLabel}</strong>
            {' '}({cohort.length}{' '}firiem) a celého slovenského vzorky ({PEER_DATA.length}).
          </p>
        </div>
      </div>

      {/* Quick percentile chips */}
      <div className="grid grid-cols-3 gap-2 mt-6 mb-6">
        <PercentileChip label="DII" pct={userPercentiles.dii} />
        <PercentileChip label="ORS" pct={userPercentiles.ors} />
        <PercentileChip label="Risk" pct={userPercentiles.tdri} />
      </div>

      {/* Metric table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left py-3 px-4 text-slate-500 font-bold">Metrika</th>
              <th className="text-right py-3 px-4 text-indigo-600 font-bold">Vy</th>
              <th className="text-right py-3 px-4 text-slate-500 font-bold">
                Peer medián
              </th>
              <th className="text-right py-3 px-4 text-slate-500 font-bold">SK priemer</th>
              <th className="text-right py-3 px-4 text-slate-500 font-bold">Δ vs peer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const peerMed = median(row.cohortValues);
              const delta = row.yours - peerMed;
              const better = row.inverted ? delta < 0 : delta > 0;
              return (
                <tr
                  key={row.label}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {row.label}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                    {row.format(row.yours)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {row.cohortValues.length > 0 ? row.format(peerMed) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {row.format(row.countryAvg)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.cohortValues.length > 0 ? (
                      <span
                        className={`font-mono font-bold text-xs px-2 py-1 rounded-lg ${
                          better
                            ? 'bg-emerald-50 text-emerald-700'
                            : delta === 0
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {delta > 0 ? '+' : ''}
                        {row.format(Math.abs(delta)).replace(/[^\d€-]/g, (m) => m === '€' ? '€' : '')
                          ? row.format(delta)
                          : delta}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        <strong className="text-slate-700">Anonymizácia:</strong>{' '}
        zobrazené sú iba agregáty — žiadne identifikačné údaje firiem.
        Δ porovnanie je oproti mediánu peer skupiny (rovnaký sektor a veľkosť).
      </p>
    </div>
  );
}

function PercentileChip({ label, pct }: { label: string; pct: number }) {
  const color =
    pct >= 75
      ? 'from-emerald-500 to-green-600'
      : pct >= 50
        ? 'from-cyan-500 to-blue-500'
        : pct >= 25
          ? 'from-amber-500 to-orange-500'
          : 'from-red-500 to-rose-500';
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
        {label} percentil
      </p>
      <p
        className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}
      >
        {pct}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {pct >= 75
          ? 'Top 25 %'
          : pct >= 50
            ? 'Nadpriemer'
            : pct >= 25
              ? 'Pod priemer'
              : 'Spodných 25 %'}
      </p>
    </div>
  );
}
