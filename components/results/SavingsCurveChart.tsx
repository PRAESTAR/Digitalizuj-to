'use client';

import { useTranslations, useLocale } from 'next-intl';
import { intlLocale, type Locale } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SavingsProjection } from '@/types';

function formatEurCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 100) / 10}k €`;
  }
  return `${Math.round(value)} €`;
}

// Na mobile sa do ~40 px širokej osi nezmestí "12,5k €" — skracujeme na "13k".
// Plnú sumu s menou používateľ vidí v tooltipe po ťuknutí na krivku.
function formatEurTight(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return `${Math.round(value)}`;
}

// Scenáre pre náhradnú HTML legendu na mobile — farby aj názvy sú zhodné s <Line>.
const MOBILE_LEGEND = [
  { key: 'optimistic' as const, color: '#0068d6' },
  { key: 'mid' as const, color: '#6e6e73' },
  { key: 'conservative' as const, color: '#059669' },
];

interface SavingsCurveChartProps {
  projection: SavingsProjection;
}

export default function SavingsCurveChart({ projection }: SavingsCurveChartProps) {
  const t = useTranslations('impact');
  const locale = useLocale() as Locale;
  const { points, rampUpMonths } = projection;

  // Recharts renderuje do SVG, takže responzívnosť sa nedá vyriešiť CSS triedami —
  // šírku osi, hustotu tickov aj legendu musíme prepínať v JS. Hranica 40rem = Tailwind `sm`.
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 40rem)');
    const update = () => setIsCompact(!mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <div>
      <div className="w-full h-56 sm:h-72 animate-scale-in">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: isCompact ? 4 : 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              // Rozmery v rem, aby popisky rástli spolu s ovládačom veľkosti textu.
              tick={{ fontSize: '0.75rem', fill: '#86868b' }}
              tickFormatter={(m) => `${m}m`}
              tickLine={false}
              axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
              interval={isCompact ? 5 : 3}
            />
            <YAxis
              tick={{ fontSize: '0.75rem', fill: '#86868b' }}
              tickFormatter={isCompact ? formatEurTight : formatEurCompact}
              tickLine={false}
              axisLine={false}
              // Pri 320 px zostáva na graf ~250 px; pôvodných 52 px osi ukrojilo pätinu kresliacej plochy.
              width={isCompact ? 38 : 52}
            />
            <ReferenceLine x={rampUpMonths.optimistic} stroke="#0068d6" strokeDasharray="2 4" strokeOpacity={0.35} />
            <ReferenceLine x={rampUpMonths.mid} stroke="#6e6e73" strokeDasharray="2 4" strokeOpacity={0.35} />
            <ReferenceLine x={rampUpMonths.conservative} stroke="#059669" strokeDasharray="2 4" strokeOpacity={0.35} />
            <Tooltip
              formatter={(value, name) => [
                new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value)),
                String(name),
              ]}
              labelFormatter={(m) => `Mesiac ${m}`}
              contentStyle={{
                background: 'white',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)',
                fontSize: '0.75rem',
              }}
            />
            {/* Legenda recharts sa v ~250 px zalomí do troch riadkov a ukrojí výšku grafu —
                na mobile ju nahrádza HTML legenda pod grafom, ktorá sa zalomí prirodzene. */}
            {!isCompact && (
              <Legend
                iconType="line"
                wrapperStyle={{ fontSize: '0.75rem', color: '#6e6e73', paddingTop: 12 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="optimistic"
              name={t('scenario.optimistic')}
              stroke="#0068d6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="mid"
              name={t('scenario.mid')}
              stroke="#6e6e73"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="conservative"
              name={t('scenario.conservative')}
              stroke="#059669"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="sm:hidden mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-[#6e6e73]">
        {MOBILE_LEGEND.map(item => (
          <li key={item.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 shrink-0 rounded-full"
              style={{ background: item.color }}
            />
            {t('scenario.' + item.key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
