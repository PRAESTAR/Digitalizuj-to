import { describe, expect, test } from 'vitest';
import { calculateBenchmarks } from './benchmarkEngine';
import type { DIIScore, ORSScore } from '@/types';

// Minimálne validné vstupy — benchmark číta len measured+score12 a scorePenalized.
const dii = { score12: 6, score100: 50, measured: true } as DIIScore;
const ors = { scorePenalized: 40 } as ORSScore;

describe('calculateBenchmarks — trh podľa jazykovej mutácie', () => {
  test('default (SK): domáca karta porovnáva so Slovenskom', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'small');
    expect(b.homeMarket).toBe('SK');
    // SK medián 4.3 → gap = 6 − 4.3
    expect(b.diiVsSk.gap).toBeCloseTo(1.7, 5);
    expect(b.diiVsSk.labelSk).toContain('SK');
  });

  test('CZ trh používa české čísla (medián 5.6) a label ČR', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'small', 'CZ');
    expect(b.homeMarket).toBe('CZ');
    expect(b.diiVsSk.gap).toBeCloseTo(0.4, 5);
    expect(b.diiVsSk.labelSk).toContain('ČR');
    // EÚ porovnanie zostáva nezávislé od domáceho trhu
    expect(b.diiVsEu.gap).toBeCloseTo(0.6, 5);
  });

  test('EU27 trh: domáce porovnanie je zhodné s EÚ (UI ho skryje)', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'small', 'EU27');
    expect(b.homeMarket).toBe('EU27');
    expect(b.diiVsSk.gap).toBe(b.diiVsEu.gap);
    expect(b.diiVsSk.percentile).toBe(b.diiVsEu.percentile);
  });

  test('CZ percentil sedí na kumulatívnu distribúciu (score12=6 → VLO+LO)', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'small', 'CZ');
    // score12=6 = koniec pásma LO: percentil = (0.285 + 0.306) * 100 ≈ 59
    expect(b.diiVsSk.percentile).toBe(59);
  });
});

describe('calculateBenchmarks — nemerané skóre', () => {
  test('nemerané DII: gap null, žiadny percentil, label Nedostupné', () => {
    const unmeasured = { score12: null, score100: null, measured: false } as DIIScore;
    const b = calculateBenchmarks(unmeasured, ors, 'manufacturing', 'small');
    expect(b.diiVsSk.gap).toBeNull();
    expect(b.diiVsSk.percentile).toBeUndefined();
    expect(b.diiVsSk.labelSk).toContain('Nedostupné');
    expect(b.diiVsSector.gap).toBeNull();
  });

  test('nemerané ORS: orsVsSector gap null s labelom Nedostupné', () => {
    const orsNull = { scorePenalized: null } as ORSScore;
    const b = calculateBenchmarks(dii, orsNull, 'manufacturing', 'small');
    expect(b.orsVsSector.gap).toBeNull();
    expect(b.orsVsSector.labelSk).toContain('Nedostupné');
  });
});
