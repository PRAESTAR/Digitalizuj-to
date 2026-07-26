import type { PeerSnapshot, ResultSnapshot, Respondent } from '@/types';

/**
 * Convert the user's full ResultSnapshot + Respondent into a slim PeerSnapshot.
 *
 * The PeerSnapshot is the only thing we put behind a sharable hash URL — it
 * contains aggregates only (no per-question answers, no PII).
 */
export function toPeerSnapshot(
  hash: string,
  result: ResultSnapshot,
  respondent: Respondent,
  completedAt?: string
): PeerSnapshot {
  const sector = respondent.sector || 'other';
  const sizeBand = mapSizeBand(respondent.employeeCountBand);
  const cats = result.ors.categories;

  return {
    hash,
    sector,
    sizeBand,
    country: 'SK',
    diiScore100: Math.round(result.dii.score100),
    diiScore12: Math.round(result.dii.score12),
    orsScore: Math.round(result.ors.scorePenalized ?? result.ors.score),
    tdriScore: Math.round(result.tdri.score),
    businessImpactEur: Math.round(result.businessImpact.financialImpact.eurPerYear.mid),
    completedAt: completedAt ?? new Date().toISOString(),
    orsCategories: {
      procesy: round(cats.A?.score),
      systemy: round(cats.B?.score),
      data: round(cats.C?.score),
      infra: round(cats.D?.score),
      security: round(cats.E?.score),
      governance: round(cats.F?.score),
    },
  };
}

function round(value: number | undefined): number {
  return Number.isFinite(value) ? Math.round(value as number) : 0;
}

/**
 * Respondent.employeeCountBand may be empty (user skipped sector module).
 * Default to 'small' so peer cohort lookups still work.
 */
function mapSizeBand(
  band: Respondent['employeeCountBand']
): PeerSnapshot['sizeBand'] {
  if (band === 'micro' || band === 'small' || band === 'medium' || band === 'large') {
    return band;
  }
  return 'small';
}
