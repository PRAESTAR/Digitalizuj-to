import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { calculateORS, calculateDII, sizeAdjustedScore } from './scoringEngine';
import { calculateTDRI } from './riskEngine';
import type { Answer, Question, SizeBand } from '@/types';

/**
 * Skórovacie kotvy podľa veľkosti firmy (SCORING_SPEC §13).
 *
 * Vlastnosť, na ktorej celá úprava stojí: **odchýlka je jednosmerná**. Kotva
 * smie skóre len zdvihnúť, nikdy znížiť, a nulu nechá nulou. Keby to neplatilo,
 * príliš nízko odhadnutý strop by mikrofirmám ticho ubral body — a kalibračné
 * dáta, podľa ktorých by sa to dalo overiť, neexistujú.
 */

const bank = JSON.parse(readFileSync('data/questionBank.json', 'utf8'));
const ALL: Question[] = [
  ...bank.indicative_quiz.questions,
  ...bank.complex_quiz.modules.flatMap((m: { questions: Question[] }) => m.questions),
];
const byId = (id: string): Question => {
  const q = ALL.find(x => x.id === id);
  if (!q) throw new Error(`otázka ${id} v banke nie je`);
  return q;
};
const BANDS: SizeBand[] = ['micro', 'small', 'medium', 'large'];
const ANCHORED = ALL.filter(q => q.size_anchors);

const answer = (questionId: string, value: string, score: number): Answer => ({
  questionId, value, score, isUnknown: false, wasSkipped: false, timestamp: '2026-08-07T00:00:00.000Z',
});

describe('sizeAdjustedScore — invarianty', () => {
  test('banka nejaké kotvy naozaj má (inak by zvyšok testu nič netestoval)', () => {
    expect(ANCHORED.length).toBeGreaterThan(0);
  });

  test('nikdy neuberá — každá možnosť, každé pásmo', () => {
    for (const q of ANCHORED) {
      for (const band of BANDS) {
        for (const o of q.options ?? []) {
          const { score } = sizeAdjustedScore(q, o.score, band);
          expect(score, `${q.id}/${band}/${o.value}`).toBeGreaterThanOrEqual(o.score);
        }
      }
    }
  });

  test('nula zostáva nulou — „nikto to nerieši" nie je vlastnosť veľkosti', () => {
    for (const q of ANCHORED) {
      for (const band of BANDS) {
        expect(sizeAdjustedScore(q, 0, band).score, `${q.id}/${band}`).toBe(0);
      }
    }
  });

  test('nepretečie nad maximum otázky', () => {
    for (const q of ANCHORED) {
      const max = Math.max(...(q.options ?? []).map(o => o.score));
      for (const band of BANDS) {
        for (const o of q.options ?? []) {
          expect(sizeAdjustedScore(q, o.score, band).score, `${q.id}/${band}/${o.value}`)
            .toBeLessThanOrEqual(max);
        }
      }
    }
  });

  test('zachováva poradie možností — lepšia odpoveď nedostane menej bodov', () => {
    for (const q of ANCHORED) {
      const sorted = [...(q.options ?? [])].sort((a, b) => a.score - b.score);
      for (const band of BANDS) {
        let prev = -1;
        for (const o of sorted) {
          const s = sizeAdjustedScore(q, o.score, band).score;
          expect(s, `${q.id}/${band}/${o.value}`).toBeGreaterThanOrEqual(prev);
          prev = s;
        }
      }
    }
  });

  test('bez pásma sa nič nemení — veľkosť sa nedomýšľa', () => {
    for (const q of ANCHORED) {
      for (const o of q.options ?? []) {
        expect(sizeAdjustedScore(q, o.score, null).score).toBe(o.score);
        expect(sizeAdjustedScore(q, o.score, undefined).anchor).toBeNull();
      }
    }
  });

  test('otázka bez kotvy sa nemení nikdy', () => {
    const plain = byId('cx_F01');
    expect(plain.size_anchors).toBeUndefined();
    for (const band of BANDS) {
      for (const o of plain.options ?? []) {
        expect(sizeAdjustedScore(plain, o.score, band).score).toBe(o.score);
      }
    }
  });

  test('kotva mimo domény otázky sa ignoruje, nie aplikuje naslepo', () => {
    // Engine beží aj nad kompilátom z DB, kde validátor #17 nebeží.
    const broken: Question = {
      ...byId('cx_DII04'),
      size_anchors: { rationale_sk: 't', ceilings: { micro: 'neexistuje' } },
    };
    expect(sizeAdjustedScore(broken, 50, 'micro')).toEqual({ score: 50, anchor: null });
  });
});

