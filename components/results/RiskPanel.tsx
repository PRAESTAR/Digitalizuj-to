'use client';

import type { TDRIScore } from '@/types';

interface RiskPanelProps {
  tdri: TDRIScore;
}

export default function RiskPanel({ tdri }: RiskPanelProps) {
  const activeFactors = tdri.factors.filter(f => f.active);

  if (activeFactors.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-200 p-8 shadow-lg shadow-green-500/10 animate-fade-in-up relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-green" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-card-green flex items-center justify-center text-white text-xl shadow-lg shadow-green-500/30">
            &#10003;
          </div>
          <div>
            <h2 className="text-xl font-black text-green-800 mb-1">
              Technologický dlh a riziká
            </h2>
            <p className="text-green-700">
              Neboli identifikované žiadne kritické riziká. Skóre: {tdri.score}/100 ({tdri.riskLabelSk}).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 animate-fade-in-up relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        tdri.riskLevel === 'critical' ? 'bg-gradient-card-red' :
        tdri.riskLevel === 'high' ? 'bg-gradient-card-amber' :
        'bg-gradient-card-green'
      }`} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            tdri.riskLevel === 'critical' ? 'bg-gradient-card-red shadow-red-500/30' :
            tdri.riskLevel === 'high' ? 'bg-gradient-card-amber shadow-amber-500/30' :
            'bg-gradient-card-green shadow-green-500/30'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Technologický dlh a riziká
          </h2>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
          tdri.riskLevel === 'critical' ? 'bg-red-100 text-red-700 shadow-red-500/10' :
          tdri.riskLevel === 'high' ? 'bg-orange-100 text-orange-700 shadow-orange-500/10' :
          tdri.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 shadow-yellow-500/10' :
          'bg-green-100 text-green-700 shadow-green-500/10'
        }`}>
          {tdri.score}/100 &middot; {tdri.riskLabelSk}
        </span>
      </div>

      <div className="space-y-3 stagger-children">
        {activeFactors
          .sort((a, b) => b.penalty - a.penalty)
          .map(factor => (
            <div
              key={factor.id}
              className={`group p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] ${
                factor.severity === 'critical' ? 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50 hover:border-red-300 hover:shadow-md hover:shadow-red-500/10' :
                factor.severity === 'high' ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 hover:border-orange-300 hover:shadow-md hover:shadow-orange-500/10' :
                'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 hover:border-yellow-300 hover:shadow-md hover:shadow-yellow-500/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform ${
                    factor.severity === 'critical' ? 'bg-gradient-card-red shadow-sm shadow-red-500/30' :
                    factor.severity === 'high' ? 'bg-gradient-card-amber shadow-sm shadow-orange-500/30' :
                    'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm shadow-yellow-500/30'
                  }`}>
                    {factor.severity === 'critical' ? '!!' :
                     factor.severity === 'high' ? '!' : '~'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        factor.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        factor.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {factor.severity === 'critical' ? 'Kritické' :
                         factor.severity === 'high' ? 'Vysoké' : 'Stredné'}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {factor.name}
                      </span>
                    </div>
                    {factor.evidence && (
                      <p className="text-sm text-slate-600 mt-1.5">{factor.evidence}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-mono font-bold text-slate-500 flex-shrink-0 ml-4 bg-slate-100 px-2 py-1 rounded-lg">
                  -{factor.penalty}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
