'use client';

import { useTranslations } from 'next-intl';
import type { BenchmarkResults, DIIScore } from '@/types';
import { benchmarkData } from '@/data/benchmarkData';

interface BenchmarkComparisonProps {
  benchmarks: BenchmarkResults;
  dii: DIIScore;
}

export default function BenchmarkComparison({ benchmarks, dii }: BenchmarkComparisonProps) {
  const t = useTranslations('bench');
  // Nemerané DII (score12 null) — karty ukážu label „Nedostupné“ bez čísla.
  const diiValue = dii.score12 !== null ? `${dii.score12}/12` : undefined;
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

        {/* Karty sú rozdelené podľa PÔVODU referenčnej hodnoty, nie podľa
            metriky. Len porovnanie s trhom stojí na meraných Eurostat dátach a
            má percentil; všetko ostatné sú expertné odhady. Predtým viseli
            vedľa seba bez rozlíšenia a disclaimer mala jediná karta, hoci
            odhadom bola aj sektorová DII hodnota. */}
        <p className="text-xs font-semibold uppercase tracking-wide text-[#86868b] mb-3">
          {t('groupMeasured')}
        </p>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 stagger-children">
          {/* Domáca karta podľa trhu mutácie (sk→SK, cs→ČR). V EÚ režime (en)
              by bola len duplikátom EÚ karty, preto sa vynecháva. Staré
              uložené výsledky homeMarket nemajú — fallback SK. */}
          {(benchmarks.homeMarket ?? 'SK') !== 'EU27' && (
            <BenchmarkCard
              title={(benchmarks.homeMarket ?? 'SK') === 'CZ' ? t('vsCz') : t('vsSk')}
              icon={(benchmarks.homeMarket ?? 'SK') === 'CZ' ? '🇨🇿' : '🇸🇰'}
              value={diiValue}
              gap={benchmarks.diiVsSk.gap}
              label={benchmarks.diiVsSk.labelSk}
              percentile={benchmarks.diiVsSk.percentile}
            />
          )}
          <BenchmarkCard
            title={t('vsEu')}
            icon="🇪🇺"
            value={diiValue}
            gap={benchmarks.diiVsEu.gap}
            label={benchmarks.diiVsEu.labelSk}
            percentile={benchmarks.diiVsEu.percentile}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-[#86868b] mt-8 mb-1">
          {t('groupEstimated')}
        </p>
        <p className="text-xs text-[#86868b] mb-3 break-words">{t('estimatedNote')}</p>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 stagger-children">
          <BenchmarkCard
            title={t('vsSector')}
            icon="🏢"
            value={diiValue}
            gap={benchmarks.diiVsSector.gap}
            label={benchmarks.diiVsSector.labelSk}
          />
          {/* Nové porovnania chýbajú v starých uložených výsledkoch — vtedy sa
              karta jednoducho nevykreslí. */}
          {benchmarks.diiVsSize && (
            <BenchmarkCard
              title={t('vsSize')}
              icon="👥"
              value={diiValue}
              gap={benchmarks.diiVsSize.gap}
              label={benchmarks.diiVsSize.labelSk}
            />
          )}
          {benchmarks.orsVsCountry && (
            <BenchmarkCard
              title={t('orsVsCountry')}
              icon="🗺️"
              gap={benchmarks.orsVsCountry.gap}
              label={benchmarks.orsVsCountry.labelSk}
            />
          )}
          <BenchmarkCard
            title={t('orsVsSector')}
            icon="⚙️"
            gap={benchmarks.orsVsSector.gap}
            label={benchmarks.orsVsSector.labelSk}
          />
          {benchmarks.orsVsSize && (
            <BenchmarkCard
              title={t('orsVsSize')}
              icon="📐"
              gap={benchmarks.orsVsSize.gap}
              label={benchmarks.orsVsSize.labelSk}
              disclaimer={benchmarks.orsVsSize.sizeBand === 'micro' ? t('microCaveat') : undefined}
            />
          )}
        </div>

        {/* items-start + shrink-0: pri zalomení zdroja na 2-3 riadky musí bodka zostať hore a nesmie sa stlačiť */}
        <div className="mt-6 text-xs text-[#86868b] font-medium flex items-start gap-2">
          <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 mt-1.5 rounded-full bg-black/10" />
          <span className="min-w-0 break-words">
            {t('source', { source: benchmarkData.source, version: benchmarkData.version, date: benchmarkData.lastUpdated })}
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
  gap: number | null;
  label: string;
  percentile?: number;
  disclaimer?: string;
}) {
  const isPositive = gap !== null && gap >= 0;

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
        {gap !== null ? (
          <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-700'
              : 'bg-rose-500/10 text-rose-700'
          }`}>
            {isPositive ? '+' : ''}{gap.toFixed(1)}
          </span>
        ) : (
          <span className="text-sm font-bold px-2.5 py-0.5 rounded-full tabular-nums bg-black/5 text-[#86868b]">
            &mdash;
          </span>
        )}
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
