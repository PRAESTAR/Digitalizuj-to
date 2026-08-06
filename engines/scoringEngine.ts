import type { Answer, DIIScore, DIIIndicator, ORSScore, CategoryScore, ConfidenceBand, Question } from '@/types';
import { scoringConfig, maturityLabels, diiLevelLabels, categoryNames } from '@/data/scoringConfig';
import { diiIndicators, excludedDiiQuestionIds, mappedDiiQuestionIds, type DiiCriterion } from '@/data/diiIndicators';

/**
 * Platná odpoveď = existuje a nie je Neviem ani preskočená. Nemerané sa
 * nikde nefabrikuje na nulu — otázka bez platnej odpovede jednoducho
 * nevstupuje do agregácie (indikátor/kategória ostáva nemeraná).
 *
 * Exportované, aby rovnakú definíciu používal aj `recommendationEngine`
 * — keby si každý engine držal vlastnú, časom sa rozídu a odporúčania by
 * sa spúšťali nad dátami, ktoré skóre považuje za nemerané.
 */
export function isValidAnswer(answers: Answer[], questionId: string): Answer | undefined {
  return validAnswer(answers, questionId);
}

function validAnswer(answers: Answer[], questionId: string): Answer | undefined {
  const a = answers.find(ans => ans.questionId === questionId);
  return a && !a.isUnknown && !a.wasSkipped ? a : undefined;
}

function criterionMet(criterion: DiiCriterion, answer: Answer): boolean {
  if ('minScore' in criterion.metWhen) {
    return answer.score >= criterion.metWhen.minScore;
  }
  const values = Array.isArray(answer.value) ? answer.value : [answer.value];
  return criterion.metWhen.anyOfValues.some(v => values.includes(v));
}

/** Zaokrúhlenie na desatinu — VÝHRADNE pre zobrazenie, nikdy pred ďalším výpočtom. */
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * O koľko bodov pohne skóre otázky jedna „najmenšia zmena odpovede".
 *
 * `single_choice`: posun o susednú možnosť, teda `100 / (počet možností − 1)`.
 * `multi_select`: zaškrtnutie alebo odškrtnutie JEDNEJ položky. Nie celý
 * rozsah — pri `cx_A05`/`ind_03c_manual` posunie jedna položka skóre najviac
 * o 14 bodov, nie o 100. Brať multi-select ako plný stupeň by nafúklo rozsah
 * kategórie A štvornásobne oproti tomu, čo sa reálne môže stať.
 */
function questionStep(q: Question): number {
  const options = q.options ?? [];
  if (q.question_type === 'multi_select') {
    if (options.length === 0) return 0;
    const largest = Math.max(...options.map(o => Math.abs(o.score)));
    if (q.scoring_mode === 'inverted') return largest; // hodnoty sú už v bodoch
    const max = q.max_score ?? 100;
    return max > 0 ? (largest / max) * 100 : 0;
  }
  return options.length > 1 ? 100 / (options.length - 1) : 100;
}

/**
 * O koľko bodov pohne kategóriou zmena JEDNEJ odpovede.
 *
 * Kategória je vážený priemer položiek, takže vplyv položky je `w_i / Σw`
 * krát jej krok. Maximum cez položky je citlivosť odhadu na jedinú odpoveď —
 * priamy dôsledok toho, koľkými položkami je kategória meraná. Kategória
 * s jednou otázkou sa pohne o celý stupeň, kategória so šiestimi o zlomok.
 * Presne tento rozdiel odlišuje indikatívny kvíz od komplexného a dovtedy
 * nebol na výsledku vidieť.
 *
 * Nie je to štatistická chyba merania — je to citlivostná analýza, ktorú
 * vieme spočítať bez pilotných dát.
 */
function categorySensitivity(
  items: { weight: number; step: number }[]
): number {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  if (totalWeight <= 0 || items.length === 0) return 0;
  let worst = 0;
  for (const item of items) {
    worst = Math.max(worst, (item.weight / totalWeight) * item.step);
  }
  return Math.round(Math.min(100, worst) * 10) / 10;
}

