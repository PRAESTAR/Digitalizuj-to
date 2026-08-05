import diiIndicatorsJson from './diiIndicators.json';

/**
 * Per-indikátorové mapovanie otázok na 12 oficiálnych DII v3/2025 premenných.
 *
 * Zdroj pravdy je data/diiIndicators.json — JSON preto, aby ho vedel čítať
 * aj build-time validátor (scripts/validate-model.mjs), ktorý nevie importovať
 * TypeScript. Tento wrapper dodáva typy a odvodené pohľady pre engine.
 */

export type DiiCriterion = {
  questionId: string;
  /** minScore pre single_choice prahy, anyOfValues pre multi_select výbery. */
  metWhen: { minScore: number } | { anyOfValues: string[] };
  /** Prečo tento prah — audituje sa, súčasť obhájiteľnosti modelu. */
  rationale: string;
};

export type DiiIndicatorDef = {
  code: string; // 'DII1' … 'DII12'
  nameSk: string; // presne podľa METHODOLOGY §2.1
  criteria: DiiCriterion[]; // prázdne = nepokrytý indikátor
  uncoveredReason?: string;
};

type DiiIndicatorsFile = {
  version: string;
  methodology: string;
  excludedDiiQuestions: { questionId: string; reason: string }[];
  indicators: DiiIndicatorDef[];
};

const file = diiIndicatorsJson as unknown as DiiIndicatorsFile;

export const diiIndicators: DiiIndicatorDef[] = file.indicators;

/**
 * Otázky s 'dii' tagom, ktoré NEZODPOVEDAJÚ žiadnej v3/2025 premennej
 * (striktný v3 režim) — do DII agregácie nevstupujú. Vynucuje validátor.
 */
export const excludedDiiQuestionIds: Set<string> = new Set(
  file.excludedDiiQuestions.map((e) => e.questionId)
);

/** Všetky otázky, ktoré sýtia aspoň jeden DII indikátor. */
export const mappedDiiQuestionIds: Set<string> = new Set(
  file.indicators.flatMap((ind) => ind.criteria.map((c) => c.questionId))
);
