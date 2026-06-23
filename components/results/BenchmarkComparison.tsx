'use client';

import type { BenchmarkResults, DIIScore } from '@/types';

interface BenchmarkComparisonProps {
  benchmarks: BenchmarkResults;
  dii: DIIScore;
}

export default function BenchmarkComparison({ benchmarks, dii }: BenchmarkComparisonProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 animate-fade-in-up relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Benchmark porovnanie
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 stagger-children">
          <BenchmarkCard
            title="DII vs. Slovensko"
            icon="🇸🇰"
            value={`${dii.score12}/12`}
            gap={benchmarks.diiVsSk.gap}
            label={benchmarks.diiVsSk.labelSk}
            percentile={benchmarks.diiVsSk.percentile}
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-500"
          />
          <BenchmarkCard
            title="DII vs. EÚ priemer"
            icon="🇪🇺"
            value={`${dii.score12}/12`}
            gap={benchmarks.diiVsEu.gap}
            label={benchmarks.diiVsEu.labelSk}
            percentile={benchmarks.diiVsEu.percentile}
            gradientFrom="from-indigo-500"
            gradientTo="to-violet-500"
          />
          <BenchmarkCard
            title="DII vs. váš sektor"
            icon="🏢"
            value={`${dii.score12}/12`}
            gap={benchmarks.diiVsSector.gap}
            label={benchmarks.diiVsSector.labelSk}
            gradientFrom="from-violet-500"
            gradientTo="to-purple-500"
          />
          <BenchmarkCard
            title="Operačná zrelosť vs. sektor"
            icon="⚙️"
            gap={benchmarks.orsVsSector.gap}
            label={benchmarks.orsVsSector.labelSk}
            disclaimer={benchmarks.orsVsSector.disclaimer}
            gradientFrom="from-purple-500"
            gradientTo="to-pink-500"
          />
        </div>

        <div className="mt-6 text-xs text-slate-400 font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          Benchmark dáta: Eurostat DESI 2024 + expertné odhady. Posledná aktualizácia: 2024-Q4.
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
  gradientFrom,
  gradientTo,
}: {
  title: string;
  icon: string;
  value?: string;
  gap: number;
  label: string;
  percentile?: number;
  disclaimer?: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  const isPositive = gap >= 0;

  return (
    <div className="group p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 hover-lift">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-bold text-slate-600">{title}</span>
      </div>
      <div className="flex items-baseline gap-3 mb-2">
        {value && (
          <span className="text-xl font-black text-slate-900">{value}</span>
        )}
        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
          isPositive
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {isPositive ? '+' : ''}{gap.toFixed(1)}
        </span>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed">{label}</div>
      {percentile !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Percentil</span>
            <span className="font-bold text-slate-700">{percentile}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-1000 ease-out`}
              style={{ width: `${percentile}%` }}
            />
          </div>
        </div>
      )}
      {disclaimer && (
        <div className="text-xs text-slate-400 mt-2 italic">{disclaimer}</div>
      )}
    </div>
  );
}
