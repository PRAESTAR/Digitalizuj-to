'use client';

import type { AuditTrail, AuditStep } from '@/types';

interface Props {
  trail: AuditTrail;
}

/**
 * Rozklad skóre — aritmetika medzi odpoveďami a číslom na karte.
 *
 * Audit trail dovtedy ukazoval len tabuľku odpovedí: bolo z nej vidieť, ČO
 * respondent odpovedal, ale nie AKO z toho vzniklo ORS. Tvrdenie „každé skóre
 * je auditovateľné a spätne rozložiteľné" tak stálo na dôvere.
 *
 * Kroky sú tie isté, ktoré prepočítava replay test v CI — čo je tu napísané,
 * je overené, nie deklarované.
 */
export default function ScoreDerivation({ trail }: Props) {
  const categories = trail.steps.filter((s): s is Extract<AuditStep, { kind: 'category' }> => s.kind === 'category');
  const aggregate = trail.steps.find((s): s is Extract<AuditStep, { kind: 'aggregate' }> => s.kind === 'aggregate');
  const penalty = trail.steps.find((s): s is Extract<AuditStep, { kind: 'penalty' }> => s.kind === 'penalty');
  const level = trail.steps.find((s): s is Extract<AuditStep, { kind: 'level' }> => s.kind === 'level');
  const dii = trail.steps.find((s): s is Extract<AuditStep, { kind: 'dii' }> => s.kind === 'dii');
  const anchors = trail.steps.filter((s): s is Extract<AuditStep, { kind: 'anchor' }> => s.kind === 'anchor');

  return (
    <div className="space-y-4 text-sm">
      {/* ── Veľkostné kotvy ──
          Ide pred kategórie zámerne: mení vstupné čísla, takže bez neho by
          tabuľka nižšie uvádzala hodnoty, ktoré sa nezhodujú s možnosťami
          otázky, a čitateľ by nemal ako zistiť prečo. */}
      {anchors.length > 0 && (
        <div>
          <h3 className="font-bold text-[#1d1d1f] mb-1">
            Prepočet na veľkosť firmy ({anchors[0].bandLabelSk})
          </h3>
          <p className="text-xs text-[#6e6e73] leading-relaxed mb-2">
            Časť možností opisuje štruktúru, ktorú firma vašej veľkosti nemôže mať bez ohľadu
            na to, ako dobre digitalizuje. Pri takých otázkach dostáva plný počet bodov najvyššia
            možnosť, ktorá je pre vás dosiahnuteľná. Nula zostáva nulou.
          </p>
          <div className="space-y-2">
            {anchors.map((a) => (
              <div key={a.id} className="rounded-2xl bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs font-bold text-[#1d1d1f] mb-1">{a.labelSk}</p>
                <p className="font-mono text-xs break-all mb-1.5">
                  {a.rawScore} × ({a.questionMax}/{a.ceilingScore}) = <strong>{a.adjustedScore}</strong>
                </p>
                <p className="text-xs text-[#6e6e73] leading-relaxed">
                  Strop pre vašu veľkosť: <em>{a.ceilingLabelSk}</em>. {a.rationaleSk}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Kategórie ── */}
      <div>
        <h3 className="font-bold text-[#1d1d1f] mb-2">1. Vážený priemer v každej oblasti</h3>
        {/* Verzia váh patrí k číslam, nie do pätičky: váhy sú expertný odhad
            a ich zmena preklopí maturity level v 3–8 % prípadov (METHODOLOGY
            §12.2). Bez verzie sa dva výsledky nedajú porovnať. */}
        <p className="text-xs text-[#86868b] mb-2">
          Schéma váh: <span className="font-mono">{trail.modelVersion.scoringConfigVersion}</span>
          {' '}&middot; expertne stanovená, citlivosť doložená v metodike (§12.2)
        </p>
        <div className="overflow-x-auto rounded-2xl border border-black/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-black/[0.03] text-[#86868b] font-bold">
                <th className="text-left py-2.5 px-3 whitespace-nowrap">Oblasť</th>
                <th className="text-right py-2.5 px-3 whitespace-nowrap">Otázok</th>
                <th className="text-right py-2.5 px-3 whitespace-nowrap">Σ váh</th>
                <th className="text-right py-2.5 px-3 whitespace-nowrap">Skóre</th>
                <th className="text-right py-2.5 px-3 whitespace-nowrap">Váha v ORS</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-black/5">
                  <td className="py-2 px-3 break-words">
                    <span className="font-mono font-bold text-[#0068d6]">{c.id}</span> {c.labelSk}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">{c.items.length}</td>
                  <td className="py-2 px-3 text-right font-mono">{c.weightSum}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    {c.measured ? c.computed : <span className="text-[#86868b]">nemerané</span>}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {c.measured ? `${Math.round(c.categoryWeight * 100)} %` : <span className="text-[#86868b]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Zloženie ── */}
      {aggregate && (
        <div>
          <h3 className="font-bold text-[#1d1d1f] mb-1">2. Zloženie do celkového ORS</h3>
          <p className="text-xs text-[#6e6e73] leading-relaxed mb-2">{aggregate.noteSk}</p>
          <p className="font-mono text-xs bg-black/[0.03] border border-black/5 rounded-xl px-3 py-2 break-all">
            {aggregate.items.map((i) => `${i.questionId}(${round1(i.score)}×${i.weight})`).join(' + ')}
            {' / '}{aggregate.weightSum} = <strong>{aggregate.computed}</strong>
          </p>
        </div>
      )}

      {/* ── Penalta ── */}
      {penalty && (
        <div>
          <h3 className="font-bold text-[#1d1d1f] mb-1">3. {penalty.labelSk}</h3>
          <p className="text-xs text-[#6e6e73] leading-relaxed mb-2">{penalty.inputSk}</p>
          <p className="font-mono text-xs bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 break-all">
            {penalty.before} × {penalty.factor} = <strong>{penalty.after}</strong>
          </p>
        </div>
      )}

      {/* ── Pásmo ── */}
      {level && (
        <div>
          <h3 className="font-bold text-[#1d1d1f] mb-1">{penalty ? 4 : 3}. {level.labelSk}</h3>
          <p className="font-mono text-xs bg-black/[0.03] border border-black/5 rounded-xl px-3 py-2 break-all">
            {level.displayedValue} vs. prahy [{level.thresholds.join(', ')}] &rarr;{' '}
            <strong>Level {level.level} — {level.levelLabelSk}</strong>
          </p>
          <p className="text-xs text-[#6e6e73] leading-relaxed mt-1">{level.noteSk}</p>
        </div>
      )}

      {/* ── DII ── */}
      {dii && (
        <div>
          <h3 className="font-bold text-[#1d1d1f] mb-1">{dii.labelSk}</h3>
          <p className="font-mono text-xs bg-black/[0.03] border border-black/5 rounded-xl px-3 py-2 break-all">
            {dii.noteSk}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {dii.indicators.map((i) => (
              <span
                key={i.code}
                title={i.sourceQuestions.join(', ') || 'žiadna otázka tento indikátor nemeria'}
                className={`font-mono text-[10px] px-1.5 py-1 rounded-lg border ${
                  i.status === 'met'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : i.status === 'not_met'
                      ? 'bg-black/[0.03] border-black/10 text-[#6e6e73]'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                {i.code}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#86868b] mt-1.5">
            Zelená = splnený &middot; sivá = nesplnený &middot; oranžová = dotazník ho nezisťoval
          </p>
        </div>
      )}

      {/* ── Čo rozklad nepokrýva ── */}
      <div className="rounded-2xl bg-black/[0.03] border border-black/5 p-3">
        <p className="text-xs font-bold text-[#1d1d1f] mb-1.5">Čo tento rozklad nepokrýva</p>
        <ul className="text-xs text-[#6e6e73] leading-relaxed space-y-1 list-disc pl-4">
          {trail.limitationsSk.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
    </div>
  );
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
