import { describe, expect, test } from 'vitest';
import { calculateBusinessImpact } from './roiEngine';
import { rampUpMonthsByScenario } from '@/data/scoringConfig';
import type { ScenarioValues } from '@/types';

/**
 * Veľké číslo na karte a graf pod ním musia hovoriť to isté.
 *
 * Karta hlásila ustálený run-rate ako „€/rok", kým graf na tej istej
 * obrazovke ukazoval v 12. mesiaci o 8–33 % menej (nábeh 3–9 mesiacov podľa
 * scenára). Dve rôzne čísla pre tú istú vec — a to väčšie bolo tučným písmom.
 */

const SCENARIOS = ['conservative', 'mid', 'optimistic'] as const;

const impactFor = (maturityLevel: number) =>
  calculateBusinessImpact([], [], {
    employeeCountBand: 'small', maturityLevel,
    manualProcesses: ['invoicing', 'reporting'], noManualProcesses: false,
    invoicingVolumeBand: 'medium', adminHeadcountBand: '4_10',
    categoryScoreF: 60, investmentIntent: 8,
  });

describe('prvý rok vs. ustálený run-rate', () => {
  test('firstYearEur sa presne rovná bodu grafu za 12. mesiac', () => {
    // Jeden zdroj, nie dva výpočty — inak sa časom rozídu.
    const impact = impactFor(1);
    const m12 = impact.savingsProjection.points.find((p) => p.month === 12)!;
    for (const s of SCENARIOS) {
      expect(impact.financialImpact.firstYearEur![s], s).toBe(m12[s]);
    }
  });

  test('prvý rok je NIŽŠÍ než run-rate — nábeh nie je zadarmo', () => {
    const impact = impactFor(1);
    for (const s of SCENARIOS) {
      expect(impact.financialImpact.firstYearEur![s], s)
        .toBeLessThan(impact.financialImpact.eurPerYear[s]);
    }
  });

  test('podiel prvého roka sedí so vzorcom nábehu', () => {
    // Pri nábehu R mesiacov je kumulatív za 12 mesiacov (12 − (R−1)/2)
    // mesačných run-rate. Podiel teda vychádza z konfigurácie, nie z oka.
    const impact = impactFor(1);
    for (const s of SCENARIOS) {
      const R = rampUpMonthsByScenario[s];
      const expectedShare = (12 - (R - 1) / 2) / 12;
      const actualShare = impact.financialImpact.firstYearEur![s] / impact.financialImpact.eurPerYear[s];
      expect(actualShare, `${s} (nábeh ${R} mes.)`).toBeCloseTo(expectedShare, 2);
    }
  });

  test('rýchlejší nábeh dá vyšší podiel prvého roka', () => {
    const impact = impactFor(1);
    const share = (s: (typeof SCENARIOS)[number]) =>
      impact.financialImpact.firstYearEur![s] / impact.financialImpact.eurPerYear[s];
    // optimistic má najkratší nábeh (3 mes.), conservative najdlhší (9).
    expect(share('optimistic')).toBeGreaterThan(share('mid'));
    expect(share('mid')).toBeGreaterThan(share('conservative'));
  });

  test('nulová úspora nedá NaN ani zápornú hodnotu', () => {
    const zero = calculateBusinessImpact([], [], {
      employeeCountBand: 'small', maturityLevel: 4,
      manualProcesses: [], noManualProcesses: true,
      invoicingVolumeBand: null, adminHeadcountBand: null,
      categoryScoreF: 60, investmentIntent: 5,
    });
    const first = zero.financialImpact.firstYearEur as ScenarioValues;
    for (const s of SCENARIOS) {
      expect(Number.isFinite(first[s]), s).toBe(true);
      expect(first[s]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('odstup od plnej digitalizácie netvrdí porovnanie s trhom', () => {
  // `gapPercentage` je (1 − zrelosť/4) × 100 — vzdialenosť od najvyššej
  // úrovne procesnej zrelosti. Žiadny benchmark doň nevstupuje, takže text
  // nesmie hovoriť „oproti priemeru".
  test.each([0, 1, 2, 3, 4])('zrelosť %s: text nespomína priemer ani trh', (m) => {
    const g = impactFor(m).opportunityGap;
    expect(g.benchmarkComparisonSk.toLowerCase()).not.toContain('priemer');
    expect(g.descriptionSk.toLowerCase()).not.toContain('priemer');
  });

  test('percento sedí so vzorcom (1 − zrelosť/4)', () => {
    for (const m of [0, 1, 2, 3, 4]) {
      expect(impactFor(m).opportunityGap.gapPercentage, `zrelosť ${m}`)
        .toBe(Math.max(0, Math.round((1 - m / 4) * 100)));
    }
  });

  test('plná zrelosť dá nulový odstup', () => {
    expect(impactFor(4).opportunityGap.gapPercentage).toBe(0);
  });
});
