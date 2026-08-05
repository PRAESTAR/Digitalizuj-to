import benchmarkJson from './benchmarkData.json';

/**
 * Benchmark dáta — typovaný wrapper.
 *
 * Zdroj pravdy je `data/benchmarkData.json`; tento súbor už žiadne hodnoty
 * nedrží, len im dáva typy. Dovtedy žili čísla dvakrát (tu a v editovateľnej
 * kópii `config/model/benchmarkData.json`) a synchronizovať sa mali ručne —
 * čo sa aj rozišlo: kópia nemala celý blok ČR, hoci runtime s ním počítal.
 * Zhodu kópie so zdrojom teraz vynucuje `scripts/validate-model.mjs`.
 *
 * Pôvod hodnôt sa líši a v UI sa priznáva (viď BenchmarkComparison.source):
 * - `countryBenchmarks[*].diiDistribution` a `diiMedianScore` sú MERANÉ
 *   Eurostat dáta (isoc_e_dii, prieskum 2025, DII v3),
 * - `orsEstimatedMedian` a všetky sektorové aj veľkostné hodnoty sú
 *   expertné odhady.
 */

export type DiiDistribution = {
  very_low: number;
  low: number;
  high: number;
  very_high: number;
};

export type CountryBenchmark = {
  diiDistribution: DiiDistribution;
  diiMedianScore: number;
  orsEstimatedMedian: number;
};

export type SectorBenchmark = {
  label?: string;
  diiMedian: number;
  orsEstimatedMedian: number;
};

export type SizeBenchmark = SectorBenchmark & { note?: string };

type BenchmarkFile = {
  version: string;
  source: string;
  lastUpdated: string;
  updatePolicy: string;
  countryBenchmarks: Partial<Record<'SK' | 'CZ' | 'EU27', CountryBenchmark>>;
  sectorBenchmarks: Record<string, SectorBenchmark>;
  sizeBenchmarks: Record<string, SizeBenchmark>;
};

export const benchmarkData = benchmarkJson as unknown as BenchmarkFile;
