'use client';

import type { DIIScore, ORSScore, TDRIScore, BusinessImpact } from '@/types';

interface ScoreCardsProps {
  dii: DIIScore;
  ors: ORSScore;
  tdri: TDRIScore;
  impact: BusinessImpact;
}

export default function ScoreCards({ dii, ors, tdri, impact }: ScoreCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {/* DII Score */}
      <div className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-blue-500/5 hover-lift card-shine relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-blue" />
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-500/5 rounded-full blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-card-blue flex items-center justify-center text-white text-xs font-black group-hover:scale-110 transition-transform shadow-md shadow-blue-500/30">
              D
            </div>
            <span className="text-sm font-medium text-slate-500">DII Score</span>
          </div>
          <div className="flex items-baseline gap-2 animate-count-up">
            <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {Math.round(dii.score100)}
            </span>
            <span className="text-sm text-slate-400 font-medium">/100</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {dii.score12}/12 (DII) &middot; {dii.levelLabelSk}
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 progress-striped transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(dii.score100, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ORS Score */}
      <div className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-indigo-500/5 hover-lift card-shine relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-indigo" />
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-card-indigo flex items-center justify-center text-white text-xs font-black group-hover:scale-110 transition-transform shadow-md shadow-indigo-500/30">
              O
            </div>
            <span className="text-sm font-medium text-slate-500">Operačná zrelosť</span>
          </div>
          <div className="flex items-baseline gap-2 animate-count-up">
            <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {Math.round(ors.scorePenalized)}
            </span>
            <span className="text-sm text-slate-400 font-medium">/100</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            Level {ors.maturityLevel} &middot; {ors.maturityLabelSk}
          </div>
          {ors.penaltyApplied && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-amber-600 font-medium">Penalizácia za bezpečnosť</span>
            </div>
          )}
          <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 progress-striped transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(ors.scorePenalized, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* TDRI */}
      <div className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-red-500/5 hover-lift card-shine relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          tdri.score > 60 ? 'bg-gradient-card-red' :
          tdri.score > 35 ? 'bg-gradient-card-amber' :
          'bg-gradient-card-green'
        }`} />
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-red-500/5 rounded-full blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black group-hover:scale-110 transition-transform shadow-md ${
              tdri.score > 60 ? 'bg-gradient-card-red shadow-red-500/30' :
              tdri.score > 35 ? 'bg-gradient-card-amber shadow-amber-500/30' :
              'bg-gradient-card-green shadow-green-500/30'
            }`}>
              !
            </div>
            <span className="text-sm font-medium text-slate-500">Technologický dlh</span>
          </div>
          <div className="flex items-baseline gap-2 animate-count-up">
            <span className={`text-4xl font-black ${
              tdri.score > 60 ? 'text-red-600' :
              tdri.score > 35 ? 'text-orange-500' :
              tdri.score > 15 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {tdri.score}
            </span>
            <span className="text-sm text-slate-400 font-medium">/100</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {tdri.riskLabelSk}
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                tdri.score > 60 ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                tdri.score > 35 ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
                tdri.score > 15 ? 'bg-gradient-to-r from-yellow-400 to-amber-400' :
                'bg-gradient-to-r from-green-400 to-emerald-500'
              }`}
              style={{ width: `${Math.max(tdri.score, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-lg shadow-green-500/5 hover-lift card-shine relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-green" />
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-green-500/5 rounded-full blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-card-green flex items-center justify-center text-white text-xs font-black group-hover:scale-110 transition-transform shadow-md shadow-green-500/30">
              &euro;
            </div>
            <span className="text-sm font-medium text-slate-500">Ročný potenciál úspor</span>
          </div>
          <div className="flex items-baseline gap-1 animate-count-up">
            <span className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatEur(impact.financialImpact.eurPerYear.conservative)}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            {impact.timeSavings.mdPerYear.conservative} MD konzervatívne
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  impact.financialImpact.confidence >= 0.7 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  impact.financialImpact.confidence >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                  'bg-gradient-to-r from-orange-400 to-red-400'
                }`}
                style={{ width: `${impact.financialImpact.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">{Math.round(impact.financialImpact.confidence * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatEur(value: number): string {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k €`;
  }
  return `${Math.round(value)} €`;
}
