'use client';

import type { ResultSnapshot } from '@/types';

interface ExecutiveSummaryProps {
  result: ResultSnapshot;
}

export default function ExecutiveSummary({ result }: ExecutiveSummaryProps) {
  const { ors, tdri, dii, aiReadiness, recommendations } = result;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-card-indigo flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Executive Summary
          </h2>
        </div>

        <div className="space-y-4 text-slate-700 leading-relaxed">
          <p>
            Vaša firma dosahuje úroveň digitálnej zrelosti{' '}
            <strong className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              &ldquo;{ors.maturityLabelSk}&rdquo;
            </strong>{' '}
            s celkovým skóre{' '}
            <strong>{Math.round(ors.scorePenalized)}/100</strong>.
            {ors.penaltyApplied && (
              <span className="inline-flex items-center gap-1.5 ml-1 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                (skóre znížené o penalizáciu za bezpečnostný stav)
              </span>
            )}
          </p>

          <p>
            Z pohľadu digitálnej intenzity (DII) dosahujete{' '}
            <strong>{dii.score12}/12 bodov</strong>, čo zodpovedá úrovni{' '}
            <strong>&ldquo;{dii.levelLabelSk}&rdquo;</strong>.
          </p>

          <p>
            V oblasti umelej inteligencie a automatizácie ste na úrovni{' '}
            {aiReadiness.measured && aiReadiness.score !== null ? (
              <>
                <strong className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  &ldquo;{aiReadiness.levelLabelSk}&rdquo;
                </strong>{' '}
                (<strong>{Math.round(aiReadiness.score)}/100</strong>).
              </>
            ) : (
              <>nezmeranej — v dotazníku ste nezodpovedali otázky o využívaní AI.</>
            )}
          </p>

          {tdri.score > 35 && (
            <div className="flex gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-card-amber flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-500/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-orange-800 text-sm">Upozornenie na technologický dlh</p>
                <p className="text-sm text-orange-700 mt-0.5">
                  Váš index technologického dlhu ({tdri.score}/100) indikuje {tdri.riskLabelSk.toLowerCase()}.
                  {tdri.topRisks.length > 0 && (
                    <> Najkritickejšie riziká vyžadujú okamžitú pozornosť.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {recommendations.strengths.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-card-green flex items-center justify-center text-white text-xs shadow-sm">&#10003;</span>
                Silné stránky
              </h3>
              <ul className="space-y-1.5 text-sm">
                {recommendations.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-green-700">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    {s.descriptionSk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.criticalRisks.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100">
              <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-card-red flex items-center justify-center text-white text-xs shadow-sm">!</span>
                Kritické riziká
              </h3>
              <ul className="space-y-1.5 text-sm">
                {recommendations.criticalRisks.slice(0, 3).map(r => (
                  <li key={r.id} className="flex items-start gap-2 text-red-700">
                    <span className="text-red-500 mt-0.5">&#9679;</span>
                    {r.titleSk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.quickWins.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-card-blue flex items-center justify-center text-white text-xs shadow-sm">&#9889;</span>
                Top 3 Quick Wins
              </h3>
              <ul className="space-y-1.5 text-sm">
                {recommendations.quickWins.slice(0, 3).map(r => (
                  <li key={r.id} className="flex items-start gap-2 text-blue-700">
                    <span className="text-blue-500 mt-0.5">&#9679;</span>
                    {r.titleSk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
