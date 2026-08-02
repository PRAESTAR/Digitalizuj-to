// Zdroj DII distribúcií: Eurostat, dataset isoc_e_dii (ICT usage in enterprises, prieskum 2025,
// DII verzia 3, podniky 10+ zamestnancov, NACE C10-S951 bez K), vintage 2026-02-27.
// Mediány DII sú odvodené lineárnou interpoláciou z pásmovej distribúcie (pozri BENCHMARK_SPEC.md §3.3).
// ORS mediány a sektorové/veľkostné hodnoty sú expertné odhady — nie sú to merané Eurostat dáta.
// Politika aktualizácie: ročne, do 3 mesiacov od decembrovej publikácie Eurostatu.
export const benchmarkData = {
  version: '2025-DII-v3',
  source: 'Eurostat isoc_e_dii (prieskum 2025, DII v3) + expertné odhady (ORS, sektory, veľkosti)',
  lastUpdated: '2026-07-23',

  countryBenchmarks: {
    SK: {
      // Eurostat isoc_e_dii 2025: E_DI3_VLO 41.61 %, E_DI3_LO 31.98 %, E_DI3_HI 20.43 %, E_DI3_VHI 5.98 %
      diiDistribution: { very_low: 0.416, low: 0.32, high: 0.204, very_high: 0.06 },
      diiMedianScore: 4.3, // odvodené: 3.5 + (0.5 - 0.416) / 0.32 * 3
      orsEstimatedMedian: 38, // expertný odhad
    },
    CZ: {
      // Eurostat isoc_e_dii 2025 (rovnaký rez a vintage 2026-02-27 ako SK/EÚ;
      // overené dvomi nezávislými API cestami — JSON-stat aj SDMX TSV):
      // E_DI3_VLO 28.49 %, E_DI3_LO 30.58 %, E_DI3_HI 28.86 %, E_DI3_VHI 12.07 %
      // (súčet presne 100.00). ČR je tesne NAD priemerom EÚ-27.
      // DD KPI kontext: MSP so základnou DII 70.46 % (DESI 2026, ref. 2025).
      diiDistribution: { very_low: 0.285, low: 0.306, high: 0.289, very_high: 0.121 },
      diiMedianScore: 5.6, // odvodené: 3.5 + (0.5 - 0.2849) / 0.3058 * 3 = 5.61
      // Expertný odhad rovnakou logikou ako SK/EÚ: lineárne škálovanie podľa
      // pozície DII mediánu (SK 38 ↔ 4.29; EÚ 44 ↔ 5.4 → CZ ~45 ↔ 5.61).
      orsEstimatedMedian: 45,
    },
    EU27: {
      // Eurostat isoc_e_dii 2025: E_DI3_VLO 27.89 %, E_DI3_LO 34.52 %, E_DI3_HI 27.54 %, E_DI3_VHI 10.05 %
      diiDistribution: { very_low: 0.279, low: 0.345, high: 0.275, very_high: 0.101 },
      diiMedianScore: 5.4, // odvodené: 3.5 + (0.5 - 0.279) / 0.345 * 3
      orsEstimatedMedian: 44, // expertný odhad
    },
  } as Partial<Record<'SK' | 'CZ' | 'EU27', {
    diiDistribution: { very_low: number; low: number; high: number; very_high: number };
    diiMedianScore: number;
    orsEstimatedMedian: number;
  }>>,

  // Sektorové hodnoty sú expertné odhady kalibrované na SK distribúciu (Eurostat nepublikuje
  // DII medián po sektoroch) — v UI sa zobrazujú s disclaimerom.
  sectorBenchmarks: {
    manufacturing: { diiMedian: 4.8, orsEstimatedMedian: 40 },
    wholesale_retail: { diiMedian: 5.2, orsEstimatedMedian: 42 },
    professional_services: { diiMedian: 6.5, orsEstimatedMedian: 50 },
    construction: { diiMedian: 3.5, orsEstimatedMedian: 30 },
    transport_logistics: { diiMedian: 4.0, orsEstimatedMedian: 35 },
    accommodation_food: { diiMedian: 4.5, orsEstimatedMedian: 33 },
    ict: { diiMedian: 8.5, orsEstimatedMedian: 65 },
    other: { diiMedian: 4.5, orsEstimatedMedian: 38 },
  } as Record<string, { diiMedian: number; orsEstimatedMedian: number }>,

  // Veľkostné hodnoty sú expertné odhady. Kontext z Eurostat 2025 (aspoň základná intenzita):
  // SME 10-249: SK 57.1 % vs EÚ 71.4 %; veľké 250+: SK 89.4 % vs EÚ 96.4 %.
  sizeBenchmarks: {
    micro: { diiMedian: 3.2, orsEstimatedMedian: 28, note: 'Eurostat nepokrýva firmy <10 zamestnancov — expertný odhad' },
    small: { diiMedian: 4.5, orsEstimatedMedian: 38 },
    medium: { diiMedian: 6.8, orsEstimatedMedian: 52 },
    large: { diiMedian: 8.0, orsEstimatedMedian: 60 },
  } as Record<string, { diiMedian: number; orsEstimatedMedian: number; note?: string }>,
};
