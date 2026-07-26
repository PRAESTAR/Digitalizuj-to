'use client';

import type { TDRIScore } from '@/types';

interface RiskPanelProps {
  tdri: TDRIScore;
}

export default function RiskPanel({ tdri }: RiskPanelProps) {
  const activeFactors = tdri.factors.filter(f => f.active);

  if (activeFactors.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-8 animate-fade-in-up relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <div className="relative flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-xl shrink-0">
            &#10003;
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#1d1d1f] mb-1 break-words">
              Technologický dlh a riziká
            </h2>
            <p className="text-[#6e6e73] break-words">
              Neboli identifikované žiadne kritické riziká. Skóre: {tdri.score}/100 ({tdri.riskLabelSk}).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-8 animate-fade-in-up relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        tdri.riskLevel === 'critical' ? 'bg-rose-500' :
        tdri.riskLevel === 'high' ? 'bg-amber-500' :
        'bg-emerald-500'
      }`} />

      {/* Odznak so skore sa vedla nadpisu na 320 px nezmesti a bol orezany panelom
          (overflow-hidden) — na mobile ide preto pod nadpis */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${
            tdri.riskLevel === 'critical' ? 'bg-rose-500/10 text-rose-700' :
            tdri.riskLevel === 'high' ? 'bg-amber-500/10 text-amber-700' :
            'bg-emerald-500/10 text-emerald-700'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f] min-w-0 break-words">
            Technologický dlh a riziká
          </h2>
        </div>
        <span className={`self-start sm:self-auto shrink-0 px-4 py-1.5 rounded-full text-sm font-bold break-words ${
          tdri.riskLevel === 'critical' ? 'bg-rose-500/10 text-rose-700' :
          tdri.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-700' :
          tdri.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-700' :
          'bg-emerald-500/10 text-emerald-700'
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
              className={`group p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                factor.severity === 'critical' ? 'border-rose-200 bg-rose-500/5 hover:border-rose-300' :
                factor.severity === 'high' ? 'border-orange-200 bg-orange-500/5 hover:border-orange-300' :
                'border-amber-200 bg-amber-500/5 hover:border-amber-300'
              }`}
            >
              {/* Penalizacia "-N" sa na 320 px nezmestila vedla textu a vytekala mimo
                  karty — na mobile stoji pod popisom, od sm: vpravo ako predtym */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    factor.severity === 'critical' ? 'bg-rose-500/10 text-rose-700' :
                    factor.severity === 'high' ? 'bg-orange-500/10 text-orange-700' :
                    'bg-amber-500/10 text-amber-700'
                  }`}>
                    {factor.severity === 'critical' ? '!!' :
                     factor.severity === 'high' ? '!' : '~'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        factor.severity === 'critical' ? 'bg-rose-200 text-rose-800' :
                        factor.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                        'bg-amber-200 text-amber-800'
                      }`}>
                        {factor.severity === 'critical' ? 'Kritické' :
                         factor.severity === 'high' ? 'Vysoké' : 'Stredné'}
                      </span>
                      <span className="font-bold text-[#1d1d1f] text-sm min-w-0 break-words">
                        {factor.name}
                      </span>
                    </div>
                    {factor.evidence && (
                      <p className="text-sm text-[#6e6e73] mt-1.5 break-words">{factor.evidence}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-mono font-bold text-[#6e6e73] self-start sm:self-auto shrink-0 ml-11 sm:ml-4 bg-black/5 px-2 py-1 rounded-lg">
                  -{factor.penalty}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
