'use client';

import { useTranslations } from 'next-intl';
import type { Recommendation, Recommendations as RecsType } from '@/types';

interface RecommendationsProps {
  recommendations: RecsType;
}

/** Značka horizontu podľa typu odporúčania — farba aj symbol nesú význam. */
const MARK: Record<Recommendation['type'], { bg: string; glyph: string }> = {
  critical_risk: { bg: 'bg-rose-500', glyph: '!' },
  risk_mitigation: { bg: 'bg-amber-500', glyph: '!' },
  quick_win: { bg: 'bg-emerald-500', glyph: '⚡' },
  strategic: { bg: 'bg-amber-500', glyph: '★' },
  long_term: { bg: 'bg-[#1d1d1f]', glyph: '→' },
};

function RoadmapItem({ r }: { r: Recommendation }) {
  const mark = MARK[r.type];
  return (
    <div className="text-sm p-3 rounded-xl bg-[#fbfbfd] border border-black/5">
      <div className="flex items-start gap-2">
        <span className={`w-5 h-5 rounded-md ${mark.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>
          {mark.glyph}
        </span>
        {/* min-w-0: bez neho flex položka nikdy neklesne pod šírku najdlhšieho slova */}
        <div className="min-w-0 break-words">
          <div className="font-bold text-[#1d1d1f] text-xs">{r.titleSk}</div>
          <div className="text-[#6e6e73] text-xs mt-0.5 leading-relaxed">{r.descriptionSk}</div>
        </div>
      </div>
    </div>
  );
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  const t = useTranslations('reco');

  /**
   * Roadmapa sa vykresľuje z `recommendations.roadmap`, nie z vlastného výberu
   * zoznamov.
   *
   * Do 7. 8. 2026 si každá bunka vyberala sama: stredný horizont renderoval
   * `strategicInitiatives.slice(0, 3)`, takže **celá trieda `riskMitigations`
   * sa počítala a nikdy nezobrazila** — a s ňou aj rozhodnutie enginu, že
   * stredné riziká majú ísť PRED strategické iniciatívy, lebo sú to konkrétne
   * nálezy, nie zámery. Bunka 0–3 mesiace zasa brala dva quick winy tam, kde
   * roadmapa hovorí tri.
   *
   * Odteraz je komponent verným zobrazením toho, čo engine rozhodol. Poradie
   * aj stropy patria enginu (`engines/recommendationEngine.ts`), komponentu
   * patrí ich vykreslenie.
   */
  const byId = new Map<string, Recommendation>(
    [
      ...recommendations.criticalRisks,
      ...(recommendations.riskMitigations ?? []),
      ...recommendations.quickWins,
      ...recommendations.strategicInitiatives,
      ...(recommendations.longTermInitiatives ?? []),
    ].map(r => [r.id, r])
  );
  /** ID, ktoré sa nedá rozviazať, sa preskočí — radšej menej než prázdna karta. */
  const resolve = (ids: readonly string[]): Recommendation[] =>
    ids.map(id => byId.get(id)).filter((r): r is Recommendation => r !== undefined);

  const immediate = resolve(recommendations.roadmap.immediate0_3m);
  const medium = resolve(recommendations.roadmap.medium3_12m);
  const longTerm = resolve(recommendations.roadmap.longTerm12mPlus);

  return (
    // p-8 nechávalo pri 320 px len 222 px obsahu; padding nabieha až od sm
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6 lg:p-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="min-w-0 text-lg sm:text-xl font-bold text-[#1d1d1f]">
          {t('title')}
        </h2>
      </div>

      {/* Roadmap timeline */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-3 mb-8">
        {/* 0-3 months */}
        <div className="rounded-3xl bg-white border border-black/5 p-4 sm:p-5 hover-lift transition-colors hover:border-black/10">
          {/* flex-wrap: ikona + nadpis + odznak sa pri 320 px na jeden riadok nezmestia */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="min-w-0 text-sm font-bold text-rose-700">
              0-3 mesiace
            </h3>
            <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-xs font-bold">{t('phaseNow')}</span>
          </div>
          <div className="space-y-3 stagger-children">
            {immediate.map(r => <RoadmapItem key={r.id} r={r} />)}
          </div>
        </div>

        {/* 3-12 months */}
        <div className="rounded-3xl bg-white border border-black/5 p-4 sm:p-5 hover-lift transition-colors hover:border-black/10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="min-w-0 text-sm font-bold text-amber-700">
              3-12 mesiacov
            </h3>
            <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold">{t('phaseStrategic')}</span>
          </div>
          <div className="space-y-3 stagger-children">
            {medium.map(r => <RoadmapItem key={r.id} r={r} />)}
            {medium.length === 0 && (
              <p className="text-sm text-[#6e6e73] p-3 rounded-xl bg-[#fbfbfd] border border-black/5 italic">
                {t('focusNow')}
              </p>
            )}
          </div>
        </div>

        {/* 12+ months */}
        <div className="rounded-3xl bg-white border border-black/5 p-4 sm:p-5 hover-lift transition-colors hover:border-black/10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="min-w-0 text-sm font-bold text-[#1d1d1f]">
              12+ mesiacov
            </h3>
            <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] text-xs font-bold">{t('phaseTransform')}</span>
          </div>
          <div className="space-y-3">
            {longTerm.map(r => <RoadmapItem key={r.id} r={r} />)}
            <p className="text-sm text-[#6e6e73] p-3 rounded-xl bg-[#fbfbfd] border border-black/5 italic">
              {longTerm.length === 0 ? t('transformLater') : t('transformExpand')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick wins detail */}
      {recommendations.quickWins.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center text-sm">&#9889;</span>
            <h3 className="min-w-0 text-base sm:text-lg font-bold text-[#1d1d1f]">
              {t('quickWinsAll')}
            </h3>
          </div>
          <div className="space-y-3 stagger-children">
            {recommendations.quickWins.map(r => (
              // Dvojica odznakov s flex-shrink-0 (~178 px) vedľa textu spôsobovala
              // horizontálny pretok celej stránky — na mobile ide odznak pod text.
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-4 rounded-2xl bg-white border border-black/5 hover:border-black/10 hover:shadow-sm transition-all duration-200">
                <div className="flex-1 min-w-0 break-words">
                  <div className="font-bold text-[#1d1d1f]">{r.titleSk}</div>
                  <div className="text-sm text-[#6e6e73] mt-1 leading-relaxed">{r.descriptionSk}</div>
                </div>
                {/* Odznaky „Dopad: n/5" a „Úsilie: n/5" odstránené 7. 8. 2026.
                    `impact` a `effort` sú interné poradové parametre bez
                    deklarovanej jednotky — nie sú to človekodni ani nič, čo by
                    sa dalo overiť. Zobrazené vyzerali ako meranie, hoci slúžia
                    výhradne na zoradenie odporúčaní medzi sebou
                    (RECOMMENDATION_RULES §2.1). „Dopad" bol navyše natvrdo po
                    slovensky, takže ho český aj anglický používateľ videl
                    v slovenčine. Poradie odporúčaní sa nemení. */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
