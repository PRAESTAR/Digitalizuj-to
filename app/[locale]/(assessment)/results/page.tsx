'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAssessment } from '@/context/AssessmentContext';
import ExecutiveSummary from '@/components/results/ExecutiveSummary';
import ScoreCards from '@/components/results/ScoreCards';
import RiskPanel from '@/components/results/RiskPanel';
import BusinessImpactPanel from '@/components/results/BusinessImpactPanel';
import RecommendationsPanel from '@/components/results/Recommendations';
import BenchmarkComparison from '@/components/results/BenchmarkComparison';
import PermanentLinkPanel from '@/components/customer/PermanentLinkPanel';

const RadarChart = dynamic(() => import('@/components/results/RadarChart'), {
  ssr: false,
  loading: () => <div className="w-full h-80 rounded-2xl bg-[#1d1d1f]/[0.03] animate-pulse" />,
});

export default function ResultsPage() {
  const { state, reset } = useAssessment();
  const { assessment } = state;

  if (!assessment || !assessment.result) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-16 text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-2xl">
          ?
        </div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-4">
          Žiadne výsledky
        </h1>
        <p className="text-[#6e6e73] mb-6">
          Najprv dokončite diagnostický kvíz.
        </p>
        <Link
          href="/"
          className="btn-apple-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold"
        >
          Začať hodnotenie
        </Link>
      </div>
    );
  }

  const result = assessment.result;
  const quizTypeLabel = assessment.type === 'indicative'
    ? 'Indikatívne hodnotenie'
    : 'Komplexná diagnostika';

  // px-3 na mobile: pri 320 px je kazdy pixel sirky vzacny, od sm: uz je priestor na px-4
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-16 pb-8 sm:pt-8 bg-[#fbfbfd] min-h-screen">
      {/* Header — na mobile sa skladá pod seba; v jednom riadku sa ikona (48 px),
          h1 a tlačidlo "Nové hodnotenie" na 320 px nezmestia a pretekali von. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          {/* min-w-0 dovoli textu zalomit sa namiesto rozticahnutia flex polozky za okraj */}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] break-words">
              Výsledky diagnostiky
            </h1>
            <p className="text-sm text-[#6e6e73] mt-1 font-medium break-words">
              {quizTypeLabel} &middot; {new Date(assessment.completedAt || '').toLocaleDateString('sk-SK')} &middot;
              {' '}{assessment.answers.length} odpovedí
            </p>
          </div>
        </div>
        {/* w-full na mobile: tlacidlo sa uz nesnazi zdielat riadok s nadpisom;
            min-h-11 zaroven splni minimalny dotykovy ciel 44 px (WCAG 2.5.8) */}
        <button
          onClick={() => {
            reset();
            window.location.href = '/';
          }}
          className="group w-full sm:w-auto shrink-0 min-h-11 px-5 py-2.5 text-sm rounded-full border border-black/10 text-[#1d1d1f] font-semibold hover:bg-black/5 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Nové hodnotenie
        </button>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Score overview */}
        <ScoreCards
          dii={result.dii}
          ors={result.ors}
          tdri={result.tdri}
          impact={result.businessImpact}
          aiReadiness={result.aiReadiness}
        />

        {/* Radar chart + Executive Summary */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          {/* p-5 na mobile: p-8 (2rem) ukrojilo z 320 px obrazovky 64 px a pri zvacsenom
              texte az 96 px, takze obsahu zostavalo menej prave ked pismo rastie */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-8 relative overflow-hidden animate-slide-in-left">
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1d1d1f] min-w-0 break-words">
                  Profil digitálnej zrelosti
                </h2>
              </div>
              <RadarChart categories={result.ors.categories} />
              {/* Jeden stlpec na mobile: v dvoch stlpcoch mala bunka 107 px a "truncate"
                  zrezal nazvy ako "Bezpecnost a technologicky dlh" na par znakov */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(result.ors.categories).map(([key, cat]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-xl bg-black/[0.03] border border-black/5 hover:bg-black/5 transition-colors">
                    <span className="text-[#6e6e73] min-w-0 break-words font-medium text-xs sm:text-sm">{cat.name}</span>
                    <span className={`font-mono font-bold shrink-0 px-2 py-0.5 rounded-lg text-xs ${
                      cat.score >= 70 ? 'text-emerald-700 bg-emerald-500/10' :
                      cat.score >= 40 ? 'text-[#1d1d1f] bg-black/5' :
                      'text-rose-700 bg-rose-500/10'
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
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-8 animate-fade-in-up relative overflow-hidden">
          <div className="relative">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#1d1d1f]">
                  Audit Trail
                </h2>
                <p className="text-sm text-[#6e6e73] font-medium break-words">
                  Kompletný záznam odpovedí a výpočtu pre auditovateľnosť.
                </p>
              </div>
            </div>

            {/* Model + external references */}
            {/* break-words/break-all: commit hash a verzie su nezalomitelne retazce,
                ktore na 320 px inak vytlacia panel do horizontalneho pretoku */}
            <div className="mb-4 p-3 rounded-xl bg-black/[0.03] border border-black/5 text-xs text-[#86868b] grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="min-w-0 break-words">
                <span className="font-semibold text-[#1d1d1f]">Adaptívny model DAP:</span>{' '}
                <span className="font-mono break-all">
                  build {process.env.NEXT_PUBLIC_MODEL_COMMIT_HASH || 'dev'}
                </span>
              </div>
              <div className="min-w-0 break-words">
                <span className="font-semibold text-[#1d1d1f]">DII metodika:</span>{' '}
                {result.modelVersion.diiMethodologyVersion}
              </div>
              <div className="min-w-0 break-words">
                <span className="font-semibold text-[#1d1d1f]">Benchmark:</span>{' '}
                {result.modelVersion.benchmarkDataVersion}
              </div>
            </div>

            <details className="group">
              {/* min-h-11 = dotykovy ciel 44 px; ikona shrink-0, aby ju dlhy text nestlacil */}
              <summary className="cursor-pointer min-h-11 py-2 text-sm text-[#0068d6] hover:text-[#004a99] font-bold flex items-center gap-1.5 transition-colors break-words">
                <svg className="w-4 h-4 shrink-0 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Zobraziť kompletný audit trail ({assessment.answers.length} odpovedí)
              </summary>
              {/* Tabulka ma 5 stlpcov a na 320 px sa nezmesti — bez tohto naznaku
                  uzivatel netusi, ze sa da posunut do boku */}
              <p className="sm:hidden mt-3 mb-1 text-xs text-[#86868b] flex items-center gap-1">
                <span aria-hidden="true">&#8596;</span>
                Tabuľku posuniete do boku
              </p>
              <div className="relative mt-1 sm:mt-4">
                <div className="overflow-x-auto rounded-2xl border border-black/5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-black/[0.03] text-[#86868b] font-bold">
                        <th className="text-left py-3 px-3 whitespace-nowrap">Otázka ID</th>
                        <th className="text-left py-3 px-3 whitespace-nowrap">Odpoveď</th>
                        <th className="text-right py-3 px-3 whitespace-nowrap">Skóre</th>
                        <th className="text-center py-3 px-3 whitespace-nowrap">Neviem</th>
                        <th className="text-center py-3 px-3 whitespace-nowrap">Preskočená</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.answers.map(a => (
                        <tr key={a.questionId} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0068d6]">{a.questionId}</td>
                          <td className="py-2.5 px-3 max-w-xs truncate">
                            {Array.isArray(a.value) ? a.value.join(', ') : a.value}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{a.score}</td>
                          <td className="py-2.5 px-3 text-center">{a.isUnknown ? <span className="text-amber-600 font-bold">Ano</span> : <span className="text-[#86868b]/50">-</span>}</td>
                          <td className="py-2.5 px-3 text-center">{a.wasSkipped ? <span className="text-amber-600 font-bold">Ano</span> : <span className="text-[#86868b]/50">-</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Gradient na pravom okraji signalizuje, ze obsah pokracuje mimo vyrezu */}
                <div
                  aria-hidden="true"
                  className="sm:hidden pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-2xl bg-gradient-to-l from-white to-transparent"
                />
              </div>
            </details>

            <details className="mt-4 group">
              <summary className="cursor-pointer min-h-11 py-2 text-sm text-[#0068d6] hover:text-[#004a99] font-bold flex items-center gap-1.5 transition-colors break-words">
                <svg className="w-4 h-4 shrink-0 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Scoring konfigurácia
              </summary>
              <pre className="mt-2 p-3 sm:p-4 bg-black/[0.03] rounded-2xl text-xs font-mono overflow-x-auto border border-black/5">
{JSON.stringify({
  categoryWeights: Object.fromEntries(
    Object.entries(result.ors.categories).map(([k, v]) => [k, v.weight])
  ),
  securityPenaltyApplied: result.ors.penaltyApplied,
  securityPenaltyReason: result.ors.penaltyReason,
  benchmarkVersion: result.modelVersion?.benchmarkDataVersion ?? 'n/a',
  scoringVersion: result.modelVersion?.scoringConfigVersion ?? 'n/a',
}, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
