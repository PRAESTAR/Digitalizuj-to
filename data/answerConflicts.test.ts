import { describe, expect, test } from 'vitest';
import { detectAnswerConflicts, answerConflicts } from './answerConflicts';
import { getQuizQuestions } from '@/engines/questionEngine';
import type { Answer } from '@/types';

/**
 * Kontrola vecných rozporov v odpovediach.
 *
 * Vecné jadro zamietnutého bodu o reverse-keyed položkách: reverse-keying je
 * technika viazaná na formát súhlas–nesúhlas, ktorý banka nepoužíva, ale
 * potreba zachytiť nepozorne vyplnenú odpoveď zostáva. Rieši sa deterministicky
 * nad dvojicami, ktoré v banke už sú.
 */

const cx = getQuizQuestions('complex');
const ind = getQuizQuestions('indicative');

const answer = (questionId: string, value: string | string[], extra: Partial<Answer> = {}): Answer => ({
  questionId, value, score: 0, isUnknown: false, wasSkipped: false,
  timestamp: '2026-08-07T00:00:00.000Z', ...extra,
});

describe('detekcia rozporov', () => {
  test('bez rozporu nič nehlási', () => {
    expect(detectAnswerConflicts([
      answer('cx_A02', 'manual'),
      answer('cx_A05', ['invoicing', 'reporting']),
    ], cx)).toEqual([]);
  });

  test('automatizovaná fakturácia + fakturácia medzi ručnými procesmi', () => {
    const found = detectAnswerConflicts([
      answer('cx_A02', 'automated'),
      answer('cx_A05', ['invoicing']),
    ], cx);
    expect(found).toHaveLength(1);
    expect(found[0].questionIds).toEqual(['cx_A02', 'cx_A05']);
    expect(found[0].messageSk).toMatch(/fakturáci/i);
    // Popisky sa berú z banky, nie z natvrdo napísaného textu.
    expect(found[0].questionLabelsSk[0]).toContain('fakturácia');
  });

  test('to isté v indikatívnom kvíze', () => {
    const found = detectAnswerConflicts([
      answer('ind_03', '4'),
      answer('ind_03c_manual', ['invoicing']),
    ], ind);
    expect(found.map(f => f.id)).toContain('invoicing_automated_vs_manual_ind');
  });

  test('„žiadny ručný proces" spolu s konkrétnym procesom', () => {
    const found = detectAnswerConflicts([answer('cx_A05', ['none', 'reporting'])], cx);
    expect(found.map(f => f.id)).toContain('none_with_other_cx');
    // Rozpor v rámci jednej otázky uvádza tú otázku raz, nie dvakrát.
    expect(found.find(f => f.id === 'none_with_other_cx')!.questionIds).toEqual(['cx_A05']);
  });

  test('samotné „žiadny" rozpor nie je', () => {
    expect(detectAnswerConflicts([answer('cx_A05', ['none'])], cx)).toEqual([]);
  });

  test('„Neviem" rozpor nespustí — nezistené nie je tvrdenie', () => {
    expect(detectAnswerConflicts([
      answer('cx_A02', 'automated', { isUnknown: true }),
      answer('cx_A05', ['invoicing']),
    ], cx)).toEqual([]);
  });

  test('preskočená otázka rozpor nespustí', () => {
    expect(detectAnswerConflicts([
      answer('cx_A02', 'automated'),
      answer('cx_A05', ['invoicing'], { wasSkipped: true }),
    ], cx)).toEqual([]);
  });

  test('chýbajúca odpoveď rozpor nespustí', () => {
    expect(detectAnswerConflicts([answer('cx_A02', 'automated')], cx)).toEqual([]);
  });

  test('každý rozpor sa dá reálne vyvolať odpoveďami z banky', () => {
    // Poistka proti zoznamu, ktorý po revízii banky vyzerá platne, ale
    // nikdy nenastane — „žiadny rozpor" a „kontrola nefunguje" vyzerajú
    // z výsledku rovnako.
    const all = [...cx, ...ind];
    for (const c of answerConflicts) {
      const answers: Answer[] = c.left.questionId === c.right.questionId
        ? [answer(c.left.questionId, [...c.left.anyOf.slice(0, 1), ...c.right.anyOf.slice(0, 1)])]
        : [
            answer(c.left.questionId, wrap(c.left.questionId, c.left.anyOf[0], all)),
            answer(c.right.questionId, wrap(c.right.questionId, c.right.anyOf[0], all)),
          ];
      const found = detectAnswerConflicts(answers, all);
      expect(found.map(f => f.id), `rozpor ${c.id} sa nedá vyvolať`).toContain(c.id);
    }
  });
});

/** multi_select potrebuje pole, single_choice reťazec — inak sa hodnota nenájde. */
function wrap(questionId: string, value: string, questions: { id: string; question_type: string }[]) {
  const q = questions.find(x => x.id === questionId);
  return q?.question_type === 'multi_select' ? [value] : value;
}
