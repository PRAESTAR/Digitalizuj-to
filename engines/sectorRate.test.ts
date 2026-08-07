import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { calculateBusinessImpact, extractROIInputs } from './roiEngine';
import { sectorHourlyCostEur, defaultHourlyCostEur } from '@/data/scoringConfig';
import type { Answer } from '@/types';

/**
 * Hodinová cena práce podľa odvetvia (ROI_MODEL §7).
 *
 * Do 7. 8. 2026 sa na všetky odvetvia používala jedna sadzba 30,8 €/h
 * z NACE J — najlepšie plateného odvetvia v datasete. Úspora sa počíta ako
 * ušetrené hodiny × sadzba, takže chyba išla priamo do eurového čísla:
 * ubytovanie a gastro (13,0 €/h) dostávalo odhad nadhodnotený 2,4-násobne.
 */

const bank = JSON.parse(readFileSync('data/questionBank.json', 'utf8'));
const sectorOptions: string[] = bank.indicative_quiz.questions
  .find((q: { maps_to_score?: string[] }) => (q.maps_to_score ?? []).includes('benchmark_sector'))
  .options.map((o: { value: string }) => o.value);

const answer = (questionId: string, value: string): Answer => ({
  questionId, value, score: 0, isUnknown: false, wasSkipped: false,
  timestamp: '2026-08-07T00:00:00.000Z',
});

const inputs = (sector: string | null) => ({
  employeeCountBand: 'small',
  sector,
  maturityLevel: 1,
  manualProcesses: ['invoicing'],
  noManualProcesses: false,
  invoicingVolumeBand: 'medium',
  adminHeadcountBand: '4_10',
  categoryScoreF: 60,
  investmentIntent: null,
});

describe('sadzobník sedí s kvízom', () => {
  test('každé odvetvie ponúkané v kvíze má sadzbu', () => {
    const missing = sectorOptions.filter(s => !(s in sectorHourlyCostEur));
    expect(missing, `bez sadzby: ${missing.join(', ')}`).toEqual([]);
  });

  test('sadzobník neobsahuje odvetvie, ktoré kvíz neponúka', () => {
    const extra = Object.keys(sectorHourlyCostEur).filter(s => !sectorOptions.includes(s));
    expect(extra, `navyše: ${extra.join(', ')}`).toEqual([]);
  });

  test('všetky sadzby sú kladné a v hodnovernom rozsahu', () => {
    for (const [s, v] of Object.entries(sectorHourlyCostEur)) {
      expect(v, s).toBeGreaterThan(5);
      expect(v, s).toBeLessThan(60);
    }
  });
});

describe('sadzba sa premietne do výsledku', () => {
  test('gastro dostane výrazne nižší odhad než IT', () => {
    const gastro = calculateBusinessImpact([], [], inputs('accommodation_food'));
    const it = calculateBusinessImpact([], [], inputs('ict'));
    const pomer = it.financialImpact.eurPerYear.mid / gastro.financialImpact.eurPerYear.mid;
    // 30,8 / 13,0 = 2,37 — úspora v hodinách je rovnaká, líši sa len sadzba.
    expect(pomer).toBeGreaterThan(2.3);
    expect(pomer).toBeLessThan(2.45);
  });

  test('ušetrené HODINY sa sadzbou nemenia — mení sa len ich ocenenie', () => {
    const gastro = calculateBusinessImpact([], [], inputs('accommodation_food'));
    const it = calculateBusinessImpact([], [], inputs('ict'));
    expect(gastro.timeSavings.hoursPerYear.mid).toBe(it.timeSavings.hoursPerYear.mid);
  });

  test('neuvedené odvetvie spadne na pôvodnú sadzbu a prizná to', () => {
    const bez = calculateBusinessImpact([], [], inputs(null));
    const it = calculateBusinessImpact([], [], inputs('ict'));
    expect(bez.financialImpact.eurPerYear.mid).toBe(it.financialImpact.eurPerYear.mid);
    const audit = JSON.stringify(bez);
    expect(audit).toContain(String(defaultHourlyCostEur));
    expect(audit).toMatch(/NADHODNOTENIE/);
  });

  test('rozklad uvádza sadzbu, s ktorou sa naozaj rátalo', () => {
    for (const s of sectorOptions) {
      const audit = JSON.stringify(calculateBusinessImpact([], [], inputs(s)));
      expect(audit, s).toContain(`${sectorHourlyCostEur[s]} €/hod`);
    }
  });
});

describe('extractROIInputs číta odvetvie', () => {
  test('z indikatívneho aj komplexného kvízu', () => {
    expect(extractROIInputs([answer('ind_01', 'construction')], [], 50).sector).toBe('construction');
    expect(extractROIInputs([answer('cx_01', 'manufacturing')], [], 50).sector).toBe('manufacturing');
  });

  test('neznáma hodnota je to isté ako chýbajúca', () => {
    expect(extractROIInputs([answer('ind_01', 'kozmonautika')], [], 50).sector).toBeNull();
    expect(extractROIInputs([], [], 50).sector).toBeNull();
  });
});
