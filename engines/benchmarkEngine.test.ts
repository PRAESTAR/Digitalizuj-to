import { describe, expect, test } from 'vitest';
import { calculateBenchmarks, diiPercentile } from './benchmarkEngine';
import { benchmarkData } from '@/data/benchmarkData';
import type { DIIScore, ORSScore } from '@/types';

// Minimálne validné vstupy — benchmark číta len measured+score12 a scorePenalized.
const dii = { score12: 6, score100: 50, measured: true } as DIIScore;
const ors = { scorePenalized: 40 } as ORSScore;

const SK = benchmarkData.countryBenchmarks.SK!.diiDistribution;

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
});

describe('diiPercentile — podiel firiem pod skóre', () => {
  // Najdôležitejší test: percentil musí byť inverziou mediánu z BENCHMARK_SPEC
  // §3.3. Keby sa hranice pásiem rozišli, firma presne na mediáne by videla
  // „gap 0,0" vedľa percentilu, ktorý nie je 50.
  test('INVARIANT: firma presne na mediáne je na 50. percentile — každý trh', () => {
    for (const market of ['SK', 'CZ', 'EU27'] as const) {
      const c = benchmarkData.countryBenchmarks[market]!;
      expect(diiPercentile(c.diiMedianScore, c.diiDistribution)).toBe(50);
    }
  });

  test('dno pásma nedostáva hmotu pásma (regresia na band-bottom bias)', () => {
    // skóre 4 je DNO pásma low — predtým dostávalo tretinu jeho hmoty (52)
    expect(diiPercentile(4, SK)).toBe(47);
    // skóre 3 je vrch very_low — predtým dostávalo CELÚ hmotu pásma (42)
    expect(diiPercentile(3, SK)).toBe(36);
  });

  test('príklad z BENCHMARK_SPEC: SK firma s DII 7', () => {
    expect(diiPercentile(7, SK)).toBe(77);
  });

  test('krajné hodnoty sa orezávajú na 1–99', () => {
    expect(diiPercentile(0, SK)).toBe(5);
    expect(diiPercentile(12, SK)).toBe(99);
    expect(diiPercentile(-5, SK)).toBe(1);
  });

  test('je neklesajúci na celom rozsahu — každý trh', () => {
    for (const market of ['SK', 'CZ', 'EU27'] as const) {
      const dist = benchmarkData.countryBenchmarks[market]!.diiDistribution;
      for (let s = 1; s <= 12; s++) {
        expect(diiPercentile(s, dist)).toBeGreaterThanOrEqual(diiPercentile(s - 1, dist));
      }
    }
  });

  test('na hranici pásma neskáče', () => {
    expect(Math.abs(diiPercentile(3.4999, SK) - diiPercentile(3.5001, SK))).toBeLessThanOrEqual(1);
    expect(Math.abs(diiPercentile(6.4999, SK) - diiPercentile(6.5001, SK))).toBeLessThanOrEqual(1);
  });

  test('CZ percentil sedí na kumulatívnu distribúciu', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'small', 'CZ');
    expect(b.diiVsSk.percentile).toBe(54);
  });
});

describe('calculateBenchmarks — porovnanie podľa veľkosti firmy', () => {
  test('mikrofirma sa porovnáva s mikrofirmami, nie s celým trhom', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'micro');
    // ORS 40 vs medián mikrofiriem 28
    expect(b.orsVsSize!.gap).toBeCloseTo(12, 5);
    expect(b.orsVsSize!.labelSk).toContain('mikrofiriem');
    expect(b.orsVsSize!.sizeBand).toBe('micro');
    // DII 6 vs medián mikrofiriem 3.2
    expect(b.diiVsSize!.gap).toBeCloseTo(2.8, 5);
  });

  test('rovnaké skóre dá inú polohu podľa veľkosti — to je celá pointa', () => {
    const micro = calculateBenchmarks(dii, ors, 'other', 'micro');
    const large = calculateBenchmarks(dii, ors, 'other', 'large');
    expect(micro.orsVsSize!.gap).toBeCloseTo(12, 5);
    expect(large.orsVsSize!.gap).toBeCloseTo(-20, 5);
    expect(large.orsVsSize!.labelSk).toContain('Výrazne pod priemerom');
  });

  test('neznáma veľkosť nespadne, len nedá porovnanie', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'enterprise');
    expect(b.orsVsSize!.gap).toBeNull();
    expect(b.orsVsSize!.labelSk).toContain('nedostupný');
  });
});

describe('calculateBenchmarks — ORS voči domácemu trhu', () => {
  test('SK: ORS 40 vs odhadovaný medián 38', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'small');
    expect(b.orsVsCountry!.gap).toBeCloseTo(2, 5);
    expect(b.orsVsCountry!.labelSk).toContain('SK');
  });

  test('CZ má vlastný medián (45), takže rovnaké ORS je pod priemerom', () => {
    const b = calculateBenchmarks(dii, ors, 'other', 'small', 'CZ');
    expect(b.orsVsCountry!.gap).toBeCloseTo(-5, 5);
    expect(b.orsVsCountry!.labelSk).toContain('Pod priemerom');
  });
});

describe('calculateBenchmarks — pôvod referenčnej hodnoty', () => {
  test('len porovnanie s trhom stojí na meraných Eurostat dátach', () => {
    const b = calculateBenchmarks(dii, ors, 'manufacturing', 'small');
    expect(b.diiVsSk.source).toBe('eurostat');
    expect(b.diiVsEu.source).toBe('eurostat');
    // Sektorové a veľkostné mediány sú expertné odhady — aj tie DII-čkové,
    // ktoré doteraz žiadny disclaimer nemali.
    expect(b.diiVsSector.source).toBe('expert');
    expect(b.diiVsSize!.source).toBe('expert');
    expect(b.orsVsCountry!.source).toBe('expert');
    expect(b.orsVsSector.source).toBe('expert');
    expect(b.orsVsSize!.source).toBe('expert');
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
    expect(b.diiVsSize!.gap).toBeNull();
    // ORS porovnania nesmie nemerané DII ovplyvniť
    expect(b.orsVsSize!.gap).toBeCloseTo(2, 5);
  });

  test('nemerané ORS: všetky ORS porovnania null, DII nedotknuté', () => {
    const orsNull = { scorePenalized: null } as ORSScore;
    const b = calculateBenchmarks(dii, orsNull, 'manufacturing', 'small');
    expect(b.orsVsSector.gap).toBeNull();
    expect(b.orsVsCountry!.gap).toBeNull();
    expect(b.orsVsSize!.gap).toBeNull();
    expect(b.orsVsSector.labelSk).toContain('Nedostupné');
    expect(b.diiVsSk.gap).toBeCloseTo(1.7, 5);
  });
});

describe('benchmarkData — tvar po zjednotení do JSON', () => {
  test('wrapper vystavuje rovnaké dáta vrátane ČR', () => {
    expect(benchmarkData.countryBenchmarks.CZ?.diiMedianScore).toBe(5.6);
    expect(Object.keys(benchmarkData.sizeBenchmarks)).toEqual(['micro', 'small', 'medium', 'large']);
  });
});
