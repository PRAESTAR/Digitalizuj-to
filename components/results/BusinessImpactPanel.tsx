'use client';

import type { BusinessImpact } from '@/types';

interface BusinessImpactPanelProps {
  impact: BusinessImpact;
}

export default function BusinessImpactPanel({ impact }: BusinessImpactPanelProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 animate-fade-in-up relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-green" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-card-green flex items-center justify-center text-white text-lg font-black shadow-lg shadow-green-500/30">
            &euro;
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Business Impact Potential
          </h2>
        </div>

        {/* Scenarios table */}
        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                <th className="text-left py-3.5 px-4 text-slate-500 font-bold">Metrika</th>
                <th className="text-right py-3.5 px-4 text-green-600 font-bold">Konzervatívny</th>
                <th className="text-right py-3.5 px-4 text-blue-600 font-bold">Stredný</th>
                <th className="text-right py-3.5 px-4 text-indigo-600 font-bold">Optimistický</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 text-slate-700 font-medium">Ušetrené hodiny/rok</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.hoursPerYear.conservative}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.hoursPerYear.mid}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.hoursPerYear.optimistic}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 text-slate-700 font-medium">Ušetrené MD/rok</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.mdPerYear.conservative}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.mdPerYear.mid}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.mdPerYear.optimistic}</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 text-slate-700 font-medium flex items-center gap-1.5">
                  Úspora z redukcie chýb (h)
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">NEW</span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.errorCostReduction.reworkHoursSaved.conservative}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.errorCostReduction.reworkHoursSaved.mid}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.errorCostReduction.reworkHoursSaved.optimistic}</td>
              </tr>
              <tr className="bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                <td className="py-3.5 px-4 text-slate-900 font-bold">Ročný dopad (EUR)</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-green-700">
                  {formatEur(impact.financialImpact.eurPerYear.conservative)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                  {formatEur(impact.financialImpact.eurPerYear.mid)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">
                  {formatEur(impact.financialImpact.eurPerYear.optimistic)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl">
          <div className="text-sm text-slate-600 font-medium">Spoľahlivosť odhadu:</div>
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                impact.financialImpact.confidence >= 0.7 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                impact.financialImpact.confidence >= 0.4 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                'bg-gradient-to-r from-orange-400 to-red-500'
              }`}
              style={{ width: `${impact.financialImpact.confidence * 100}%` }}
            />
          </div>
          <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {Math.round(impact.financialImpact.confidence * 100)} %
          </div>
        </div>

        {/* Risk reduction */}
        {impact.riskReduction.keyMitigations.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
            <h3 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-card-green flex items-center justify-center text-white text-xs shadow-sm">&#10003;</span>
              Redukcia rizika
            </h3>
            <ul className="space-y-1.5 text-sm text-green-700">
              {impact.riskReduction.keyMitigations.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunity gap */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-gradient-card-blue flex items-center justify-center text-white text-xs shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <span className="text-sm font-bold text-blue-800">Opportunity Gap</span>
          </div>
          <p className="text-sm text-blue-700">{impact.opportunityGap.descriptionSk}</p>
          <p className="text-xs text-blue-600 mt-1 font-medium">{impact.opportunityGap.benchmarkComparisonSk}</p>
        </div>

        {/* Disclaimers */}
        <div className="border-t border-slate-100 pt-4">
          <details className="text-xs text-slate-400 group">
            <summary className="cursor-pointer hover:text-slate-600 transition-colors font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Metodické poznámky a disclaimery
            </summary>
            <ul className="mt-2 space-y-1 pl-5">
              {impact.disclaimers.map((d, i) => (
                <li key={i}>&bull; {d}</li>
              ))}
            </ul>
          </details>
        </div>

        {/* Audit trail */}
        {impact.calculationAudit.length > 0 && (
          <div className="border-t border-slate-100 pt-4 mt-4">
            <details className="text-xs text-slate-400 group">
              <summary className="cursor-pointer hover:text-slate-600 transition-colors font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Audit trail: rozpad výpočtu
              </summary>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-2 px-2 font-bold">Proces</th>
                      <th className="text-right py-2 px-2 font-bold">Frekv./rok</th>
                      <th className="text-right py-2 px-2 font-bold">Čas/prípad</th>
                      <th className="text-right py-2 px-2 font-bold">Manuál</th>
                      <th className="text-right py-2 px-2 font-bold">Automat.</th>
                      <th className="text-right py-2 px-2 font-bold">Ušetr. h</th>
                      <th className="text-right py-2 px-2 font-bold">Chyby h</th>
                      <th className="text-left py-2 px-2 font-bold">Zdroj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impact.calculationAudit.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-2">{row.process}</td>
                        <td className="py-2 px-2 text-right font-mono">{row.frequencyYearly}</td>
                        <td className="py-2 px-2 text-right font-mono">{row.timePerCaseH}h</td>
                        <td className="py-2 px-2 text-right font-mono">{Math.round(row.manualShare * 100)}%</td>
                        <td className="py-2 px-2 text-right font-mono">{Math.round(row.automatableShare * 100)}%</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{row.savedHours}</td>
                        <td className="py-2 px-2 text-right font-mono text-amber-600">{row.errorCostHours}</td>
                        <td className="py-2 px-2 text-slate-400">{row.dataSource}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}
