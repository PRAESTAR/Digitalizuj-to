import type {
  Answer, Question, ResultSnapshot, AuditStep, AuditTrail,
} from '@/types';
import { scoringConfig } from '@/data/scoringConfig';

/**
 * Rozloženie výsledku na kroky, z ktorých vznikol.
 *
 * Web aj metodika tvrdia, že „každé skóre je auditovateľné a spätne
 * rozložiteľné". Do 6. 8. 2026 sa pod tým skrývala tabuľka surových odpovedí:
 * bolo z nej vidieť, ČO respondent odpovedal, ale nie AKO z toho vzniklo
 * číslo — váhy, renormalizácia cez merané kategórie, bezpečnostná penalta,
 * porovnanie s prahom pásma. Tvrdenie tak stálo na dôvere, nie na doklade.
 *
 * Táto funkcia vyrába typované kroky, ktoré tú aritmetiku ukazujú. Kroky sú
 * zároveň testovateľné: `auditEngine.test.ts` z nich skóre PREPOČÍTA a
 * porovná s tým, čo vydal engine. Keby sa výpočet a jeho vysvetlenie rozišli,
 * test spadne — presne to je rozdiel medzi doloženým a deklarovaným.
 *
 * ODVODENÝ POHĽAD, NEUKLADÁ SA. Odpovede po otázkach sa na server neposielajú
 * (rozhodnutie 5. 8. 2026, viď `lib/resultStore.ts`), takže trail sa dá
 * postaviť len tam, kde sú odpovede po ruke — na čerstvej výsledkovej
 * stránke. Na `/r/{hash}` k dispozícii nie je a ani byť nemôže; to je cena
 * za to, že sa najcitlivejšia časť dát neuchováva.
 */
