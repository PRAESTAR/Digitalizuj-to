'use client';

import dynamic from 'next/dynamic';
import type { BusinessImpact, ScenarioValues } from '@/types';

const SavingsCurveChart = dynamic(() => import('./SavingsCurveChart'), {
  ssr: false,
  loading: () => <div className="w-full h-56 sm:h-72 rounded-2xl bg-[#1d1d1f]/[0.03] animate-pulse" />,
});

interface BusinessImpactPanelProps {
  impact: BusinessImpact;
}

// Scenáre pre mobilný kartový layout. Názvy aj farby sú zhodné s hlavičkami desktopovej tabuľky.
// Triedy sú uvedené celé (nie skladané cez template literal), aby ich Tailwind našiel pri skenovaní.
const SCENARIOS: { key: keyof ScenarioValues; label: string; head: string; eur: string }[] = [
  { key: 'conservative', label: 'Konzervatívny', head: 'text-emerald-600', eur: 'text-emerald-700' },
  { key: 'mid', label: 'Reálny', head: 'text-[#6e6e73]', eur: 'text-[#1d1d1f]' },
  { key: 'optimistic', label: 'Optimistický', head: 'text-[#0068d6]', eur: 'text-[#0068d6]' },
];

export default function BusinessImpactPanel({ impact }: BusinessImpactPanelProps) {
  return (
    // p-8 na mobile ukrojilo 64 px z 286 px — obsah mal len 222 px. Padding rastie až od sm.
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6 lg:p-8 animate-fade-in-up relative overflow-hidden">
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#1d1d1f]/8 flex items-center justify-center text-[#1d1d1f] text-lg font-bold">
            &euro;
          </div>
          <h2 className="min-w-0 text-lg sm:text-xl font-bold text-[#1d1d1f]">
            Business Impact Potential
          </h2>
        </div>

        {/* Savings curves — 3 scenáre kumulatívnej úspory v čase (ako pri investičnej projekcii) */}
        <div className="mb-6 p-3 sm:p-5 rounded-2xl bg-black/[0.02] border border-black/5">
          {/* flex-wrap: nadpis a horizont sa pri 320 px vedľa seba nezmestia */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-1">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              Kumulatívna úspora v čase
            </h3>
            <span className="text-xs text-[#86868b] font-medium">
              {impact.savingsProjection.horizonMonths} mesiacov
            </span>
          </div>
          <p className="text-xs text-[#86868b] mb-2">
            Tri scenáre sa líšia rýchlosťou nábehu k plnému ročnému prínosu — bodkovaná čiara označuje mesiac, kedy daný scenár dosiahne plnú mesačnú sadzbu.
          </p>
          <SavingsCurveChart projection={impact.savingsProjection} />
        </div>

        {/* Scenarios — mobilný kartový layout.
            4-stĺpcová tabuľka má 452 px a v ~250 px okne by z nej boli vidieť dva stĺpce,
            takže pod sm ju nahrádzame tromi kartami pod sebou (jedna karta = jeden scenár). */}
        <div className="sm:hidden mb-6 space-y-3">
          {SCENARIOS.map(s => (
            <div key={s.key} className="rounded-2xl border border-black/5 overflow-hidden">
              <div className={`px-4 py-2.5 bg-black/[0.03] text-sm font-bold ${s.head}`}>
                {s.label}
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 px-4 py-3 text-sm">
                <dt className="min-w-0 break-words text-[#6e6e73]">Ušetrené hodiny/rok</dt>
                <dd className="text-right font-mono font-medium text-[#1d1d1f]">
                  {impact.timeSavings.hoursPerYear[s.key]}
                </dd>

                <dt className="min-w-0 break-words text-[#6e6e73]">Ušetrené MD/rok</dt>
                <dd className="text-right font-mono font-medium text-[#1d1d1f]">
                  {impact.timeSavings.mdPerYear[s.key]}
                </dd>

                <dt className="min-w-0 break-words text-[#6e6e73]">
                  Úspora z redukcie chýb (h)
                  <span className="inline-flex items-center ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold align-middle">NEW</span>
                </dt>
                <dd className="text-right font-mono font-medium text-[#1d1d1f]">
                  {impact.errorCostReduction.reworkHoursSaved[s.key]}
                </dd>

                <dt className="min-w-0 break-words font-bold text-[#1d1d1f] pt-2 border-t border-black/5">Ročný dopad (EUR)</dt>
                <dd className={`text-right font-mono font-bold pt-2 border-t border-black/5 ${s.eur}`}>
                  {formatEur(impact.financialImpact.eurPerYear[s.key])}
                </dd>
              </dl>
            </div>
          ))}
        </div>

        {/* Scenarios table — od sm nahor, kde sa 4 stĺpce reálne zmestia */}
        <div className="hidden sm:block overflow-x-auto mb-6 rounded-2xl border border-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/[0.03]">
                <th className="text-left py-3.5 px-4 text-[#6e6e73] font-bold">Metrika</th>
                <th className="text-right py-3.5 px-4 text-emerald-600 font-bold">Konzervatívny</th>
                <th className="text-right py-3.5 px-4 text-[#6e6e73] font-bold">Reálny</th>
                <th className="text-right py-3.5 px-4 text-[#0068d6] font-bold">Optimistický</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                <td className="py-3.5 px-4 text-[#1d1d1f] font-medium">Ušetrené hodiny/rok</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.hoursPerYear.conservative}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.hoursPerYear.mid}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.hoursPerYear.optimistic}</td>
              </tr>
              <tr className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                <td className="py-3.5 px-4 text-[#1d1d1f] font-medium">Ušetrené MD/rok</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.mdPerYear.conservative}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.mdPerYear.mid}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.timeSavings.mdPerYear.optimistic}</td>
              </tr>
              <tr className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                {/* display:flex na <td> ruší jeho účasť v table layoute a rozbíja zarovnanie stĺpcov */}
                <td className="py-3.5 px-4 text-[#1d1d1f] font-medium">
                  Úspora z redukcie chýb (h)
                  <span className="inline-flex items-center ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-bold align-middle">NEW</span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.errorCostReduction.reworkHoursSaved.conservative}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.errorCostReduction.reworkHoursSaved.mid}</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">{impact.errorCostReduction.reworkHoursSaved.optimistic}</td>
              </tr>
              <tr className="bg-black/[0.03]">
                <td className="py-3.5 px-4 text-[#1d1d1f] font-bold">Ročný dopad (EUR)</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                  {formatEur(impact.financialImpact.eurPerYear.conservative)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1d1d1f]">
                  {formatEur(impact.financialImpact.eurPerYear.mid)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0068d6]">
                  {formatEur(impact.financialImpact.eurPerYear.optimistic)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Confidence — flex-wrap, aby sa pásik pri úzkom okne presunul na vlastný riadok
            namiesto stlačenia na pár pixelov */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-4 mb-6 p-4 bg-black/[0.03] rounded-2xl">
          <div className="text-sm text-[#6e6e73] font-medium">Spoľahlivosť odhadu:</div>
          <div className="flex-1 min-w-24 h-3 bg-black/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                impact.financialImpact.confidence >= 0.7 ? 'bg-emerald-500' :
                impact.financialImpact.confidence >= 0.4 ? 'bg-amber-500' :
                'bg-rose-500'
              }`}
              style={{ width: `${impact.financialImpact.confidence * 100}%` }}
            />
          </div>
          <div className="text-sm font-bold text-[#1d1d1f] shrink-0">
            {Math.round(impact.financialImpact.confidence * 100)} %
          </div>
        </div>

        {/* Risk reduction */}
        {impact.riskReduction.keyMitigations.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-black/5">
            <h3 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 shrink-0 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-xs">&#10003;</span>
              Redukcia rizika
            </h3>
            <ul className="space-y-1.5 text-sm text-[#1d1d1f]">
              {impact.riskReduction.keyMitigations.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5 shrink-0">&#10003;</span>
                  <span className="min-w-0 break-words">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunity gap */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-black/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 shrink-0 rounded-lg bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <span className="min-w-0 text-sm font-bold text-[#1d1d1f]">Opportunity Gap</span>
          </div>
          <p className="text-sm text-[#6e6e73] break-words">{impact.opportunityGap.descriptionSk}</p>
          <p className="text-xs text-[#0068d6] mt-1 font-medium break-words">{impact.opportunityGap.benchmarkComparisonSk}</p>
        </div>

        {/* Disclaimers */}
        <div className="border-t border-black/5 pt-4">
          <details className="text-xs text-[#86868b] group">
            <summary className="cursor-pointer hover:text-[#1d1d1f] transition-colors font-medium flex items-center gap-1.5 min-h-11 sm:min-h-0">
              <svg className="w-3.5 h-3.5 shrink-0 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Metodické poznámky a disclaimery
            </summary>
            <ul className="mt-2 space-y-1 pl-5 break-words">
              {impact.disclaimers.map((d, i) => (
                <li key={i}>&bull; {d}</li>
              ))}
            </ul>
          </details>
        </div>

        {/* Audit trail */}
        {impact.calculationAudit.length > 0 && (
          <div className="border-t border-black/5 pt-4 mt-4">
            <details className="text-xs text-[#86868b] group">
              <summary className="cursor-pointer hover:text-[#1d1d1f] transition-colors font-medium flex items-center gap-1.5 min-h-11 sm:min-h-0">
                <svg className="w-3.5 h-3.5 shrink-0 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Audit trail: rozpad výpočtu
              </summary>
              {/* 8 stĺpcov = 565 px v ~250 px okne. Tabuľku tu nemá zmysel prerábať na karty
                  (je to expertný rozpad výpočtu), ale používateľ musí vidieť, že sa dá posúvať. */}
              <p className="sm:hidden mt-2 text-xs text-[#86868b]" aria-hidden="true">
                Tabuľku posuniete do boku &rarr;
              </p>
              <div className="relative mt-2">
                <div className="overflow-x-auto rounded-xl border border-black/5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-black/[0.03]">
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
                        <tr key={i} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                          <td className="py-2 px-2">{row.process}</td>
                          <td className="py-2 px-2 text-right font-mono">{row.frequencyYearly}</td>
                          <td className="py-2 px-2 text-right font-mono">{row.timePerCaseH}h</td>
                          <td className="py-2 px-2 text-right font-mono">{Math.round(row.manualShare * 100)}%</td>
                          <td className="py-2 px-2 text-right font-mono">{Math.round(row.automatableShare * 100)}%</td>
                          <td className="py-2 px-2 text-right font-mono font-bold">{row.savedHours}</td>
                          <td className="py-2 px-2 text-right font-mono text-amber-600">{row.errorCostHours}</td>
                          <td className="py-2 px-2 text-[#86868b]">{row.dataSource}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Gradient na pravej hrane = vizuálny signál, že obsah pokračuje mimo okna */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-8 lg:hidden"
                  style={{ backgroundImage: 'linear-gradient(to left, #fff, rgba(255,255,255,0))' }}
                />
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
