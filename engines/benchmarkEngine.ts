import type { BenchmarkResults, BenchmarkComparison, DIIScore, ORSScore } from '@/types';
import { benchmarkData, type DiiDistribution } from '@/data/benchmarkData';
import { MARKET_LABEL, type Market } from '@/lib/market';

export function calculateBenchmarks(
  dii: DIIScore,
  ors: ORSScore,
  sector: string,
  sizeBand: string,
  /**
   * Domáci trh referenčných čísel — odvodený od jazykovej mutácie
   * (sk→SK, cs→CZ, en→EÚ priemer). Pole `diiVsSk` z historických dôvodov
   * nesie porovnanie s DOMÁCIM trhom (názov zostal kvôli uloženým
   * výsledkom v localStorage a peer snapshotom); pri EU27 je zhodné
   * s `diiVsEu` a zobrazovacia vrstva ho skryje.
   */
  market: Market = 'SK'
): BenchmarkResults {
  return {
    homeMarket: market,
    diiVsSk: calculateDIIBenchmark(dii, market),
    diiVsEu: calculateDIIBenchmark(dii, 'EU27'),
    diiVsSector: {
      ...calculateSectorBenchmark(dii, sector),
      sector,
    },
    diiVsSize: {
      ...calculateDIISizeBenchmark(dii, sizeBand),
      sizeBand,
    },
    orsVsCountry: calculateORSCountryBenchmark(ors, market),
    orsVsSector: calculateORSSectorBenchmark(ors, sector),
    orsVsSize: {
      ...calculateORSSizeBenchmark(ors, sizeBand),
      sizeBand,
    },
  };
}

/**
 * Pásma DII v3 (Eurostat isoc_e_dii): 0–3 very_low, 4–6 low, 7–9 high,
 * 10–12 very_high. Spojité hranice sú posunuté o −0,5 (continuity
 * correction), lebo celočíselné skóre `s` reprezentuje interval
 * [s−0,5; s+0,5]. Je to ten istý model, z ktorého BENCHMARK_SPEC §3.3
 * odvádza `diiMedianScore`, takže percentil je jeho inverzia:
 * percentil(medián) = 50.
 *
 * Predtým sa hranice brali ako 3/6/9 a každé pásmo sa delilo tromi. Malo to
 * tri následky: dno pásma dostalo tretinu jeho hmoty (skóre 4 → 52. percentil
 * namiesto ~47), pásmo very_low má štyri celé hodnoty (0–3), no delilo sa
 * tromi, a firma presne na mediáne videla na jednej karte „gap 0,0" vedľa
 * „percentil 55 %".
 */
const DII_BANDS = [
  { key: 'very_low', lower: -0.5, width: 4 },
  { key: 'low', lower: 3.5, width: 3 },
  { key: 'high', lower: 6.5, width: 3 },
  { key: 'very_high', lower: 9.5, width: 3 },
] as const;

/** Krajné hodnoty sa orezávajú — 0 ani 100 by tvrdili absolútnu istotu. */
const clampPercentile = (p: number): number => Math.round(Math.min(99, Math.max(1, p)));

/**
 * Podiel firiem so skóre pod zadanou hodnotou, v percentách.
 * Exportované kvôli testom (invariant percentil(medián) = 50 sa dá overiť
 * len na neceločíselnom vstupe).
 */
export function diiPercentile(score12: number, dist: DiiDistribution): number {
  let cumulative = 0;
  for (let i = 0; i < DII_BANDS.length; i++) {
    const { key, lower, width } = DII_BANDS[i];
    const isLast = i === DII_BANDS.length - 1;
    if (score12 < lower + width || isLast) {
      const positionInBand = Math.min(1, Math.max(0, (score12 - lower) / width));
      return clampPercentile((cumulative + positionInBand * dist[key]) * 100);
    }
    cumulative += dist[key];
  }
  return clampPercentile(cumulative * 100); // nedosiahnuteľné
}

const DII_UNMEASURED = 'Nedostupné — DII nemerané';
const ORS_UNMEASURED = 'Nedostupné — ORS nemerané';

