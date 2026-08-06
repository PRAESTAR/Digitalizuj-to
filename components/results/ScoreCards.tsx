'use client';

import { useTranslations } from 'next-intl';
import type { DIIScore, ORSScore, TDRIScore, BusinessImpact, AIReadinessScore } from '@/types';

interface ScoreCardsProps {
  dii: DIIScore;
  ors: ORSScore;
  tdri: TDRIScore;
  impact: BusinessImpact;
  aiReadiness: AIReadinessScore;
}

export default function ScoreCards({ dii, ors, tdri, impact, aiReadiness }: ScoreCardsProps) {
  const t = useTranslations();
  return (
    // Na telefóne jeden stĺpec: pri 320 px a dvoch stĺpcoch zostávalo po
    // odpočítaní paddingu ~88 px na obsah, čo rozbíjalo číslo aj popis.
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 stagger-children">
      {/* DII Score */}
      <div className="bg-white rounded-3xl border border-black/5 p-5 sm:p-6 shadow-sm hover-lift card-shine relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            {/* Odznaky sú na telefóne skryté — pri tejto veľkosti sú nečitateľné
                a berú šírku, ktorú potrebuje samotné číslo a popis. */}
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-[#1d1d1f]/8 items-center justify-center text-[#1d1d1f] text-xs font-semibold" aria-hidden="true">
              D
            </div>
            <span className="text-sm font-medium text-[#6e6e73]">DII Score</span>
          </div>
          {dii.measured && dii.score100 !== null && dii.score12 !== null && dii.level !== null ? (
            <>
              <div className="flex items-baseline gap-2 animate-count-up">
                <span className="text-4xl font-black text-[#1d1d1f] tracking-tight">
                  {Math.round(dii.score100)}
                </span>
                <span className="text-sm text-[#86868b] font-medium">/100</span>
              </div>
              <div className="text-xs text-[#6e6e73] mt-2 font-medium">
                {dii.score12}/12 (DII) &middot; {t('levels.dii.' + dii.level)}
              </div>
              {/* Rozsah sa ukazuje len keď je širší než bod — pri plnom pokrytí
                  by „6–6" nič nehovorilo, len pridalo šum. */}
              {/* Vlastný kľúč s jednotkou: DII pásmo je v INDIKÁTOROCH (0–12),
                  kým veľké číslo nad ním je score100. Spoločný text „Rozsah
                  4–8" by sa čítal ako body zo stovky. */}
              {dii.band && dii.band.upper > dii.band.lower && (
                <div className="text-xs text-[#86868b] mt-1 font-medium" title={dii.band.reasonSk}>
                  {t('cards.bandRangeIndicators', { lower: dii.band.lower, upper: dii.band.upper })}
                </div>
              )}
              {dii.measuredIndicators < 12 && (
                <div className="text-xs text-[#86868b] mt-1 font-medium">
                  {t('cards.diiCoverage', { measured: dii.measuredIndicators })}
                </div>
              )}
              <div className="mt-3 h-2.5 rounded-full bg-black/5 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-[#0068d6] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(dii.score100, 2)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-semibold text-[#86868b]">
                &ndash;
              </div>
              <div className="text-xs text-[#86868b] mt-2 font-medium">
                {t('cards.diiUnmeasured')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI & Automatizácia Readiness */}
      <div className="bg-white rounded-3xl border border-black/5 p-5 sm:p-6 shadow-sm hover-lift card-shine relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-[#1d1d1f]/8 items-center justify-center text-[#1d1d1f] text-[10px] font-semibold" aria-hidden="true">
              AI
            </div>
            <span className="text-sm font-medium text-[#6e6e73]">AI Readiness</span>
          </div>
          {aiReadiness.measured && aiReadiness.score !== null ? (
            <>
              <div className="flex items-baseline gap-2 animate-count-up">
                <span className="text-4xl font-black text-[#1d1d1f] tracking-tight">
                  {Math.round(aiReadiness.score)}
                </span>
                <span className="text-sm text-[#86868b] font-medium">/100</span>
              </div>
              <div className="text-xs text-[#6e6e73] mt-2 font-medium">
                {t('levels.ai.' + aiReadiness.level)}
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-black/5 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-[#0068d6] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(aiReadiness.score, 2)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-semibold text-[#86868b]">
                &ndash;
              </div>
              <div className="text-xs text-[#86868b] mt-2 font-medium">
                {t('cards.aiUnmeasured')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ORS Score */}
      <div className="bg-white rounded-3xl border border-black/5 p-5 sm:p-6 shadow-sm hover-lift card-shine relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-[#1d1d1f]/8 items-center justify-center text-[#1d1d1f] text-xs font-semibold" aria-hidden="true">
              O
            </div>
            <span className="text-sm font-medium text-[#6e6e73]">{t('card.operationalMaturity')}</span>
          </div>
          {ors.scorePenalized !== null && ors.maturityLevel !== null ? (
            <>
              <div className="flex items-baseline gap-2 animate-count-up">
                <span className="text-4xl font-black text-[#1d1d1f] tracking-tight">
                  {Math.round(ors.scorePenalized)}
                </span>
                <span className="text-sm text-[#86868b] font-medium">/100</span>
              </div>
              <div className="text-xs text-[#6e6e73] mt-2 font-medium">
                Level {ors.maturityLevel} &middot; {t('levels.maturity.' + ors.maturityLevel)}
              </div>
              {/* Rozsah patrí k NEPENALIZOVANÉMU skóre — penalta je odvodená
                  úprava, nie meranie, a jej premietnutie do hraníc by
                  naznačovalo presnosť, ktorú citlivostný výpočet nepokrýva. */}
              {ors.band && ors.band.upper > ors.band.lower && (
                <div className="text-xs text-[#86868b] mt-1 font-medium" title={ors.band.reasonSk}>
                  {t('cards.bandRange', {
                    lower: Math.round(ors.band.lower),
                    upper: Math.round(ors.band.upper),
                  })}
                </div>
              )}
              {ors.penaltyApplied && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">{t('cards.securityPenalty')}</span>
                </div>
              )}
              <div className="mt-3 h-2.5 rounded-full bg-black/5 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-[#0068d6] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(ors.scorePenalized, 2)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-semibold text-[#86868b]">
                &ndash;
              </div>
              <div className="text-xs text-[#86868b] mt-2 font-medium">
                {t('cards.orsUnmeasured')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* TDRI */}
      <div className="bg-white rounded-3xl border border-black/5 p-5 sm:p-6 shadow-sm hover-lift card-shine relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div
              aria-hidden="true"
              className={`hidden sm:flex w-8 h-8 rounded-xl items-center justify-center text-xs font-semibold ${
                tdri.score > 60 ? 'bg-rose-500/10 text-rose-700' :
                tdri.score > 35 ? 'bg-amber-500/10 text-amber-700' :
                'bg-emerald-500/10 text-emerald-700'
              }`}
            >
              !
            </div>
            <span className="text-sm font-medium text-[#6e6e73]">{t('cards.techDebt')}</span>
          </div>
          <div className="flex items-baseline gap-2 animate-count-up">
            <span className={`text-4xl font-black tracking-tight ${
              tdri.score > 60 ? 'text-rose-600' :
              tdri.score > 35 ? 'text-orange-500' :
              tdri.score > 15 ? 'text-yellow-600' :
              'text-emerald-600'
            }`}>
              {tdri.score}
            </span>
            <span className="text-sm text-[#86868b] font-medium">/100</span>
          </div>
          <div className="text-xs text-[#6e6e73] mt-2 font-medium">
            {t('levels.risk.' + tdri.riskLevel)}
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-black/5 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                tdri.score > 60 ? 'bg-rose-500' :
                tdri.score > 35 ? 'bg-amber-500' :
                tdri.score > 15 ? 'bg-yellow-400' :
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(tdri.score, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="bg-white rounded-3xl border border-black/5 p-5 sm:p-6 shadow-sm hover-lift card-shine relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="hidden sm:flex w-8 h-8 rounded-xl bg-emerald-500/10 items-center justify-center text-emerald-700 text-xs font-semibold" aria-hidden="true">
              &euro;
            </div>
            <span className="text-sm font-medium text-[#6e6e73]">{t('cards.annualSavings')}</span>
          </div>
          <div className="flex items-baseline gap-1 animate-count-up">
            <span className="text-4xl font-black text-emerald-600 tracking-tight">
              {formatEur(impact.financialImpact.eurPerYear.conservative)}
            </span>
          </div>
          <div className="text-xs text-[#6e6e73] mt-2 font-medium">
            {t('cards.mdConservative', { md: impact.timeSavings.mdPerYear.conservative })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2.5 rounded-full bg-black/5 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  impact.financialImpact.confidence >= 0.7 ? 'bg-emerald-500' :
                  impact.financialImpact.confidence >= 0.4 ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}
                style={{ width: `${impact.financialImpact.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-[#86868b] font-mono">{Math.round(impact.financialImpact.confidence * 100)}%</span>
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
