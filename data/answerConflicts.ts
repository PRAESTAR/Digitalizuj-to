import type { Answer, Question } from '@/types';

/**
 * Dvojice odpovedí, ktoré sa logicky vylučujú.
 *
 * PREČO EXISTUJÚ. Toto je vecné jadro zamietnutého bodu o reverse-keyed
 * položkách (7. 8. 2026). Reverse-keying je technika viazaná na formát
 * súhlas–nesúhlas, ktorý táto banka nepoužíva ani raz — otázky majú
 * behaviorálne ukotvené možnosti, takže „otočiť" ich nie je čo. Potreba, na
 * ktorú reverse-keying mieril, ale zostáva: zachytiť odpoveď vyplnenú
 * nepozorne alebo omylom.
 *
 * Rieši sa deterministicky nad tým, čo v banke UŽ JE. Rozpor
 * „fakturácia je plne automatizovaná" + „fakturáciu robíme prevažne ručne"
 * je logicky jednoznačný — na rozdiel od parafrázovej kontrolnej dvojice,
 * kde by sa nedalo odlíšiť nepozornosť od toho, že dve formulácie nie sú
 * ekvivalentné.
 *
 * ČO TO NIE JE. Nie je to detektor nepozornosti ani skóre kvality odpovedí,
 * ani skryté. Žiadny prah, žiadne obvinenie. Rozpor sa respondentovi ukáže
 * ako ponuka opraviť si odpoveď — a keď na nej trvá, model ju berie tak,
 * ako ju dal. Skóre sa nemení ani v jednom prípade.
 *
 * Referenčnú integritu (že ID otázok aj hodnoty možností existujú) stráži
 * `scripts/validate-model.mjs` (#20) — bez toho by sa zoznam pri prvej
 * revízii banky ticho rozišiel a prestal hlásiť čokoľvek.
 */

/** Jedna strana rozporu: otázka a hodnoty, pri ktorých strana „platí". */
export interface ConflictSide {
  questionId: string;
  /** Hodnoty, ktoré stranu spúšťajú. Pri multi_select stačí jedna zo zvolených. */
  anyOf: string[];
}

export interface AnswerConflict {
  id: string;
  left: ConflictSide;
  right: ConflictSide;
  /** Čo si presne odporuje — vysvetlenie pre respondenta, nie pre vývojára. */
  messageSk: string;
}

export const answerConflicts: AnswerConflict[] = [
  {
    id: 'invoicing_automated_vs_manual_cx',
    left: { questionId: 'cx_A02', anyOf: ['automated', 'integrated'] },
    right: { questionId: 'cx_A05', anyOf: ['invoicing'] },
    messageSk:
      'Pri fakturácii ste uviedli, že prebieha v prepojenom systéme alebo plne automatizovane — a zároveň ste fakturáciu označili za prevažne ručný proces.',
  },
  {
    id: 'invoicing_automated_vs_manual_ind',
    left: { questionId: 'ind_03', anyOf: ['3', '4'] },
    right: { questionId: 'ind_03c_manual', anyOf: ['invoicing'] },
    messageSk:
      'Uviedli ste, že objednávky a faktúry spracúva systém sám — a zároveň ste fakturáciu označili za prevažne ručný proces.',
  },
  {
    id: 'none_with_other_cx',
    left: { questionId: 'cx_A05', anyOf: ['none'] },
    right: {
      questionId: 'cx_A05',
      anyOf: ['invoicing', 'hr_onboarding', 'warehouse', 'reporting', 'service', 'purchasing'],
    },
    messageSk:
      'Označili ste „Žiadny — všetko máme digitalizované" spolu s konkrétnymi ručnými procesmi.',
  },
  {
    id: 'none_with_other_ind',
    left: { questionId: 'ind_03c_manual', anyOf: ['none'] },
    right: {
      questionId: 'ind_03c_manual',
      anyOf: ['invoicing', 'hr_onboarding', 'warehouse', 'reporting', 'service', 'purchasing'],
    },
    messageSk:
      'Označili ste „Žiadny — všetko máme digitalizované" spolu s konkrétnymi ručnými procesmi.',
  },
];

/** Rozpor nájdený v konkrétnych odpovediach — s textami na zobrazenie. */
export interface DetectedConflict {
  id: string;
  messageSk: string;
  /** Otázky, ktorých sa rozpor týka — respondent sa k nim môže vrátiť. */
  questionIds: string[];
  questionLabelsSk: string[];
}

/**
 * Rozpory v odpovediach. Neplatná odpoveď („Neviem", preskočená) rozpor
 * nikdy nespustí — rovnaká sémantika ako v skórovaní a v odporúčaniach:
 * nezistené nie je tvrdenie.
 */
export function detectAnswerConflicts(
  answers: Answer[],
  questions: Question[]
): DetectedConflict[] {
  const valid = new Map<string, Answer>();
  for (const a of answers) {
    if (!a.isUnknown && !a.wasSkipped) valid.set(a.questionId, a);
  }

  const matches = (side: ConflictSide): boolean => {
    const a = valid.get(side.questionId);
    if (!a) return false;
    const values = Array.isArray(a.value) ? a.value : [a.value];
    return side.anyOf.some(v => values.includes(v));
  };

  const out: DetectedConflict[] = [];
  for (const c of answerConflicts) {
    if (!matches(c.left) || !matches(c.right)) continue;
    const ids = c.left.questionId === c.right.questionId
      ? [c.left.questionId]
      : [c.left.questionId, c.right.questionId];
    out.push({
      id: c.id,
      messageSk: c.messageSk,
      questionIds: ids,
      questionLabelsSk: ids.map(id => questions.find(q => q.id === id)?.question_sk ?? id),
    });
  }
  return out;
}
