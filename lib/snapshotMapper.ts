import type { PeerSnapshot, ResultSnapshot, Respondent } from '@/types';

/**
 * Convert the user's full ResultSnapshot + Respondent into a slim PeerSnapshot.
 *
 * The PeerSnapshot is the only thing we put behind a sharable hash URL — it
 * contains aggregates only (no per-question answers, no PII).
 *
 * schemaVersion 2: nemerané skóre sa ukladá ako null (v1 ho ticho koercovalo
 * na 0, čím sa N/A stalo nerozlíšiteľným od reálnej nuly) a diiMeasured nesie
 * počet meraných DII indikátorov — priznanie extrapolácie na zdieľanej stránke.
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
    schemaVersion: 2,
    sector,
    sizeBand,
    country: 'SK',
    diiScore100: roundOrNull(result.dii.score100),
    diiScore12: roundOrNull(result.dii.score12),
    diiMeasured: result.dii.measuredIndicators,
    orsScore: roundOrNull(result.ors.scorePenalized ?? result.ors.score),
    tdriScore: Math.round(result.tdri.score),
    businessImpactEur: Math.round(result.businessImpact.financialImpact.eurPerYear.mid),
    completedAt: completedAt ?? new Date().toISOString(),
    orsCategories: {
      procesy: roundOrNull(cats.A?.score),
      systemy: roundOrNull(cats.B?.score),
      data: roundOrNull(cats.C?.score),
      infra: roundOrNull(cats.D?.score),
      security: roundOrNull(cats.E?.score),
      governance: roundOrNull(cats.F?.score),
    },
  };
}

/** Nemerané (null/undefined/nekonečno) zostáva null — nikdy nie 0. */
function roundOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
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