/**
 * Per-indikátorová DII agregácia podľa DII v3/2025 (Eurostat isoc_e_dii).
 *
 * Mapovanie otázok na 12 indikátorov žije v data/diiIndicators.json.
 * Indikátor je meraný, ak má aspoň jedna kritériová otázka platnú odpoveď;
 * splnený, ak ľubovoľné kritérium sedí. score12 = extrapolácia
 * round(splnené / merané × 12); score100 je jemná metrika (priemer skóre
 * platných odpovedí namapovaných otázok). Otázky s 'dii' tagom mimo v3
 * zoznamu (excludedDiiQuestionIds) do DII nevstupujú — striktný v3 režim.
 */
export function calculateDII(
  answers: Answer[],
  questions: Question[]
): DIIScore {
  const questionIds = new Set(questions.map(q => q.id));

  const indicators: DIIIndicator[] = diiIndicators.map(def => {
    const sourceQuestions: string[] = [];
    let met = false;
    for (const criterion of def.criteria) {
      if (!questionIds.has(criterion.questionId)) continue;
      const answer = validAnswer(answers, criterion.questionId);
      if (!answer) continue;
      sourceQuestions.push(criterion.questionId);
      if (criterionMet(criterion, answer)) met = true;
    }
    const measured = sourceQuestions.length > 0;
    return {
      code: def.code,
      nameSk: def.nameSk,
      status: measured ? (met ? 'met' : 'not_met') : 'unmeasured',
      sourceQuestions,
    };
  });

  const measuredIndicators = indicators.filter(i => i.status !== 'unmeasured').length;
  const metIndicators = indicators.filter(i => i.status === 'met').length;

  // Confidence z pokrytia indikátorov (nie otázok): ≥10 = high, ≥6 = medium,
  // ≥1 = low; 0 meraných = nemerané DII (žiadne skóre, žiadne percentily).
  const confidence: DIIScore['confidence'] =
    measuredIndicators >= 10 ? 'high' : measuredIndicators >= 6 ? 'medium' : 'low';

  if (measuredIndicators === 0) {
    return {
      score100: null,
      score12: null,
      measured: false,
      measuredIndicators: 0,
      metIndicators: 0,
      confidence: 'low',
      level: null,
      levelLabelSk: null,
      indicators,
      band: null,
    };
  }

  const score12 = Math.round((metIndicators / measuredIndicators) * 12);

  // Jemná metrika 0–100: priemer len cez platné odpovede NAMAPOVANÝCH otázok
  // (vylúčené 'dii' otázky mimo v3 sa nepriemerujú).
  const mappedAnswers = answers.filter(a => {
    if (!mappedDiiQuestionIds.has(a.questionId) || excludedDiiQuestionIds.has(a.questionId)) return false;
    if (!questionIds.has(a.questionId)) return false;
    return !a.isUnknown && !a.wasSkipped;
  });
  const score100 = mappedAnswers.length > 0
    ? Math.round((mappedAnswers.reduce((sum, a) => sum + a.score, 0) / mappedAnswers.length) * 10) / 10
    : null;

  let level: NonNullable<DIIScore['level']>;
  if (score12 <= 3) level = 'very_low';
  else if (score12 <= 6) level = 'low';
  else if (score12 <= 9) level = 'high';
  else level = 'very_high';

  // Nemeraný indikátor môže byť splnený aj nesplnený. Skutočný počet preto
  // leží medzi „všetky nemerané nesplnené" (= metIndicators) a „všetky
  // splnené" (= metIndicators + nemerané). Extrapolovaný bod vždy padne
  // dovnútra: z m ≤ k a k ≤ 12 vyplýva 12m/k ≤ m + 12 − k.
  const unmeasured = 12 - measuredIndicators;
  const band: ConfidenceBand = {
    lower: metIndicators,
    upper: metIndicators + unmeasured,
    reasonSk: unmeasured === 0
      ? 'Všetkých 12 indikátorov je zmeraných — rozsah je jediná hodnota.'
      : `${unmeasured} z 12 indikátorov dotazník nezisťoval, takže skutočný počet leží v tomto rozsahu.`,
  };

  return {
    score100,
    score12,
    measured: true,
    measuredIndicators,
    metIndicators,
    confidence,
    level,
    levelLabelSk: diiLevelLabels[level],
    indicators,
    band,
  };
}

