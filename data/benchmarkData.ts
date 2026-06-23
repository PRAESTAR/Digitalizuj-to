export const benchmarkData = {
  version: '2024-Q4',
  source: 'Eurostat DESI 2024 + expertné odhady',
  lastUpdated: '2024-12-01',

  countryBenchmarks: {
    SK: {
      diiDistribution: { very_low: 0.42, low: 0.33, high: 0.18, very_high: 0.07 },
      diiMedianScore: 4.2,
      orsEstimatedMedian: 38,
    },
    EU27: {
      diiDistribution: { very_low: 0.31, low: 0.30, high: 0.24, very_high: 0.15 },
      diiMedianScore: 5.5,
      orsEstimatedMedian: 44,
    },
  },

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

  sizeBenchmarks: {
    micro: { diiMedian: 3.2, orsEstimatedMedian: 28 },
    small: { diiMedian: 4.5, orsEstimatedMedian: 38 },
    medium: { diiMedian: 6.8, orsEstimatedMedian: 52 },
    large: { diiMedian: 8.0, orsEstimatedMedian: 60 },
  } as Record<string, { diiMedian: number; orsEstimatedMedian: number }>,
};