function calculateDIIBenchmark(dii: DIIScore, country: Market): BenchmarkComparison {
  const countryData = benchmarkData.countryBenchmarks[country];
  if (!countryData) {
    // gap null + žiadny percentil — 0 by sa tvárilo ako reálna (najhoršia) hodnota
    return { gap: null, labelSk: 'Nedostupné', source: 'eurostat' };
  }
  if (!dii.measured || dii.score12 === null) {
    return { gap: null, labelSk: DII_UNMEASURED, source: 'eurostat' };
  }

  const gap = Math.round((dii.score12 - countryData.diiMedianScore) * 10) / 10;

  return {
    percentile: diiPercentile(dii.score12, countryData.diiDistribution),
    gap,
    labelSk: getGapLabel(gap, MARKET_LABEL[country], 'dii12'),
    source: 'eurostat',
  };
}

function calculateSectorBenchmark(dii: DIIScore, sector: string): BenchmarkComparison {
  const sectorData = benchmarkData.sectorBenchmarks[sector];
  if (!sectorData) {
    return { gap: null, labelSk: 'Sektorový benchmark nedostupný', source: 'expert' };
  }
  if (!dii.measured || dii.score12 === null) {
    return { gap: null, labelSk: DII_UNMEASURED, source: 'expert' };
  }

  const gap = Math.round((dii.score12 - sectorData.diiMedian) * 10) / 10;

  return {
    gap,
    labelSk: getGapLabel(gap, getSectorName(sector), 'dii12'),
    source: 'expert',
  };
}

function calculateDIISizeBenchmark(dii: DIIScore, sizeBand: string): BenchmarkComparison {
  const sizeData = benchmarkData.sizeBenchmarks[sizeBand];
  if (!sizeData) {
    return { gap: null, labelSk: 'Veľkostný benchmark nedostupný', source: 'expert' };
  }
  if (!dii.measured || dii.score12 === null) {
    return { gap: null, labelSk: DII_UNMEASURED, source: 'expert' };
  }

  const gap = Math.round((dii.score12 - sizeData.diiMedian) * 10) / 10;

  return {
    gap,
    labelSk: getGapLabel(gap, getSizeName(sizeBand), 'dii12'),
    source: 'expert',
  };
}

function calculateORSCountryBenchmark(ors: ORSScore, country: Market): BenchmarkComparison {
  const countryData = benchmarkData.countryBenchmarks[country];
  if (!countryData) {
    return { gap: null, labelSk: 'Nedostupné', source: 'expert' };
  }
  if (ors.scorePenalized === null) {
    return { gap: null, labelSk: ORS_UNMEASURED, source: 'expert' };
  }

  const gap = Math.round((ors.scorePenalized - countryData.orsEstimatedMedian) * 10) / 10;

  return {
    gap,
    labelSk: getGapLabel(gap, MARKET_LABEL[country]),
    source: 'expert',
  };
}

function calculateORSSectorBenchmark(ors: ORSScore, sector: string): BenchmarkComparison {
  const sectorData = benchmarkData.sectorBenchmarks[sector];
  if (!sectorData) {
    return { gap: null, labelSk: 'Sektorový benchmark nedostupný', source: 'expert' };
  }
  if (ors.scorePenalized === null) {
    return { gap: null, labelSk: ORS_UNMEASURED, source: 'expert' };
  }

  const gap = Math.round((ors.scorePenalized - sectorData.orsEstimatedMedian) * 10) / 10;

  return {
    gap,
    labelSk: getGapLabel(gap, getSectorName(sector)),
    source: 'expert',
  };
}

function calculateORSSizeBenchmark(ors: ORSScore, sizeBand: string): BenchmarkComparison {
  const sizeData = benchmarkData.sizeBenchmarks[sizeBand];
  if (!sizeData) {
    return { gap: null, labelSk: 'Veľkostný benchmark nedostupný', source: 'expert' };
  }
  if (ors.scorePenalized === null) {
    return { gap: null, labelSk: ORS_UNMEASURED, source: 'expert' };
  }

  const gap = Math.round((ors.scorePenalized - sizeData.orsEstimatedMedian) * 10) / 10;

  return {
    gap,
    labelSk: getGapLabel(gap, getSizeName(sizeBand)),
    source: 'expert',
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

/** Genitív do gap labelu — „Nad priemerom malých firiem (10–49)". */
function getSizeName(sizeBand: string): string {
  const names: Record<string, string> = {
    micro: 'mikrofiriem (1–9)',
    small: 'malých firiem (10–49)',
    medium: 'stredných firiem (50–249)',
    large: 'veľkých firiem (250+)',
  };
  return names[sizeBand] || 'firiem tejto veľkosti';
}
