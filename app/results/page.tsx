'use client';

import { useAssessment } from '@/context/AssessmentContext';
import ExecutiveSummary from '@/components/results/ExecutiveSummary';
import ScoreCards from '@/components/results/ScoreCards';
import RadarChart from '@/components/results/RadarChart';
import RiskPanel from '@/components/results/RiskPanel';
import BusinessImpactPanel from '@/components/results/BusinessImpactPanel';
import RecommendationsPanel from '@/components/results/Recommendations';
import BenchmarkComparison from '@/components/results/BenchmarkComparison';
import PermanentLinkPanel from '@/components/customer/PermanentLinkPanel';

export default function ResultsPage() {
  const { state, reset } = useAssessment();
  const { assessment } = state;

  if (!assessment || !assessment.result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/30 animate-float">
          ?
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">
          Žiadne výsledky
        </h1>
        <p className="text-slate-600 mb-6">
          Najprv dokončite diagnostický kvíz.
        </p>
        <a
          href="/"
          className="inline-flex px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          Začať hodnotenie
        </a>
      </div>
    );
  }

  const result = assessment.result;
  const quizTypeLabel = assessment.type === 'indicative'
    ? 'Indikatívne hodnotenie'
    : 'Komplexná diagnostika';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gradient-mesh min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Výsledky diagnostiky
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {quizTypeLabel} &middot; {new Date(assessment.completedAt || '').toLocaleDateString('sk-SK')} &middot;
              {' '}{assessment.answers.length} odpovedí
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            reset();
            window.location.href = '/';
          }}
          className="group px-5 py-2.5 text-sm rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Nové hodnotenie
        </button>
      </div>

      <div className="space-y-8">
        {/* Score overview */}
        <ScoreCards
          dii={result.dii}
          ors={result.ors}
          tdri={result.tdri}
          impact={result.businessImpact}
        />

        {/* Radar chart + Executive Summary */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 relative overflow-hidden animate-slide-in-left">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-card-blue flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Profil digitálnej zrelosti
                </h2>
              </div>
              <RadarChart categories={result.ors.categories} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(result.ors.categories).map(([key, cat]) => (
                  <div key={key} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <span className="text-slate-600 truncate font-medium">{cat.name}</span>
                    <span className={`font-mono font-black ml-2 px-2 py-0.5 rounded-lg text-xs ${
                      cat.score >= 70 ? 'text-green-700 bg-green-100' :
                      cat.score >= 40 ? 'text-slate-700 bg-slate-200' :
                      'text-red-700 bg-red-100'
                    }`}>
                      {Math.round(cat.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ExecutiveSummary result={result} />
        </div>

        {/* Risk panel */}
        <RiskPanel tdri={result.tdri} />

        {/* Business impact */}
        <BusinessImpactPanel impact={result.businessImpact} />

        {/* Benchmark comparison */}
        <BenchmarkComparison benchmarks={result.benchmarks} dii={result.dii} />

        {/* Recommendations */}
        <RecommendationsPanel recommendations={result.recommendations} />

        {/* Permanent shareable link with QR */}
        <PermanentLinkPanel
          result={result}
          respondent={assessment.respondent}
          completedAt={assessment.completedAt}
        />

        {/* Audit trail */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 animate-fade-in-up relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-slate-500 to-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-500/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Audit Trail
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Kompletný záznam odpovedí a výpočtu pre auditovateľnosť.
                </p>
              </div>
            </div>

            {/* Model + external references */}
            <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="font-bold text-slate-600">Adaptívny model DAP:</span>{' '}
                <span className="font-mono">
                  build {process.env.NEXT_PUBLIC_MODEL_COMMIT_HASH || 'dev'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600">DII metodika:</span>{' '}
                {result.modelVersion.diiMethodologyVersion}
              </div>
              <div>
                <span className="font-bold text-slate-600">Benchmark:</span>{' '}
                {result.modelVersion.benchmarkDataVersion}
              </div>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 transition-colors">
                <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Zobraziť kompletný audit trail ({assessment.answers.length} odpovedí)
              </summary>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-500 font-bold">
                      <th className="text-left py-3 px-3">Otázka ID</th>
                      <th className="text-left py-3 px-3">Odpoveď</th>
                      <th className="text-right py-3 px-3">Skóre</th>
                      <th className="text-center py-3 px-3">Neviem</th>
                      <th className="text-center py-3 px-3">Preskočená</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.answers.map(a => (
                      <tr key={a.questionId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{a.questionId}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate">
                          {Array.isArray(a.value) ? a.value.join(', ') : a.value}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{a.score}</td>
                        <td className="py-2.5 px-3 text-center">{a.isUnknown ? <span className="text-amber-600 font-bold">Ano</span> : <span className="text-slate-300">-</span>}</td>
                        <td className="py-2.5 px-3 text-center">{a.wasSkipped ? <span className="text-amber-600 font-bold">Ano</span> : <span className="text-slate-300">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            <details className="mt-4 group">
              <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 transition-colors">
                <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Scoring konfigurácia
              </summary>
              <pre className="mt-2 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-100">
{JSON.stringify({
  categoryWeights: Object.fromEntries(
    Object.entries(result.ors.categories).map(([k, v]) => [k, v.weight])
  ),
  securityPenaltyApplied: result.ors.penaltyApplied,
  securityPenaltyReason: result.ors.penaltyReason,
  benchmarkVersion: '2024-Q4',
  scoringVersion: '1.0-MVP',
}, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
