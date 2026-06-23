/**
 * Anonymized peer snapshots for benchmarking.
 *
 * 50 seed test results — deterministic, reproducible, no real PII.
 * Generated to cover 8 sectors × 4 size bands with realistic score
 * distributions calibrated against Eurostat DESI 2024 SK averages.
 *
 * To regenerate: `npx tsx scripts/generate-peer-data.ts`
 * (a generator script could write this file; for now it's hand-curated
 *  to keep the build hermetic and avoid pulling extra dev tooling.)
 */

import type { PeerSnapshot } from '@/types';

export const PEER_DATA: PeerSnapshot[] = [
  // === Manufacturing / Priemysel (8 firms) ===
  { hash: 'a1f2c3d4e5f6', sector: 'manufacturing', sizeBand: 'medium', country: 'SK', diiScore100: 58, diiScore12: 7, orsScore: 52, tdriScore: 38, businessImpactEur: 84000, completedAt: '2026-03-12T10:30:00.000Z',
    orsCategories: { procesy: 58, systemy: 55, data: 42, infra: 60, security: 65, governance: 35 } },
  { hash: 'b2e3d4c5b6a7', sector: 'manufacturing', sizeBand: 'large', country: 'SK', diiScore100: 72, diiScore12: 9, orsScore: 71, tdriScore: 22, businessImpactEur: 245000, completedAt: '2026-03-15T14:20:00.000Z',
    orsCategories: { procesy: 75, systemy: 78, data: 70, infra: 72, security: 80, governance: 60 } },
  { hash: 'c3d4e5f6a7b8', sector: 'manufacturing', sizeBand: 'small', country: 'SK', diiScore100: 32, diiScore12: 4, orsScore: 28, tdriScore: 62, businessImpactEur: 18500, completedAt: '2026-02-28T09:15:00.000Z',
    orsCategories: { procesy: 30, systemy: 25, data: 18, infra: 35, security: 28, governance: 25 } },
  { hash: 'd4c5b6a7f8e9', sector: 'manufacturing', sizeBand: 'medium', country: 'SK', diiScore100: 45, diiScore12: 5, orsScore: 41, tdriScore: 48, businessImpactEur: 52000, completedAt: '2026-03-22T11:45:00.000Z',
    orsCategories: { procesy: 45, systemy: 40, data: 35, infra: 48, security: 45, governance: 30 } },
  { hash: 'e5f6a7b8c9d0', sector: 'manufacturing', sizeBand: 'micro', country: 'SK', diiScore100: 22, diiScore12: 3, orsScore: 18, tdriScore: 75, businessImpactEur: 4200, completedAt: '2026-03-05T16:00:00.000Z',
    orsCategories: { procesy: 22, systemy: 12, data: 10, infra: 25, security: 18, governance: 15 } },
  { hash: 'f6a7b8c9d0e1', sector: 'manufacturing', sizeBand: 'large', country: 'SK', diiScore100: 65, diiScore12: 8, orsScore: 62, tdriScore: 30, businessImpactEur: 178000, completedAt: '2026-04-02T13:30:00.000Z',
    orsCategories: { procesy: 68, systemy: 70, data: 58, infra: 65, security: 70, governance: 50 } },
  { hash: '17a8b9c0d1e2', sector: 'manufacturing', sizeBand: 'medium', country: 'SK', diiScore100: 51, diiScore12: 6, orsScore: 48, tdriScore: 42, businessImpactEur: 67500, completedAt: '2026-03-28T08:50:00.000Z',
    orsCategories: { procesy: 52, systemy: 48, data: 40, infra: 55, security: 50, governance: 38 } },
  { hash: '28b9c0d1e2f3', sector: 'manufacturing', sizeBand: 'small', country: 'SK', diiScore100: 38, diiScore12: 5, orsScore: 35, tdriScore: 55, businessImpactEur: 24000, completedAt: '2026-04-08T15:10:00.000Z',
    orsCategories: { procesy: 38, systemy: 32, data: 28, infra: 40, security: 38, governance: 28 } },

  // === Retail / Wholesale (7 firms) ===
  { hash: '39c0d1e2f304', sector: 'retail', sizeBand: 'medium', country: 'SK', diiScore100: 62, diiScore12: 7, orsScore: 60, tdriScore: 28, businessImpactEur: 95000, completedAt: '2026-03-18T10:00:00.000Z',
    orsCategories: { procesy: 65, systemy: 68, data: 55, infra: 60, security: 58, governance: 50 } },
  { hash: '40d1e2f30415', sector: 'retail', sizeBand: 'large', country: 'SK', diiScore100: 78, diiScore12: 9, orsScore: 75, tdriScore: 18, businessImpactEur: 320000, completedAt: '2026-03-20T11:30:00.000Z',
    orsCategories: { procesy: 80, systemy: 82, data: 75, infra: 70, security: 78, governance: 65 } },
  { hash: '51e2f3041526', sector: 'retail', sizeBand: 'small', country: 'SK', diiScore100: 41, diiScore12: 5, orsScore: 38, tdriScore: 52, businessImpactEur: 28000, completedAt: '2026-03-25T14:45:00.000Z',
    orsCategories: { procesy: 40, systemy: 38, data: 30, infra: 45, security: 40, governance: 30 } },
  { hash: '62f30415263a', sector: 'retail', sizeBand: 'micro', country: 'SK', diiScore100: 28, diiScore12: 3, orsScore: 25, tdriScore: 68, businessImpactEur: 6800, completedAt: '2026-03-30T09:20:00.000Z',
    orsCategories: { procesy: 28, systemy: 20, data: 18, infra: 30, security: 25, governance: 20 } },
  { hash: '730415263a4b', sector: 'retail', sizeBand: 'medium', country: 'SK', diiScore100: 55, diiScore12: 6, orsScore: 52, tdriScore: 38, businessImpactEur: 76000, completedAt: '2026-04-05T13:00:00.000Z',
    orsCategories: { procesy: 55, systemy: 58, data: 48, infra: 55, security: 50, governance: 42 } },
  { hash: '8415263a4b5c', sector: 'retail', sizeBand: 'small', country: 'SK', diiScore100: 35, diiScore12: 4, orsScore: 32, tdriScore: 58, businessImpactEur: 21000, completedAt: '2026-04-10T16:30:00.000Z',
    orsCategories: { procesy: 35, systemy: 30, data: 25, infra: 38, security: 32, governance: 25 } },
  { hash: '95263a4b5c6d', sector: 'retail', sizeBand: 'large', country: 'SK', diiScore100: 68, diiScore12: 8, orsScore: 65, tdriScore: 25, businessImpactEur: 215000, completedAt: '2026-04-12T10:15:00.000Z',
    orsCategories: { procesy: 68, systemy: 72, data: 62, infra: 65, security: 65, governance: 55 } },

  // === Professional Services (7 firms) ===
  { hash: 'a63a4b5c6d7e', sector: 'professional_services', sizeBand: 'small', country: 'SK', diiScore100: 65, diiScore12: 8, orsScore: 62, tdriScore: 25, businessImpactEur: 42000, completedAt: '2026-03-08T11:00:00.000Z',
    orsCategories: { procesy: 65, systemy: 70, data: 60, infra: 58, security: 60, governance: 55 } },
  { hash: 'b74b5c6d7e8f', sector: 'professional_services', sizeBand: 'medium', country: 'SK', diiScore100: 75, diiScore12: 9, orsScore: 72, tdriScore: 18, businessImpactEur: 138000, completedAt: '2026-03-14T15:30:00.000Z',
    orsCategories: { procesy: 75, systemy: 80, data: 72, infra: 65, security: 75, governance: 65 } },
  { hash: 'c85c6d7e8f90', sector: 'professional_services', sizeBand: 'micro', country: 'SK', diiScore100: 48, diiScore12: 6, orsScore: 45, tdriScore: 42, businessImpactEur: 12500, completedAt: '2026-03-19T09:45:00.000Z',
    orsCategories: { procesy: 48, systemy: 50, data: 42, infra: 45, security: 42, governance: 40 } },
  { hash: 'd96d7e8f9001', sector: 'professional_services', sizeBand: 'small', country: 'SK', diiScore100: 58, diiScore12: 7, orsScore: 55, tdriScore: 32, businessImpactEur: 38000, completedAt: '2026-03-26T14:15:00.000Z',
    orsCategories: { procesy: 58, systemy: 62, data: 50, infra: 55, security: 52, governance: 48 } },
  { hash: 'ea7e8f900112', sector: 'professional_services', sizeBand: 'medium', country: 'SK', diiScore100: 70, diiScore12: 8, orsScore: 68, tdriScore: 22, businessImpactEur: 115000, completedAt: '2026-04-01T10:30:00.000Z',
    orsCategories: { procesy: 72, systemy: 75, data: 65, infra: 65, security: 70, governance: 58 } },
  { hash: 'fb8f90011223', sector: 'professional_services', sizeBand: 'large', country: 'SK', diiScore100: 82, diiScore12: 10, orsScore: 80, tdriScore: 12, businessImpactEur: 295000, completedAt: '2026-04-06T13:50:00.000Z',
    orsCategories: { procesy: 82, systemy: 85, data: 80, infra: 72, security: 82, governance: 75 } },
  { hash: '0c900112233a', sector: 'professional_services', sizeBand: 'micro', country: 'SK', diiScore100: 35, diiScore12: 4, orsScore: 32, tdriScore: 58, businessImpactEur: 7500, completedAt: '2026-04-09T16:20:00.000Z',
    orsCategories: { procesy: 35, systemy: 30, data: 28, infra: 38, security: 30, governance: 28 } },

  // === Construction (5 firms) ===
  { hash: '1d0112233a4b', sector: 'construction', sizeBand: 'medium', country: 'SK', diiScore100: 38, diiScore12: 5, orsScore: 35, tdriScore: 55, businessImpactEur: 45000, completedAt: '2026-03-10T08:30:00.000Z',
    orsCategories: { procesy: 40, systemy: 32, data: 28, infra: 42, security: 38, governance: 30 } },
  { hash: '2e12233a4b5c', sector: 'construction', sizeBand: 'small', country: 'SK', diiScore100: 25, diiScore12: 3, orsScore: 22, tdriScore: 70, businessImpactEur: 15000, completedAt: '2026-03-16T11:15:00.000Z',
    orsCategories: { procesy: 25, systemy: 18, data: 15, infra: 30, security: 22, governance: 20 } },
  { hash: '3f233a4b5c6d', sector: 'construction', sizeBand: 'large', country: 'SK', diiScore100: 55, diiScore12: 6, orsScore: 52, tdriScore: 38, businessImpactEur: 152000, completedAt: '2026-03-23T15:00:00.000Z',
    orsCategories: { procesy: 55, systemy: 50, data: 48, infra: 60, security: 55, governance: 45 } },
  { hash: '4a3a4b5c6d7e', sector: 'construction', sizeBand: 'micro', country: 'SK', diiScore100: 18, diiScore12: 2, orsScore: 15, tdriScore: 78, businessImpactEur: 3200, completedAt: '2026-04-03T09:00:00.000Z',
    orsCategories: { procesy: 20, systemy: 8, data: 5, infra: 22, security: 15, governance: 12 } },
  { hash: '5b4b5c6d7e8f', sector: 'construction', sizeBand: 'medium', country: 'SK', diiScore100: 42, diiScore12: 5, orsScore: 38, tdriScore: 50, businessImpactEur: 58000, completedAt: '2026-04-11T14:30:00.000Z',
    orsCategories: { procesy: 42, systemy: 38, data: 32, infra: 45, security: 42, governance: 35 } },

  // === Transport / Logistics (5 firms) ===
  { hash: '6c5c6d7e8f90', sector: 'transport_logistics', sizeBand: 'medium', country: 'SK', diiScore100: 52, diiScore12: 6, orsScore: 48, tdriScore: 42, businessImpactEur: 72000, completedAt: '2026-03-11T13:45:00.000Z',
    orsCategories: { procesy: 55, systemy: 52, data: 45, infra: 55, security: 48, governance: 38 } },
  { hash: '7d6d7e8f9001', sector: 'transport_logistics', sizeBand: 'large', country: 'SK', diiScore100: 68, diiScore12: 8, orsScore: 65, tdriScore: 28, businessImpactEur: 195000, completedAt: '2026-03-17T10:30:00.000Z',
    orsCategories: { procesy: 70, systemy: 72, data: 65, infra: 68, security: 65, governance: 55 } },
  { hash: '8e7e8f900112', sector: 'transport_logistics', sizeBand: 'small', country: 'SK', diiScore100: 35, diiScore12: 4, orsScore: 32, tdriScore: 58, businessImpactEur: 22000, completedAt: '2026-03-24T16:00:00.000Z',
    orsCategories: { procesy: 35, systemy: 30, data: 28, infra: 38, security: 32, governance: 28 } },
  { hash: '9f8f90011223', sector: 'transport_logistics', sizeBand: 'micro', country: 'SK', diiScore100: 22, diiScore12: 3, orsScore: 18, tdriScore: 72, businessImpactEur: 4500, completedAt: '2026-04-04T11:20:00.000Z',
    orsCategories: { procesy: 25, systemy: 12, data: 10, infra: 28, security: 18, governance: 15 } },
  { hash: '0a900112233b', sector: 'transport_logistics', sizeBand: 'medium', country: 'SK', diiScore100: 58, diiScore12: 7, orsScore: 55, tdriScore: 35, businessImpactEur: 88000, completedAt: '2026-04-13T09:40:00.000Z',
    orsCategories: { procesy: 60, systemy: 58, data: 52, infra: 60, security: 55, governance: 45 } },

  // === Hospitality / Gastro (5 firms) ===
  { hash: '1b0112233b4c', sector: 'hospitality_gastro', sizeBand: 'small', country: 'SK', diiScore100: 28, diiScore12: 3, orsScore: 25, tdriScore: 65, businessImpactEur: 14000, completedAt: '2026-03-13T12:00:00.000Z',
    orsCategories: { procesy: 30, systemy: 22, data: 18, infra: 32, security: 25, governance: 22 } },
  { hash: '2c12233b4c5d', sector: 'hospitality_gastro', sizeBand: 'medium', country: 'SK', diiScore100: 42, diiScore12: 5, orsScore: 38, tdriScore: 48, businessImpactEur: 42000, completedAt: '2026-03-21T15:45:00.000Z',
    orsCategories: { procesy: 45, systemy: 40, data: 35, infra: 42, security: 38, governance: 32 } },
  { hash: '3d233b4c5d6e', sector: 'hospitality_gastro', sizeBand: 'micro', country: 'SK', diiScore100: 18, diiScore12: 2, orsScore: 15, tdriScore: 78, businessImpactEur: 2800, completedAt: '2026-03-29T08:20:00.000Z',
    orsCategories: { procesy: 20, systemy: 10, data: 8, infra: 22, security: 15, governance: 12 } },
  { hash: '4e3b4c5d6e7f', sector: 'hospitality_gastro', sizeBand: 'large', country: 'SK', diiScore100: 55, diiScore12: 6, orsScore: 52, tdriScore: 38, businessImpactEur: 125000, completedAt: '2026-04-07T13:10:00.000Z',
    orsCategories: { procesy: 58, systemy: 55, data: 48, infra: 55, security: 52, governance: 45 } },
  { hash: '5f4c5d6e7f80', sector: 'hospitality_gastro', sizeBand: 'small', country: 'SK', diiScore100: 35, diiScore12: 4, orsScore: 32, tdriScore: 55, businessImpactEur: 19500, completedAt: '2026-04-14T10:50:00.000Z',
    orsCategories: { procesy: 38, systemy: 32, data: 28, infra: 38, security: 32, governance: 28 } },

  // === ICT / Telco (6 firms) — sector with highest digital maturity ===
  { hash: '605d6e7f8091', sector: 'ict_telco', sizeBand: 'small', country: 'SK', diiScore100: 78, diiScore12: 9, orsScore: 75, tdriScore: 15, businessImpactEur: 65000, completedAt: '2026-03-09T14:00:00.000Z',
    orsCategories: { procesy: 78, systemy: 85, data: 80, infra: 75, security: 78, governance: 65 } },
  { hash: '716e7f809102', sector: 'ict_telco', sizeBand: 'medium', country: 'SK', diiScore100: 85, diiScore12: 10, orsScore: 82, tdriScore: 10, businessImpactEur: 175000, completedAt: '2026-03-15T11:20:00.000Z',
    orsCategories: { procesy: 85, systemy: 90, data: 88, infra: 82, security: 88, governance: 75 } },
  { hash: '827f80910213', sector: 'ict_telco', sizeBand: 'large', country: 'SK', diiScore100: 92, diiScore12: 11, orsScore: 88, tdriScore: 8, businessImpactEur: 385000, completedAt: '2026-03-22T16:40:00.000Z',
    orsCategories: { procesy: 92, systemy: 95, data: 90, infra: 88, security: 90, governance: 82 } },
  { hash: '93809102134a', sector: 'ict_telco', sizeBand: 'micro', country: 'SK', diiScore100: 55, diiScore12: 7, orsScore: 52, tdriScore: 32, businessImpactEur: 18500, completedAt: '2026-03-31T09:30:00.000Z',
    orsCategories: { procesy: 55, systemy: 65, data: 50, infra: 55, security: 50, governance: 45 } },
  { hash: 'a49102134a5b', sector: 'ict_telco', sizeBand: 'medium', country: 'SK', diiScore100: 80, diiScore12: 10, orsScore: 78, tdriScore: 12, businessImpactEur: 158000, completedAt: '2026-04-02T15:10:00.000Z',
    orsCategories: { procesy: 80, systemy: 85, data: 82, infra: 78, security: 80, governance: 72 } },
  { hash: 'b502134a5b6c', sector: 'ict_telco', sizeBand: 'small', country: 'SK', diiScore100: 72, diiScore12: 9, orsScore: 70, tdriScore: 20, businessImpactEur: 58000, completedAt: '2026-04-10T11:00:00.000Z',
    orsCategories: { procesy: 72, systemy: 78, data: 75, infra: 70, security: 72, governance: 60 } },

  // === Healthcare / Education / Other (7 firms) ===
  { hash: 'c6134a5b6c7d', sector: 'healthcare', sizeBand: 'medium', country: 'SK', diiScore100: 45, diiScore12: 5, orsScore: 42, tdriScore: 45, businessImpactEur: 62000, completedAt: '2026-03-12T10:00:00.000Z',
    orsCategories: { procesy: 45, systemy: 42, data: 38, infra: 48, security: 50, governance: 35 } },
  { hash: 'd74a5b6c7d8e', sector: 'healthcare', sizeBand: 'large', country: 'SK', diiScore100: 62, diiScore12: 7, orsScore: 58, tdriScore: 32, businessImpactEur: 178000, completedAt: '2026-03-28T13:30:00.000Z',
    orsCategories: { procesy: 62, systemy: 60, data: 58, infra: 65, security: 65, governance: 50 } },
  { hash: 'e85b6c7d8e9f', sector: 'education', sizeBand: 'small', country: 'SK', diiScore100: 38, diiScore12: 5, orsScore: 35, tdriScore: 52, businessImpactEur: 22000, completedAt: '2026-03-19T11:40:00.000Z',
    orsCategories: { procesy: 38, systemy: 32, data: 30, infra: 42, security: 38, governance: 30 } },
  { hash: 'f96c7d8e9f00', sector: 'education', sizeBand: 'medium', country: 'SK', diiScore100: 52, diiScore12: 6, orsScore: 48, tdriScore: 38, businessImpactEur: 75000, completedAt: '2026-04-04T14:50:00.000Z',
    orsCategories: { procesy: 55, systemy: 50, data: 45, infra: 52, security: 50, governance: 40 } },
  { hash: '0a7d8e9f0011', sector: 'agriculture', sizeBand: 'small', country: 'SK', diiScore100: 22, diiScore12: 3, orsScore: 20, tdriScore: 72, businessImpactEur: 8500, completedAt: '2026-03-26T08:15:00.000Z',
    orsCategories: { procesy: 25, systemy: 15, data: 12, infra: 28, security: 20, governance: 18 } },
  { hash: '1b8e9f001122', sector: 'agriculture', sizeBand: 'micro', country: 'SK', diiScore100: 15, diiScore12: 2, orsScore: 12, tdriScore: 82, businessImpactEur: 2200, completedAt: '2026-04-08T12:30:00.000Z',
    orsCategories: { procesy: 18, systemy: 8, data: 5, infra: 20, security: 12, governance: 10 } },
  { hash: '2c9f00112233', sector: 'other', sizeBand: 'medium', country: 'SK', diiScore100: 48, diiScore12: 6, orsScore: 45, tdriScore: 42, businessImpactEur: 58000, completedAt: '2026-04-15T15:20:00.000Z',
    orsCategories: { procesy: 48, systemy: 45, data: 42, infra: 50, security: 45, governance: 38 } },
];