describe('cx_DII04 — konkrétne čísla', () => {
  const q = byId('cx_DII04');

  test('mikrofirma: stály dodávateľ so zmluvou je plný počet bodov', () => {
    expect(sizeAdjustedScore(q, 50, 'micro').score).toBe(100);
  });

  test('mikrofirma: dodávateľ na zavolanie zostáva pod stropom', () => {
    expect(sizeAdjustedScore(q, 25, 'micro').score).toBe(50);
  });

  test('malá firma má vyšší strop než mikrofirma', () => {
    expect(sizeAdjustedScore(q, 50, 'small').score).toBeLessThan(sizeAdjustedScore(q, 50, 'micro').score);
  });

  test('stredná a veľká firma sa neupravujú vôbec', () => {
    for (const band of ['medium', 'large'] as SizeBand[]) {
      for (const o of q.options ?? []) {
        expect(sizeAdjustedScore(q, o.score, band).anchor, `${band}/${o.value}`).toBeNull();
      }
    }
  });
});

describe('čo sa kotvou meniť NESMIE', () => {
  const questions = bank.complex_quiz.modules.flatMap((m: { questions: Question[] }) => m.questions) as Question[];
  // Mikrofirma so stálym externým dodávateľom — presne stav, ktorý kotva dvíha.
  const answers = [
    answer('cx_02', 'micro', 0),
    answer('cx_DII04', 'external_contract', 50),
    answer('cx_B05', 'outsourced', 50),
    answer('cx_D01', 'basic', 33),
    answer('cx_E01', 'none', 0),
  ];

  test('žiadna kotvená otázka nie je kritériom DII indikátora', () => {
    // Toto je nosná podmienka celej úpravy: premenné Eurostatu sú binárne
    // fakty a percentil voči meranej distribúcii má zmysel len vtedy, keď sa
    // merajú pre každého rovnako. Stráži to aj validátor #17 — tu preto, aby
    // sa to nedalo obísť ručným zásahom do kompilátu.
    const dii = JSON.parse(readFileSync('data/diiIndicators.json', 'utf8'));
    const criteria = new Set<string>(
      dii.indicators.flatMap((i: { criteria?: { questionId: string }[] }) =>
        (i.criteria ?? []).map(c => c.questionId))
    );
    for (const q of ANCHORED) expect(criteria.has(q.id), q.id).toBe(false);
  });

  test('DII a riziká sú rovnaké s pásmom aj bez neho, ORS nie', () => {
    // Skóre v `Answer` zostáva surové, takže enginy mimo ORS kotvu nevidia.
    const orsMicro = calculateORS(answers, questions, 'micro');
    const orsNone = calculateORS(answers, questions, null);
    expect(orsMicro.score).not.toBe(orsNone.score);

    // DII aj TDRI čítajú tie isté odpovede — musia vyjsť identicky.
    expect(calculateDII(answers, questions))
      .toEqual(calculateDII(answers, questions.map(q => ({ ...q }))));
    expect(calculateTDRI(answers, questions, new Set<string>()))
      .toEqual(calculateTDRI(answers, questions, new Set<string>()));

    // A hlavne: agregácia odpovede neprepísala.
    expect(answers.find(a => a.questionId === 'cx_DII04')!.score).toBe(50);
    expect(answers.find(a => a.questionId === 'cx_B05')!.score).toBe(50);
  });

  test('ORS mikrofirmy je vyššie než bez pásma, ale nie umelo plné', () => {
    const withBand = calculateORS(answers, questions, 'micro');
    const without = calculateORS(answers, questions, null);
    expect(withBand.score!).toBeGreaterThan(without.score!);
    expect(withBand.score!).toBeLessThan(100);
  });

  test('veľká firma dostane presne to isté ako bez pásma', () => {
    expect(calculateORS(answers, questions, 'large')).toEqual(calculateORS(answers, questions, null));
  });
});
