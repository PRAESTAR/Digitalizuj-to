import { describe, expect, test } from 'vitest';
import { PEER_DATA } from './peerData';
import { calculateDII } from '@/engines/scoringEngine';
import { getQuizQuestions, calculateAnswerScore } from '@/engines/questionEngine';
import type { Answer, Question } from '@/types';

/**
 * Referenčná vzorka nesmie tvrdiť stav, ktorý nástroj vyprodukovať nevie.
 *
 * Všetkých 50 profilov malo `diiMeasured: 12`, hoci komplexný kvíz pokrýva
 * najviac 10 z 12 indikátorov a indikatívny 8. Respondent tak videl svoje
 * „7/12 · odhad z 10 meraných" vedľa porovnávacej skupiny s plným pokrytím —
 * vlastný výsledok pôsobil neistejšie než referencia, čo je artefakt vzorky,
 * nie zistenie o firme.
 *
 * Test počíta skutočné pokrytie priamo z banky, takže sa rozbije aj vtedy,
 * keď sa pokrytie zmení revíziou otázok a vzorka za ním zaostane.
 */

/** Odpovie na všetko najlepšou možnosťou — maximalizuje pokrytie indikátorov. */
function bestAnswers(questions: Question[]): Answer[] {
  return questions.map((q) => {
    const opts = q.options ?? [];
    const value = q.question_type === 'multi_select'
      ? opts.map((o) => o.value)
      : opts[opts.length - 1]?.value ?? '';
    return {
      questionId: q.id, value, score: calculateAnswerScore(q, value),
      isUnknown: false, wasSkipped: false, timestamp: '2026-08-06T00:00:00.000Z',
    };
  });
}

const coverage = (type: 'indicative' | 'complex'): number => {
  const qs = getQuizQuestions(type);
  return calculateDII(bestAnswers(qs), qs).measuredIndicators;
};

const MAX_COVERAGE = coverage('complex');
const INDICATIVE_COVERAGE = coverage('indicative');

describe('referenčná vzorka je dosiahnuteľná reálnym kvízom', () => {
  test('žiadny profil netvrdí vyššie pokrytie DII, než kvíz vie zmerať', () => {
    for (const p of PEER_DATA) {
      expect(p.diiMeasured, `${p.hash} tvrdí ${p.diiMeasured}/12`).toBeLessThanOrEqual(MAX_COVERAGE);
    }
  });

  test('pokrytie zodpovedá niektorej vetve kvízu', () => {
    const povolene = new Set([0, INDICATIVE_COVERAGE, MAX_COVERAGE]);
    for (const p of PEER_DATA) {
      expect(povolene.has(p.diiMeasured ?? 0), `${p.hash}: ${p.diiMeasured}`).toBe(true);
    }
  });

  test('score12 sedí so vzorcom enginu round(met / measured × 12)', () => {
    // Ak je hodnota dosiahnuteľná, existuje celé `met` také, že vzorec
    // presne sedí. Nedosiahnuteľné score12 (napr. 9 pri measured=10)
    // znamená, že vzorku niekto dopísal ručne mimo modelu.
    for (const p of PEER_DATA) {
      if (p.diiScore12 === null || !p.diiMeasured) continue;
      const dosiahnutelne = new Set(
        Array.from({ length: p.diiMeasured + 1 }, (_, met) => Math.round((met / p.diiMeasured!) * 12))
      );
      expect(
        dosiahnutelne.has(p.diiScore12),
        `${p.hash}: score12 ${p.diiScore12} sa pri ${p.diiMeasured} meraných indikátoroch nedá dosiahnuť`
      ).toBe(true);
    }
  });

  test('vzorka pokrýva obe vetvy — nie je to 50× ten istý typ hodnotenia', () => {
    const branches = new Set(PEER_DATA.map((p) => p.diiMeasured));
    expect(branches.size).toBeGreaterThan(1);
  });
});
