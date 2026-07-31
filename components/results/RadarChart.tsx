'use client';

import { useTranslations } from 'next-intl';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ORSScore } from '@/types';

interface RadarChartProps {
  categories: ORSScore['categories'];
}

export default function RadarChart({ categories }: RadarChartProps) {
  const t = useTranslations();
  const data = Object.entries(categories).map(([, cat]) => ({
    category: cat.name.split(' ')[0],
    fullName: cat.name,
    score: Math.round(cat.score),
    fullMark: 100,
  }));

  return (
    <div className="w-full h-80 animate-scale-in">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickCount={5}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 animate-scale-in">
                  <p className="font-bold text-sm text-slate-900">{item.fullName}</p>
                  <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {item.score}/100
                  </p>
                </div>
              );
            }}
          />
          <Radar
            name={t('results.auditColScore')}
            dataKey="score"
            stroke="url(#radarStroke)"
            fill="url(#radarFill)"
            fillOpacity={1}
            strokeWidth={2.5}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
