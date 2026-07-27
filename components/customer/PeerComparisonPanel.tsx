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
    // p-6 na mobile ukrojilo 48 px zo 288 px viewportu; padding v rem navyše
    // rastie so zväčšeným textom, takže použiteľná šírka klesala práve vtedy,
    // keď písmo rástlo.
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        {/* Dekoratívny odznak zaberal na mobile 52 px šírky bez informačnej
            hodnoty — pod sm ho skrývame (pozor: pôvodné `flex` muselo zmiznúť,
            inak by `hidden` prepísalo len display a prvok by zostal viditeľný). */}
        <div
          className="hidden sm:flex w-10 h-10 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
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
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#1d1d1f] break-words">
            Porovnanie s peer skupinou a krajinou
          </h2>
          <p className="text-sm text-[#6e6e73] mt-1 leading-relaxed break-words">
            Vaša pozícia voči anonymizovaným výsledkom firiem zo segmentu
            <strong className="text-[#1d1d1f]"> {sectorLabel}</strong>,
            veľkosť <strong className="text-[#1d1d1f]">{sizeLabel}</strong>
            {' '}({cohort.length}{' '}firiem) a celého slovenského vzorky ({PEER_DATA.length}).
          </p>
        </div>
      </div>

      {/* Quick percentile chips.
          Nie grid-cols-3, ale wrap: Tailwind breakpointy sa pri zväčšenom
          texte NEposúvajú (@media rem sa viaže na initial 16 px), takže
          fixné 3 stĺpce držali čip na ~66 px, kým trojciferná hodnota
          potrebovala viac — číslo sa lámalo na „10“ / „0“. flex-basis v rem
          rastie spolu s textom, takže čipy sa pri 125/150 % samy preskupia
          do dvoch riadkov a pri 100 % zostanú tri vedľa seba. */}
      <div className="flex flex-wrap gap-2 mt-6 mb-6">
        <PercentileChip label="DII" pct={userPercentiles.dii} />
        <PercentileChip label="ORS" pct={userPercentiles.ors} />
        <PercentileChip label="Risk" pct={userPercentiles.tdri} />
      </div>

      {/* Mobil: kartový zoznam namiesto tabuľky.
          Tabuľka s 5 stĺpcami mala 519 px v 238 px okne, takže stĺpce
          „Peer medián“, „SK priemer“ a „Δ vs peer“ — teda celá pointa panelu —
          boli mimo obrazovky a nič nenaznačovalo, že sa dá scrollovať. */}
      <ul className="sm:hidden space-y-2">
        {rows.map((row) => {
          const peerMed = median(row.cohortValues);
          const delta = row.yours - peerMed;
          const better = row.inverted ? delta < 0 : delta > 0;
          const hasCohort = row.cohortValues.length > 0;
          return (
            <li
              key={row.label}
              className="rounded-2xl border border-black/5 bg-black/[0.02] p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 font-medium text-[#1d1d1f] break-words">
                  {row.label}
                </p>
                <p className="shrink-0 font-mono font-bold text-[#0068d6] tabular-nums">
                  {row.format(row.yours)}
                </p>
              </div>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="min-w-0 text-[#6e6e73] break-words">Peer medián</dt>
                  <dd className="shrink-0 font-mono text-[#1d1d1f] tabular-nums">
                    {hasCohort ? row.format(peerMed) : '—'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="min-w-0 text-[#6e6e73] break-words">SK priemer</dt>
                  <dd className="shrink-0 font-mono text-[#1d1d1f] tabular-nums">
                    {row.format(row.countryAvg)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="min-w-0 text-[#6e6e73] break-words">Δ vs peer</dt>
                  <dd className="shrink-0">
                    {hasCohort ? (
                      <span
                        className={`font-mono font-bold text-xs px-2 py-1 rounded-lg tabular-nums ${
                          better
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : delta === 0
                              ? 'bg-black/5 text-[#6e6e73]'
                              : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {delta > 0 ? '+' : ''}
                        {row.format(delta)}
                      </span>
                    ) : (
                      <span className="text-[#86868b] text-xs">—</span>
                    )}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>

      {/* Metric table */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-black/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/[0.03]">
              <th className="text-left py-3 px-4 text-[#6e6e73] font-bold">Metrika</th>
              <th className="text-right py-3 px-4 text-[#0068d6] font-bold">Vy</th>
              <th className="text-right py-3 px-4 text-[#6e6e73] font-bold">
                Peer medián
              </th>
              <th className="text-right py-3 px-4 text-[#6e6e73] font-bold">SK priemer</th>
              <th className="text-right py-3 px-4 text-[#6e6e73] font-bold">Δ vs peer</th>
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
                  className="border-b border-black/5 last:border-0"
                >
                  <td className="py-3 px-4 text-[#1d1d1f] font-medium">
                    {row.label}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0068d6]">
                    {row.format(row.yours)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#6e6e73]">
                    {row.cohortValues.length > 0 ? row.format(peerMed) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#6e6e73]">
                    {row.format(row.countryAvg)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.cohortValues.length > 0 ? (
                      <span
                        className={`font-mono font-bold text-xs px-2 py-1 rounded-lg ${
                          better
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : delta === 0
                              ? 'bg-black/5 text-[#6e6e73]'
                              : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {delta > 0 ? '+' : ''}
                        {row.format(Math.abs(delta)).replace(/[^\d€-]/g, (m) => m === '€' ? '€' : '')
                          ? row.format(delta)
                          : delta}
                      </span>
                    ) : (
                      <span className="text-[#86868b] text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#6e6e73] mt-4 leading-relaxed">
        <strong className="text-[#1d1d1f]">Anonymizácia:</strong>{' '}
        zobrazené sú iba agregáty — žiadne identifikačné údaje firiem.
        Δ porovnanie je oproti mediánu peer skupiny (rovnaký sektor a veľkosť).
      </p>
    </div>
  );
}

function PercentileChip({ label, pct }: { label: string; pct: number }) {
  const color =
    pct >= 75
      ? 'text-emerald-600'
      : pct >= 50
        ? 'text-cyan-600'
        : pct >= 25
          ? 'text-amber-600'
          : 'text-rose-600';
  return (
    <div className="grow basis-16 rounded-2xl bg-black/[0.03] border border-black/5 p-2 sm:p-4 text-center min-w-0">
      {/* Slovo „percentil“ potrebuje 69 px, ale bunka čipu má pri 320 px len
          ~56 px — nedá sa zalomiť, takže text vytekal mimo zaoblený rámček.
          Pod sm ho preto necháme len pre čítačky obrazovky (prístupný názov
          zostáva nezmenený), od sm sa zobrazí normálne. */}
      <p className="text-[11px] sm:text-xs font-bold text-[#6e6e73] uppercase tracking-wide mb-1 break-words">
        {label}
        <span className="sr-only sm:not-sr-only"> percentil</span>
      </p>
      {/* Rovnaká škála ako ScoreCard na /r/[hash]; break-words je posledná
          poistka, aby hodnota nikdy nevytiekla mimo zaoblený rámček. */}
      <p className={`text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums break-words ${color}`}>
        {pct}
      </p>
      <p className="text-[11px] sm:text-xs text-[#6e6e73] mt-1 break-words">
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
