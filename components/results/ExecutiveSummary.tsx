'use client';

import { useTranslations } from 'next-intl';
import type { ResultSnapshot } from '@/types';

interface ExecutiveSummaryProps {
  result: ResultSnapshot;
}

/**
 * Slovné zhrnutie výsledku. Vety idú z messages (exec.*) cez t.rich —
 * zvýraznenia <s> ostávajú súčasťou prekladu, aby si každý jazyk mohol
 * položiť dôraz podľa vlastného slovosledu.
 *
 * Úrovne (zrelosť, DII, riziko) sa prekladajú z ENUMOV (levels.*), nie
 * z engine polí *LabelSk — tie ostávajú pre uložené snapshoty. Obsah
 * odporúčaní (titleSk/descriptionSk) je enginový obsah a zostáva po
 * slovensky do prekladu obsahovej vrstvy (DB i18n).
 */
export default function ExecutiveSummary({ result }: ExecutiveSummaryProps) {
  const t = useTranslations();
  const { ors, tdri, dii, aiReadiness, recommendations } = result;

  const strong = (chunks: React.ReactNode) => (
    <strong className="text-[#1d1d1f]">{chunks}</strong>
  );

  return (
    // p-5 na mobile: p-8 zabralo na 320 px 64 px sirky a pri 150 % texte az 96 px
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-8 relative overflow-hidden animate-fade-in-up">
      <div className="relative">
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#1d1d1f]/8 flex items-center justify-center text-[#1d1d1f]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] min-w-0 break-words">
            {t('exec.title')}
          </h2>
        </div>

        {/* break-words na celom bloku: texty obsahuju cisla so znackami a dlhe
            slovenske slova, ktore na 320 px inak vytecu z panela */}
        <div className="space-y-4 text-[#1d1d1f] leading-relaxed break-words">
          <p>
            {ors.scorePenalized !== null && ors.maturityLevel !== null
              ? t.rich('exec.maturity', {
                  s: strong,
                  label: t(`levels.maturity.${ors.maturityLevel}`),
                  score: Math.round(ors.scorePenalized),
                })
              : t('exec.maturityUnmeasured')}
            {ors.penaltyApplied && (
              <span className="inline-flex items-center gap-1.5 ml-1 max-w-full text-amber-600">
                <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                {t('exec.penaltyNote')}
              </span>
            )}
          </p>

          <p>
            {dii.measured && dii.score12 !== null && dii.level !== null ? (
              <>
                {t.rich('exec.dii', {
                  s: strong,
                  points: dii.score12,
                  label: t(`levels.dii.${dii.level}`),
                })}
                {dii.measuredIndicators < 12 && (
                  <> {t('exec.diiCoverage', { measured: dii.measuredIndicators })}</>
                )}
              </>
            ) : (
              t('exec.diiUnmeasured')
            )}
          </p>

          <p>
            {aiReadiness.measured && aiReadiness.score !== null
              ? t.rich('exec.ai', {
                  s: strong,
                  label: t(`levels.ai.${aiReadiness.level}`),
                  score: Math.round(aiReadiness.score),
                })
              : t('exec.aiUnmeasured')}
          </p>

          {tdri.score > 35 && (
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-black/5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#1d1d1f] text-sm break-words">{t('exec.debtTitle')}</p>
                <p className="text-sm text-[#6e6e73] mt-0.5 break-words">
                  {t('exec.debtBody', {
                    score: tdri.score,
                    label: t(`levels.risk.${tdri.riskLevel}`).toLowerCase(),
                  })}
                  {tdri.topRisks.length > 0 && <> {t('exec.debtUrgent')}</>}
                </p>
              </div>
            </div>
          )}

          {recommendations.strengths.length > 0 && (
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-black/5">
              <h3 className="font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                <span className="w-6 h-6 shrink-0 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-xs">&#10003;</span>
                <span className="min-w-0 break-words">{t('exec.strengths')}</span>
              </h3>
              <ul className="space-y-1.5 text-sm">
                {recommendations.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#6e6e73]">
                    <span className="text-emerald-600 mt-0.5 shrink-0" aria-hidden="true">&#10003;</span>
                    <span className="min-w-0 break-words">{s.descriptionSk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.criticalRisks.length > 0 && (
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-black/5">
              <h3 className="font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                <span className="w-6 h-6 shrink-0 rounded-lg bg-rose-500/10 text-rose-700 flex items-center justify-center text-xs">!</span>
                <span className="min-w-0 break-words">{t('exec.criticalRisks')}</span>
              </h3>
              <ul className="space-y-1.5 text-sm">
                {recommendations.criticalRisks.slice(0, 3).map(r => (
                  <li key={r.id} className="flex items-start gap-2 text-[#6e6e73]">
                    <span className="text-rose-600 mt-0.5 shrink-0" aria-hidden="true">&#9679;</span>
                    <span className="min-w-0 break-words">{r.titleSk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.quickWins.length > 0 && (
            <div className="p-3 sm:p-4 rounded-2xl bg-white border border-black/5">
              <h3 className="font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                <span className="w-6 h-6 shrink-0 rounded-lg bg-[#0068d6]/10 text-[#0068d6] flex items-center justify-center text-xs">&#9889;</span>
                <span className="min-w-0 break-words">{t('exec.quickWins')}</span>
              </h3>
              <ul className="space-y-1.5 text-sm">
                {recommendations.quickWins.slice(0, 3).map(r => (
                  <li key={r.id} className="flex items-start gap-2 text-[#6e6e73]">
                    <span className="text-[#0068d6] mt-0.5 shrink-0" aria-hidden="true">&#9679;</span>
                    <span className="min-w-0 break-words">{r.titleSk}</span>
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