/**
 * Calculate Operational Readiness Score from answers.
 *
 * Vážený priemer meraných kategórií A–F s renormalizáciou: nemeraná
 * kategória (žiadna platná odpoveď) má score null a NEVSTUPUJE do súčtu
 * ani do menovateľa váh — nezmerané nie je nula. Dôsledok: skóre vypovedá
 * o tom, čo sa meralo; pokrytie komunikuje measuredCategories + confidence.
 */
export function calculateORS(
  answers: Answer[],
  questions: Question[]
): ORSScore {
  const categories: Record<string, CategoryScore> = {};
  // Neskrátené skóre kategórií. Zobrazované hodnoty v `categories` sú
  // zaokrúhlené na desatinu; agregácia, penalta aj maturity level musia
  // počítať odtiaľto, inak sa chyba zaokrúhlenia znásobí a na hranici pásma
  // preklopí level (namerané: 27 zo 4 000 kombinácií odpovedí).
  const catScoresExact: Record<string, number> = {};
  const validCategories = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (const cat of validCategories) {
    // Výber podľa deklarovaného kontraktu maps_to_score (ors_A…ors_F), nie
    // podľa q.category: category je organizačné pole modulu — cez neho by do
    // skóre vstupovali aj čisto risk-flag/DII otázky (cx_B02 so 6/7 nulovými
    // možnosťami, cx_B06_ecommerce) a strácali by sa deklarované sekundárne
    // príspevky duálne tagovaných otázok (napr. server age → ors_D aj ors_E).
    const catQuestions = questions.filter(q => (q.maps_to_score ?? []).includes(`ors_${cat}`));
    const catAnswers = answers.filter(a => {
      const q = catQuestions.find(q => q.id === a.questionId);
      return q && !a.isUnknown && !a.wasSkipped;
    });

    let score = 0;
    let totalWeight = 0;

    for (const ans of catAnswers) {
      const q = catQuestions.find(q => q.id === ans.questionId)!;
      score += ans.score * q.weight;
      totalWeight += q.weight;
    }

    const measured = catAnswers.length > 0 && totalWeight > 0;
    const catScore = measured ? score / totalWeight : null;

    // Spoľahlivosť sa počíta z toho, čo sa respondenta REÁLNE spýtalo:
    // podiel „Neviem" na položených otázkach. Preskočené vetvením a otázky,
    // ku ktorým sa nedostal, sa nerátajú — nie sú to jeho nevedomosti.
    // Predtým bol menovateľ počet všetkých otázok kategórie, takže adaptívne
    // vetvenie samo znižovalo spoľahlivosť, hoci respondent odpovedal na
    // všetko, čo dostal.
    const catAnswerRecords = answers.filter(a => catQuestions.some(q => q.id === a.questionId));
    const unknownCount = catAnswerRecords.filter(a => a.isUnknown).length;
    const askedCount = catAnswerRecords.filter(a => !a.wasSkipped).length;
    const unknownRatio = askedCount > 0 ? unknownCount / askedCount : 1;

    let confidence: CategoryScore['confidence'];
    if (unknownRatio > scoringConfig.unknownAnswerExclusionThreshold) confidence = 'low';
    else if (unknownRatio > 0.25) confidence = 'medium';
    else confidence = 'high';

    // Citlivosť sa počíta len z položiek, ktoré kategóriu naozaj sýtia —
    // teda z tých so ZODPOVEDANOU otázkou. Rátať aj nezodpovedané by rozsah
    // nafúklo o veci, ktoré do priemeru nikdy nevstúpili.
    const answeredItems = catAnswers.map(ans => {
      const q = catQuestions.find(q => q.id === ans.questionId)!;
      return { weight: q.weight, step: questionStep(q) };
    });
    const sensitivity = measured ? categorySensitivity(answeredItems) : 0;
    const catBand: ConfidenceBand | null = measured && catScore !== null
      ? {
          lower: Math.round(Math.max(0, catScore - sensitivity) * 10) / 10,
          upper: Math.round(Math.min(100, catScore + sensitivity) * 10) / 10,
          reasonSk: catAnswers.length === 1
            ? 'Kategóriu meria jediná otázka — jej zmena posunie skóre o celý stupeň škály.'
            : `Zmena jednej z ${catAnswers.length} odpovedí o stupeň posunie skóre o ${sensitivity} b.`,
        }
      : null;

    if (catScore !== null) catScoresExact[cat] = catScore;

    categories[cat] = {
      name: categoryNames[cat],
      score: catScore !== null ? Math.round(catScore * 10) / 10 : null,
      measured,
      weight: scoringConfig.categoryWeights[cat],
      contribution: catScore !== null
        ? Math.round(catScore * scoringConfig.categoryWeights[cat] * 10) / 10
        : null,
      answeredQuestions: catAnswers.length,
      totalQuestions: catQuestions.length,
      confidence,
      band: catBand,
    };
  }

  // Renormalizovaný vážený priemer: len merané kategórie, menovateľ = súčet
  // ich váh. (Pôvodný súčet contribution s implicitným menovateľom 1.0
  // trestal nemerané kategórie ako nulové — fantómový strop skóre.)
  const measuredCats = validCategories.filter(cat => categories[cat].measured);
  const measuredCategories = measuredCats.length;

  let orsScore: number | null = null;
  let orsScoreExact: number | null = null;
  if (measuredCategories > 0) {
    let weightedSum = 0;
    let weightSum = 0;
    for (const cat of measuredCats) {
      weightedSum += catScoresExact[cat] * categories[cat].weight;
      weightSum += categories[cat].weight;
    }
    orsScoreExact = weightedSum / weightSum;
    orsScore = round1(orsScoreExact);
  }

  // Rozsah celku sa skladá z rozsahov kategórií rovnakým váženým priemerom
  // ako bodový odhad — bod preto leží vždy vnútri. Kategória meraná jedinou
  // otázkou rozsah roztiahne úmerne svojej váhe, čo je presne ten rozdiel
  // medzi indikatívnym a komplexným kvízom, ktorý dovtedy nebolo vidieť.
  let orsBand: ConfidenceBand | null = null;
  if (orsScore !== null && measuredCategories > 0) {
    let lowerSum = 0, upperSum = 0, bandWeightSum = 0;
    let thinnest = '';
    let widest = -1;
    for (const cat of measuredCats) {
      const c = categories[cat];
      if (!c.band) continue;
      lowerSum += c.band.lower * c.weight;
      upperSum += c.band.upper * c.weight;
      bandWeightSum += c.weight;
      const width = c.band.upper - c.band.lower;
      if (width > widest) { widest = width; thinnest = c.name; }
    }
    if (bandWeightSum > 0) {
      orsBand = {
        lower: Math.round((lowerSum / bandWeightSum) * 10) / 10,
        upper: Math.round((upperSum / bandWeightSum) * 10) / 10,
        reasonSk: measuredCategories < 6
          ? `Merané sú ${measuredCategories} zo 6 oblastí; najmenej presne je meraná oblasť ${thinnest}.`
          : `Najmenej presne je meraná oblasť ${thinnest} — tam sa skóre hýbe najviac.`,
      };
    }
  }

  // Security penalty (category E)
  let penaltyApplied = false;
  let penaltyReason: string | null = null;
  let scorePenalized = orsScore;
  let scorePenalizedExact = orsScoreExact;

  // Penalizácia sa aplikuje len na MERANÚ kategóriu E — bez zodpovedaných
  // bezpečnostných otázok by sa penalizoval nezmeraný stav (E=0 by nebolo zistenie, ale artefakt).
  const securityMeasured = categories['E']?.measured ?? false;
  // Prah aj samotný násobok sa počítajú z NEZAOKRÚHLENÉHO skóre kategórie E:
  // pri hodnote tesne pod 30 rozhodovala desatina o tom, či penalta vôbec
  // nastúpi, a zaokrúhlená vstupná hodnota tak menila výsledok skokom.
  const securityScore = catScoresExact['E'] ?? null;
  if (
    orsScoreExact !== null &&
    securityMeasured &&
    securityScore !== null &&
    securityScore < scoringConfig.securityPenaltyThreshold
  ) {
    const factor = 1 - scoringConfig.securityPenaltyMaxFactor +
      scoringConfig.securityPenaltyMaxFactor * (securityScore / scoringConfig.securityPenaltyThreshold);
    scorePenalizedExact = orsScoreExact * factor;
    scorePenalized = round1(scorePenalizedExact);
    penaltyApplied = true;
    penaltyReason = `Kritický bezpečnostný stav (E: ${round1(securityScore)}/100) — penalizácia ${Math.round((1 - factor) * 100)}%`;

    // Pásmo prejde tou istou penaltou ako bod. Bez toho karta zobrazovala
    // penalizované číslo nad rozsahom počítaným z nepenalizovaného skóre —
    // firma so slabou bezpečnosťou tak videla napríklad „28/100" a hneď pod
    // tým „Rozsah 35–46", teda číslo mimo vlastného rozsahu. Penalta je
    // deterministický násobok, takže rovnaký prenos hraníc je korektný:
    // rozsah ostáva rozsahom TOHO ISTÉHO údaja, ktorý je nad ním vypísaný.
    if (orsBand) {
      orsBand = {
        lower: round1(orsBand.lower * factor),
        upper: round1(orsBand.upper * factor),
        reasonSk: `${orsBand.reasonSk} Rozsah je po bezpečnostnej penalizácii, rovnako ako zobrazené skóre.`,
      };
    }
  }

  // Maturity level — len pri meranom ORS, a z NEZAOKRÚHLENEJ hodnoty.
  //
  // Pásma sú polootvorené zdola: porovnáva sa ostrým `>`, takže prah patrí
  // do nižšieho pásma. Pri `maturityThresholds = [20, 40, 60, 80]`:
  //   level 0 = [0, 20]   level 1 = (20, 40]   level 2 = (40, 60]
  //   level 3 = (60, 80]  level 4 = (80, 100]
  // Hranica sa vyhodnocuje nad PENALIZOVANÝM skóre — nálepka teda hovorí
  // o stave po zohľadnení bezpečnosti, nie o surovej zrelosti.
  let maturityLevel: number | null = null;
  if (scorePenalizedExact !== null) {
    const thresholds = scoringConfig.maturityThresholds;
    maturityLevel = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (scorePenalizedExact > thresholds[i]) maturityLevel = i + 1;
    }
  }

  return {
    score: orsScore,
    scorePenalized,
    measuredCategories,
    maturityLevel,
    maturityLabelSk: maturityLevel !== null ? maturityLabels[maturityLevel] : null,
    categories,
    penaltyApplied,
    penaltyReason,
    band: orsBand,
  };
}

// `getMaturityLevel` odstránený 6. 8. 2026. Nemal jediného volajúceho a jeho
// návratová hodnota −1 nebola platnou úrovňou, takže index do
// `manualShareFromMaturity[-1]` by dal `undefined`. Zrelosť sa číta výhradne
// v `roiEngine.extractROIInputs`, ktorý ju validuje proti doméne 0–4 a pri
// neplatnej hodnote vracia `null` — teda „nezistené", nie tichý default.
