'use client';

import type { BenchmarkResults, DIIScore } from '@/types';
import { benchmarkData } from '@/data/benchmarkData';

interface BenchmarkComparisonProps {
  benchmarks: BenchmarkResults;
  dii: DIIScore;
}

export default function BenchmarkComparison({ benchmarks, dii }: BenchmarkComparisonProps) {
  return (
    // p-8 na mobile ukrojilo 64 px zo šírky karty; padding nabieha až od sm
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6 lg:p-8 animate-fade-in-up relative overflow-hidden">
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="min-w-0 text-lg sm:text-xl font-bold text-[#1d1d1f]">
            Benchmark porovnanie
          </h2>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 stagger-children">
          <BenchmarkCard
            title="DII vs. Slovensko"
            icon="🇸🇰"
            value={`${dii.score12}/12`}
            gap={benchmarks.diiVsSk.gap}
            label={benchmarks.diiVsSk.labelSk}
            percentile={benchmarks.diiVsSk.percentile}
          />
          <BenchmarkCard
            title="DII vs. EÚ priemer"
            icon="🇪🇺"
            value={`${dii.score12}/12`}
            gap={benchmarks.diiVsEu.gap}
            label={benchmarks.diiVsEu.labelSk}
            percentile={benchmarks.diiVsEu.percentile}
          />
          <BenchmarkCard
            title="DII vs. váš sektor"
            icon="🏢"
            value={`${dii.score12}/12`}
            gap={benchmarks.diiVsSector.gap}
            label={benchmarks.diiVsSector.labelSk}
          />
          <BenchmarkCard
            title="Operačná zrelosť vs. sektor"
            icon="⚙️"
            gap={benchmarks.orsVsSector.gap}
            label={benchmarks.orsVsSector.labelSk}
            disclaimer={benchmarks.orsVsSector.disclaimer}
          />
        </div>

        {/* items-start + shrink-0: pri zalomení zdroja na 2-3 riadky musí bodka zostať hore a nesmie sa stlačiť */}
        <div className="mt-6 text-xs text-[#86868b] font-medium flex items-start gap-2">
          <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 mt-1.5 rounded-full bg-black/10" />
          <span className="min-w-0 break-words">
            Benchmark dáta: {benchmarkData.source}. Verzia: {benchmarkData.version} ({benchmarkData.lastUpdated}).
          </span>
        </div>
      </div>
    </div>
  );
}

function BenchmarkCard({
  title,
  icon,
  value,
  gap,
  label,
  percentile,
  disclaimer,
}: {
  title: string;
  icon: string;
  value?: string;
  gap: number;
  label: string;
  percentile?: number;
  disclaimer?: string;
}) {
  const isPositive = gap >= 0;

  return (
    <div className="group p-4 sm:p-5 rounded-2xl bg-white border border-black/5 hover:border-black/10 hover:shadow-sm transition-all duration-300 hover-lift">
      {/* items-start: dlhé názvy („Operačná zrelosť vs. sektor") sa pri 320 px zalomia na dva riadky */}
      <div className="flex items-start gap-2 mb-3">
        <span aria-hidden="true" className="text-lg leading-tight shrink-0">{icon}</span>
        <span className="min-w-0 break-words text-sm font-semibold text-[#6e6e73]">{title}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        {value && (
          <span className="text-xl font-bold text-[#1d1d1f] tabular-nums">{value}</span>
        )}
        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
          isPositive
            ? 'bg-emerald-500/10 text-emerald-700'
            : 'bg-rose-500/10 text-rose-700'
        }`}>
          {isPositive ? '+' : ''}{gap.toFixed(1)}
        </span>
      </div>
      <div className="text-sm text-[#6e6e73] leading-relaxed break-words">{label}</div>
      {percentile !== undefined && (
        <div className="mt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs mb-1.5">
            <span className="text-[#86868b] font-medium">Percentil</span>
            <span className="font-bold text-[#1d1d1f] tabular-nums">{percentile}%</span>
          </div>
          <div className="h-2.5 bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0068d6] transition-all duration-1000 ease-out"
              style={{ width: `${percentile}%` }}
            />
          </div>
        </div>
      )}
      {disclaimer && (
        <div className="text-xs text-[#86868b] mt-2 italic break-words">{disclaimer}</div>
      )}
    </div>
  );
}
