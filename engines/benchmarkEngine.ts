import type { BenchmarkResults, BenchmarkComparison, DIIScore, ORSScore } from '@/types';
import { benchmarkData } from '@/data/benchmarkData';

export function calculateBenchmarks(
  dii: DIIScore,
  ors: ORSScore,
  sector: string,
  sizeBand: string
): BenchmarkResults {
  return {
    diiVsSk: calculateDIIBenchmark(dii, 'SK'),
    diiVsEu: calculateDIIBenchmark(dii, 'EU27'),
    diiVsSector: {
      ...calculateSectorBenchmark(dii, sector),
      sector,
    },
    orsVsSector: calculateORSSectorBenchmark(ors, sector),
  };
}

function calculateDIIBenchmark(
  dii: DIIScore,
  country: 'SK' | 'EU27'
): BenchmarkComparison {
  const countryData = benchmarkData.countryBenchmarks[country];
  if (!countryData) {
    return { gap: 0, labelSk: 'Nedostupné', percentile: 0 };
  }

  const dist = countryData.diiDistribution;
  const score12 = dii.score12;

  // Calculate percentile based on DII distribution
  let percentile: number;
  if (score12 <= 3) {
    percentile = (score12 / 3) * dist.very_low * 100;
  } else if (score12 <= 6) {
    percentile = (dist.very_low + ((score12 - 3) / 3) * dist.low) * 100;
  } else if (score12 <= 9) {
    percentile = (dist.very_low + dist.low + ((score12 - 6) / 3) * dist.high) * 100;
  } else {
    percentile = (dist.very_low + dist.low + dist.high + ((score12 - 9) / 3) * dist.very_high) * 100;
  }
  percentile = Math.round(Math.min(99, Math.max(1, percentile)));

  const gap = Math.round((dii.score12 - countryData.diiMedianScore) * 10) / 10;
  const label = getGapLabel(gap, country === 'SK' ? 'SK' : 'EÚ', 'dii12');

  return { percentile, gap, labelSk: label };
}

function calculateSectorBenchmark(
  dii: DIIScore,
  sector: string
): BenchmarkComparison {
  const sectorData = benchmarkData.sectorBenchmarks[sector];
  if (!sectorData) {
    return { gap: 0, labelSk: 'Sektorový benchmark nedostupný' };
  }

  const gap = Math.round((dii.score12 - sectorData.diiMedian) * 10) / 10;
  const sectorLabel = getSectorName(sector);

  return {
    gap,
    labelSk: getGapLabel(gap, sectorLabel, 'dii12'),
  };
}

function calculateORSSectorBenchmark(
  ors: ORSScore,
  sector: string
): BenchmarkComparison {
  const sectorData = benchmarkData.sectorBenchmarks[sector];
  if (!sectorData) {
    return {
      gap: 0,
      labelSk: 'Sektorový benchmark nedostupný',
      disclaimer: 'ORS benchmarky sú expertné odhady, nie empirické dáta.',
    };
  }

  const gap = Math.round((ors.scorePenalized - sectorData.orsEstimatedMedian) * 10) / 10;

  return {
    gap,
    labelSk: getGapLabel(gap, getSectorName(sector)),
    disclaimer: 'ORS benchmarky sú expertné odhady odvodené z DII dát, nie priamo merané.',
  };
}

function getGapLabel(gap: number, context: string, scale: 'ors100' | 'dii12' = 'ors100'): string {
  // Prahy ±5/±20 sú kalibrované na škálu 0-100; DII gap je na škále 0-12,
  // preto sa prahy prepočítavajú v rovnakom pomere (5 % a 20 % z rozsahu).
  const [minor, major] = scale === 'dii12' ? [0.6, 2.4] : [5, 20];
  if (gap > major) return `Výrazne nad priemerom ${context}`;
  if (gap > minor) return `Nad priemerom ${context}`;
  if (gap > -minor) return `V okolí priemeru ${context}`;
  if (gap > -major) return `Pod priemerom ${context}`;
  return `Výrazne pod priemerom ${context}`;
}

function getSectorName(sector: string): string {
  const names: Record<string, string> = {
    manufacturing: 'výroby',
    wholesale_retail: 'obchodu',
    professional_services: 'profesionálnych služieb',
    construction: 'stavebníctva',
    transport_logistics: 'dopravy',
    accommodation_food: 'gastro/ubytovania',
    ict: 'IT sektora',
    other: 'sektora',
  };
  return names[sector] || 'sektora';
}