export function buildAuditTrail(
  result: ResultSnapshot,
  answers: Answer[],
  questions: Question[]
): AuditTrail {
  const steps: AuditStep[] = [];
  const q = (id: string) => questions.find(x => x.id === id);

  // ── 1. Odpovede ───────────────────────────────────────────────────────────
  for (const a of answers) {
    const question = q(a.questionId);
    steps.push({
      kind: 'answer',
      id: a.questionId,
      labelSk: question?.question_sk ?? a.questionId,
      value: Array.isArray(a.value) ? a.value.join(', ') : a.value,
      score: a.isUnknown || a.wasSkipped ? null : a.score,
      weight: question?.weight ?? 0,
      excluded: a.isUnknown ? 'unknown' : a.wasSkipped ? 'skipped' : null,
      excludedReasonSk: a.isUnknown
        ? 'Odpoveď „Neviem" — do skóre nevstupuje, znižuje spoľahlivosť kategórie.'
        : a.wasSkipped
          ? (a.skipReason ?? 'Otázku preskočilo vetvenie — respondentovi sa nezobrazila.')
          : null,
    });
  }

  // ── 2. ORS kategórie ──────────────────────────────────────────────────────
  // Nezaokrúhlené hodnoty si držíme bokom: do ďalších krokov musia vstúpiť
  // presne tie, s ktorými počítal engine. Keby trail skladal celkové ORS zo
  // ZOBRAZENÝCH (zaokrúhlených) kategórií, nedal by sa z neho dopočítať
  // skutočný výsledok — a rozklad, z ktorého nevyjde pôvodné číslo, je horší
  // než žiadny. Odhalil to replay test hneď pri prvom behu (odchýlka 0,06 b).
  const exactCategory: Record<string, number> = {};
  for (const [key, cat] of Object.entries(result.ors.categories)) {
    const items = answers
      .filter(a => !a.isUnknown && !a.wasSkipped)
      .map(a => ({ a, question: q(a.questionId) }))
      .filter(({ question }) => (question?.maps_to_score ?? []).includes(`ors_${key}`))
      .map(({ a, question }) => ({
        questionId: a.questionId,
        score: a.score,
        weight: question!.weight,
      }));

    const weightSum = items.reduce((s, i) => s + i.weight, 0);
    const exact = weightSum > 0
      ? items.reduce((s, i) => s + i.score * i.weight, 0) / weightSum
      : null;
    if (exact !== null) exactCategory[key] = exact;

    steps.push({
      kind: 'category',
      id: key,
      labelSk: cat.name,
      items,
      weightSum: round4(weightSum),
      // Nezaokrúhlená hodnota — presne to, čo vstupuje do celkového priemeru.
      // Zobrazované `cat.score` je zaokrúhlené na desatinu (SCORING_SPEC §9.1).
      computed: exact !== null ? round4(exact) : null,
      displayed: cat.score,
      measured: cat.measured,
      categoryWeight: cat.weight,
      noteSk: cat.measured
        ? `Vážený priemer ${items.length} odpovedí; váha kategórie v ORS je ${Math.round(cat.weight * 100)} %.`
        : 'Kategória nemá ani jednu platnú odpoveď — do ORS nevstupuje a jej váha sa renormalizuje medzi ostatné.',
    });
  }

  // ── 3. Zloženie ORS ───────────────────────────────────────────────────────
  const measured = Object.entries(result.ors.categories).filter(([, c]) => c.measured);
  const weightSum = measured.reduce((s, [, c]) => s + c.weight, 0);
  steps.push({
    kind: 'aggregate',
    id: 'ors',
    labelSk: 'Celkové ORS',
    // Nezaokrúhlené kategóriové skóre — nie zobrazené. Viď poznámku vyššie.
    items: measured.map(([k, c]) => ({ questionId: k, score: exactCategory[k] ?? c.score ?? 0, weight: c.weight })),
    weightSum: round4(weightSum),
    computed: weightSum > 0
      ? round4(measured.reduce((s, [k, c]) => s + (exactCategory[k] ?? c.score ?? 0) * c.weight, 0) / weightSum)
      : null,
    displayed: result.ors.score,
    measured: result.ors.measuredCategories > 0,
    categoryWeight: 1,
    noteSk: `Vážený priemer ${measured.length} meraných kategórií. Menovateľ je súčet ich váh (${round4(weightSum)}), nie 1,0 — nemeraná kategória sa nepočíta ako nula.`,
  });

  // ── 4. Bezpečnostná penalta ───────────────────────────────────────────────
  if (result.ors.penaltyApplied && result.ors.score !== null && result.ors.scorePenalized !== null) {
    // Prah aj násobok počíta engine z NEZAOKRÚHLENEJ kategórie E — pri hodnote
    // tesne pod 30 rozhoduje desatina o tom, či penalta vôbec nastúpi.
    const e = exactCategory['E'] ?? result.ors.categories['E']?.score ?? 0;
    const factor = 1 - scoringConfig.securityPenaltyMaxFactor +
      scoringConfig.securityPenaltyMaxFactor * (e / scoringConfig.securityPenaltyThreshold);
    const orsExact = weightSum > 0
      ? measured.reduce((s, [k, c]) => s + (exactCategory[k] ?? c.score ?? 0) * c.weight, 0) / weightSum
      : result.ors.score;
    steps.push({
      kind: 'penalty',
      id: 'security',
      labelSk: 'Bezpečnostná penalizácia',
      inputSk: `Kategória E = ${round4(e)}/100, prah ${scoringConfig.securityPenaltyThreshold}`,
      before: round4(orsExact),
      // Šesť desatinných miest, nie štyri: násobok sa uplatňuje na skóre
      // rádovo 100, takže chyba zaokrúhlenia sa stonásobí. Pri štyroch
      // miestach z kroku nevyšlo pôvodné číslo (odchýlka 0,0522 oproti
      // povolenej polovici kroku zobrazenia) — odhalil to replay test.
      factor: Math.round(factor * 1e6) / 1e6,
      after: result.ors.scorePenalized,
      noteSk: result.ors.penaltyReason ?? '',
    });
  }

  // ── 5. Pásmo zrelosti ─────────────────────────────────────────────────────
  if (result.ors.maturityLevel !== null && result.ors.scorePenalized !== null) {
    const t = scoringConfig.maturityThresholds;
    steps.push({
      kind: 'level',
      id: 'maturity',
      labelSk: 'Úroveň zrelosti',
      value: result.ors.scorePenalized,
      thresholds: [...t],
      level: result.ors.maturityLevel,
      levelLabelSk: result.ors.maturityLabelSk ?? '',
      noteSk: `Porovnáva sa ostrým „>", takže prah patrí do nižšieho pásma (SCORING_SPEC §9.2). Rozhoduje penalizované skóre, nie surové.`,
    });
  }

  // ── 6. DII ────────────────────────────────────────────────────────────────
  if (result.dii.measured && result.dii.score12 !== null) {
    steps.push({
      kind: 'dii',
      id: 'dii',
      labelSk: 'DII — extrapolácia na 12 indikátorov',
      met: result.dii.metIndicators,
      measuredCount: result.dii.measuredIndicators,
      total: scoringConfig.diiTotalIndicators,
      computed: result.dii.score12,
      indicators: result.dii.indicators.map(i => ({
        code: i.code, status: i.status, sourceQuestions: [...i.sourceQuestions],
      })),
      noteSk: `round(${result.dii.metIndicators} / ${result.dii.measuredIndicators} × ${scoringConfig.diiTotalIndicators}) = ${result.dii.score12}. Nemeraný indikátor sa nefabrikuje na nesplnený — preto extrapolácia a priznaný rozsah.`,
    });
  }

  // ── 7. Benchmark ──────────────────────────────────────────────────────────
  for (const [key, cmp] of Object.entries(result.benchmarks)) {
    if (!cmp || typeof cmp !== 'object' || !('percentile' in cmp)) continue;
    const c = cmp as { yourScore: number | null; benchmarkScore: number; percentile: number; source?: string };
    steps.push({
      kind: 'benchmark',
      id: key,
      labelSk: key,
      yourScore: c.yourScore,
      referenceScore: c.benchmarkScore,
      percentile: c.percentile,
      sourceSk: c.source === 'eurostat'
        ? 'Meraná distribúcia Eurostat DII 2025'
        : 'Expertný odhad — nie meraná distribúcia',
    });
  }

  // ── 8. Riziká ─────────────────────────────────────────────────────────────
  for (const f of result.tdri.factors.filter(x => x.active)) {
    steps.push({
      kind: 'risk',
      id: f.id,
      labelSk: f.name,
      penalty: f.penalty,
      evidenceStrength: f.evidenceStrength,
      evidenceSk: f.evidence,
      sourceAnswers: [...f.sourceAnswers],
    });
  }

  // ── 9. Odporúčania ────────────────────────────────────────────────────────
  const recs = [
    ...result.recommendations.criticalRisks,
    ...(result.recommendations.riskMitigations ?? []),
    ...result.recommendations.quickWins,
    ...result.recommendations.strategicInitiatives,
    ...result.recommendations.longTermInitiatives,
  ];
  for (const r of recs) {
    steps.push({
      kind: 'recommendation',
      id: r.id,
      labelSk: r.titleSk,
      recType: r.type,
      priorityScore: r.priorityScore,
      urgency: r.urgency,
      impact: r.impact,
      effort: r.effort,
      triggeredBy: [...r.triggeredBy],
      sourceAnswers: [...r.sourceAnswers],
    });
  }

  return {
    modelVersion: result.modelVersion,
    steps,
    /**
     * Čo trail NEPOKRÝVA — priznané, nie zamlčané. Bez tejto vety by
     * „kompletný audit trail" v UI sľuboval viac, než dodáva.
     */
    limitationsSk: [
      'Trail sa skladá z odpovedí, ktoré sú v prehliadači — na permanentnom odkaze `/r/{hash}` k dispozícii nie je, lebo odpovede po otázkach sa na server neukladajú.',
      'ROI má vlastný rozklad po procesoch v paneli Business Impact (`calculationAudit`); tu sa neopakuje.',
      'Zobrazené skóre sú zaokrúhlené na desatinu, kroky uvádzajú aj nezaokrúhlenú hodnotu — rozdiel do 0,05 bodu je očakávaný (SCORING_SPEC §9.1).',
    ],
  };
}

/**
 * Štyri desatinné miesta — dosť na doloženie, málo na šum v UI.
 *
 * Presnosť v traile nie je kozmetika: keď z kroku nevyjde pôvodné číslo,
 * rozklad je horší než žiadny, lebo tvrdí niečo, čo neplatí. Preto sa všade,
 * kde sa hodnota ďalej NÁSOBÍ, používa vyššia presnosť (viď násobok penalty).
 */
function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