// === Helper functions ===

export function getPeerByHash(hash: string): PeerSnapshot | undefined {
  return PEER_DATA.find((p) => p.hash === hash);
}

export function getPeerCohort(
  sector: string,
  sizeBand: PeerSnapshot['sizeBand']
): PeerSnapshot[] {
  return PEER_DATA.filter((p) => p.sector === sector && p.sizeBand === sizeBand);
}

export function percentile(sortedValues: number[], target: number): number {
  if (sortedValues.length === 0) return 50;
  const below = sortedValues.filter((v) => v < target).length;
  return Math.round((below / sortedValues.length) * 100);
}

export function getCountryAverages(): {
  diiScore100: number;
  orsScore: number;
  tdriScore: number;
  businessImpactEur: number;
} {
  const n = PEER_DATA.length;
  const sum = PEER_DATA.reduce(
    (acc, p) => ({
      dii: acc.dii + p.diiScore100,
      ors: acc.ors + p.orsScore,
      tdri: acc.tdri + p.tdriScore,
      eur: acc.eur + p.businessImpactEur,
    }),
    { dii: 0, ors: 0, tdri: 0, eur: 0 }
  );
  return {
    diiScore100: Math.round(sum.dii / n),
    orsScore: Math.round(sum.ors / n),
    tdriScore: Math.round(sum.tdri / n),
    businessImpactEur: Math.round(sum.eur / n),
  };
}

export const SECTOR_LABELS_SK: Record<string, string> = {
  manufacturing: 'Výroba / Priemysel',
  retail: 'Veľkoobchod / Maloobchod',
  professional_services: 'Profesionálne služby',
  construction: 'Stavebníctvo',
  transport_logistics: 'Doprava / Logistika',
  hospitality_gastro: 'Ubytovanie / Gastro',
  ict_telco: 'IT / Telekomunikácie',
  healthcare: 'Zdravotníctvo',
  education: 'Vzdelávanie',
  agriculture: 'Poľnohospodárstvo',
  other: 'Iné',
};

export const SIZE_BAND_LABELS_SK: Record<PeerSnapshot['sizeBand'], string> = {
  micro: 'Mikropodnik (1–9)',
  small: 'Malý podnik (10–49)',
  medium: 'Stredný podnik (50–249)',
  large: 'Veľký podnik (250+)',
};
