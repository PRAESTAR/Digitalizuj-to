import { describe, expect, test } from 'vitest';
import { calculateBenchmarks } from './benchmarkEngine';
import type { DIIScore, ORSScore } from '@/types';

/**
 * Mikrofirma nesmie dostať percentil voči Eurostat distribúcii bez výhrady.
 *
 * `isoc_e_dii` zbiera podniky **od 10 zamestnancov**. Firma s 1–9 ľuďmi tak
 * dostávala pozíciu v rozdelení, v ktorom žiadna firma jej veľkosti nie je —
 * a keďže porovnanie nesie značku `source: 'eurostat'`, pôsobilo dôveryhodnejšie
 * než expertné odhady vedľa neho, hoci pre ňu platí najmenej.
 */

const dii = (score12: number): DIIScore => ({
  score100: score12 * 8, score12, measured: true,
  measuredIndicators: 10, metIndicators: Math.round(score12 * 10 / 12),
  confidence: 'high', level: 'low', levelLabelSk: 'Nízka digitálna intenzita',
  indicators: [], band: null,
});

const ors = (score: number): ORSScore => ({
  score, scorePenalized: score, measuredCategories: 6,
  maturityLevel: 2, maturityLabelSk: 'Rozvíjajúci sa',
  categories: {}, penaltyApplied: false, penaltyReason: null, band: null,
});

describe('výhrada k pokrytiu Eurostatu', () => {
  test('mikrofirma ju dostane pri VŠETKÝCH porovnaniach voči meranej distribúcii', () => {
    const b = calculateBenchmarks(dii(5), ors(40), 'manufacturing', 'micro', 'SK');
    expect(b.diiVsSk.caveatSk, 'domáci trh').toBeTruthy();
    expect(b.diiVsEu.caveatSk, 'EÚ').toBeTruthy();
    expect(b.orsVsCountry?.caveatSk, 'ORS voči krajine').toBeTruthy();
    for (const c of [b.diiVsSk, b.diiVsEu, b.orsVsCountry]) {
      expect(c?.caveatSk).toContain('od 10 zamestnancov');
    }
  });

  test('percentil sa napriek výhrade naďalej počíta — výhrada informuje, neskrýva', () => {
    // Skryť číslo by bolo horšie: mikrofirma by prišla o jedinú orientáciu,
    // ktorú má. Text vysvetľuje, ako ho čítať.
    const b = calculateBenchmarks(dii(5), ors(40), 'manufacturing', 'micro', 'SK');
    expect(typeof b.diiVsSk.percentile).toBe('number');
    expect(b.diiVsSk.gap).not.toBeNull();
  });

  test.each(['small', 'medium', 'large'])('firma veľkosti %s výhradu nedostane', (size) => {
    const b = calculateBenchmarks(dii(5), ors(40), 'manufacturing', size, 'SK');
    expect(b.diiVsSk.caveatSk).toBeUndefined();
    expect(b.diiVsEu.caveatSk).toBeUndefined();
    expect(b.orsVsCountry?.caveatSk).toBeUndefined();
  });

  test('expertné porovnania výhradu nenesú — tie mikrofirmy pokrývajú zámerne', () => {
    // Sektorové a veľkostné mediány sú expertné odhady, ktoré pásmo `micro`
    // majú. Pridať k nim tú istú výhradu by bol šum, nie presnosť.
    const b = calculateBenchmarks(dii(5), ors(40), 'manufacturing', 'micro', 'SK');
    expect(b.diiVsSector.caveatSk).toBeUndefined();
    expect(b.diiVsSize?.caveatSk).toBeUndefined();
    expect(b.orsVsSector.caveatSk).toBeUndefined();
    expect(b.orsVsSize?.caveatSk).toBeUndefined();
  });

  test('nemerané DII nedostane výhradu k percentilu, ktorý neexistuje', () => {
    const unmeasured: DIIScore = { ...dii(0), measured: false, score12: null, score100: null };
    const b = calculateBenchmarks(unmeasured, ors(40), 'manufacturing', 'micro', 'SK');
    expect(b.diiVsSk.percentile).toBeUndefined();
    expect(b.diiVsSk.caveatSk).toBeUndefined();
  });
});
