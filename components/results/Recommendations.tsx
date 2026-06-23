'use client';

import type { Recommendations as RecsType } from '@/types';

interface RecommendationsProps {
  recommendations: RecsType;
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 animate-fade-in-up relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Odporúčania a Roadmapa
          </h2>
        </div>

        {/* Roadmap timeline */}
        <div className="grid gap-5 md:grid-cols-3 mb-8">
          {/* 0-3 months */}
          <div className="group rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-100 p-5 hover-lift transition-all hover:border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-card-red flex items-center justify-center text-white text-xs font-black shadow-md shadow-red-500/30 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-sm font-black text-red-800">
                0-3 mesiace
              </h3>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-xs font-bold">
                Okamžité
              </span>
            </div>
            <div className="space-y-3 stagger-children">
              {recommendations.criticalRisks.slice(0, 3).map(r => (
                <div key={r.id} className="text-sm p-3 rounded-xl bg-white/60 border border-red-100/50">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">!</span>
                    <div>
                      <div className="font-bold text-red-900 text-xs">{r.titleSk}</div>
                      <div className="text-red-700 text-xs mt-0.5 leading-relaxed">{r.descriptionSk}</div>
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.quickWins.slice(0, 2).map(r => (
                <div key={r.id} className="text-sm p-3 rounded-xl bg-white/60 border border-green-100/50">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">&#9889;</span>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{r.titleSk}</div>
                      <div className="text-slate-600 text-xs mt-0.5 leading-relaxed">{r.descriptionSk}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-12 months */}
          <div className="group rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 p-5 hover-lift transition-all hover:border-amber-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-card-amber flex items-center justify-center text-white text-xs font-black shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-sm font-black text-amber-800">
                3-12 mesiacov
              </h3>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold">
                Strategické
              </span>
            </div>
            <div className="space-y-3 stagger-children">
              {recommendations.strategicInitiatives.slice(0, 3).map(r => (
                <div key={r.id} className="text-sm p-3 rounded-xl bg-white/60 border border-amber-100/50">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">&#9733;</span>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{r.titleSk}</div>
                      <div className="text-slate-600 text-xs mt-0.5 leading-relaxed">{r.descriptionSk}</div>
                    </div>
                  </div>
                </div>
              ))}
              {recommendations.strategicInitiatives.length === 0 && (
                <p className="text-sm text-amber-700 p-3 rounded-xl bg-white/60 border border-amber-100/50 italic">
                  Sústredťe sa na okamžité akcie. Strategické iniciatívy definujte po ich splnení.
                </p>
              )}
            </div>
          </div>

          {/* 12+ months */}
          <div className="group rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 p-5 hover-lift transition-all hover:border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-card-blue flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-sm font-black text-blue-800">
                12+ mesiacov
              </h3>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold">
                Transformácia
              </span>
            </div>
            <div className="space-y-3">
              {recommendations.roadmap.longTerm12mPlus.length > 0 ? (
                recommendations.quickWins
                  .filter(r => recommendations.roadmap.longTerm12mPlus.includes(r.id))
                  .map(r => (
                    <div key={r.id} className="text-sm p-3 rounded-xl bg-white/60 border border-blue-100/50">
                      <div className="font-bold text-slate-800 text-xs">{r.titleSk}</div>
                    </div>
                  ))
              ) : null}
              <p className="text-sm text-blue-700 p-3 rounded-xl bg-white/60 border border-blue-100/50 italic">
                {recommendations.roadmap.longTerm12mPlus.length === 0
                  ? 'Transformačné zmeny definujte po stabilizácii základov.'
                  : 'Zvážte rozšírené digitalizačné iniciatívy po stabilizácii základov.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick wins detail */}
        {recommendations.quickWins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl bg-gradient-card-green flex items-center justify-center text-white text-sm shadow-md shadow-green-500/30">&#9889;</span>
              <h3 className="text-lg font-black text-slate-800">
                Quick Wins (všetky)
              </h3>
            </div>
            <div className="space-y-3 stagger-children">
              {recommendations.quickWins.map(r => (
                <div key={r.id} className="group flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{r.titleSk}</div>
                    <div className="text-sm text-slate-600 mt-1 leading-relaxed">{r.descriptionSk}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold shadow-sm">
                      Dopad: {r.impact}/5
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold shadow-sm">
                      Úsilie: {r.effort}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
