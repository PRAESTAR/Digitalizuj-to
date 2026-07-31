import { describe, expect, test } from 'vitest';
import type { Answer } from '@/types';
import { calculateBusinessImpact, extractROIInputs } from './roiEngine';

// Pomocník: minimálna validná odpoveď pre testy.
function answer(questionId: string, value: string | string[]): Answer {
  return {
    questionId,
    value,
    score: 50,
    isUnknown: false,
    wasSkipped: false,
    timestamp: '2026-01-01T00:00:00.000Z',
  };
}

describe('extractROIInputs — manuálne procesy', () => {
  test('použije výber z cx_A05 a odfiltruje hodnotu "none"', () => {
    const answers = [answer('cx_A05', ['invoicing', 'reporting', 'none'])];

    const inputs = extractROIInputs(answers, [], 50);

    expect(inputs.manualProcesses).toEqual(['invoicing', 'reporting']);
  });

  test('cx_A05 = ["none"] znamená žiadne manuálne procesy', () => {
    const answers = [answer('cx_A05', ['none'])];

    const inputs = extractROIInputs(answers, [], 50);

    expect(inputs.manualProcesses).toEqual([]);
  });

  test('bez cx_A05 je zoznam procesov prázdny — indikatívny kvíz nemá otázku na manuálne procesy', () => {
    // ind_05 je otázka o POUŽÍVANÝCH SYSTÉMOCH (erp, crm...), nie o manuálnych
    // procesoch — jej hodnoty sa nesmú dostať do manualProcesses. Benchmark
    // default (3 procesy) doplní až calculateBusinessImpact s korektným
    // označením v audit traile.
    const answers = [
      answer('ind_02', 'small'),
      answer('ind_05', ['erp', 'crm', 'accounting']),
    ];

    const inputs = extractROIInputs(answers, [], 50);

    expect(inputs.manualProcesses).toEqual([]);
  });
});

describe('extractROIInputs — ostatné vstupy', () => {
  test('maturita sa číta z ind_03, pásma z ind_02 / cx_ROI02 / cx_ROI03', () => {
    const answers = [
      answer('ind_02', 'medium'),
      answer('ind_03', '3'),
      answer('cx_ROI02', '11_25'),
      answer('cx_ROI03', 'high'),
    ];

    const inputs = extractROIInputs(answers, [], 72);

    expect(inputs.maturityLevel).toBe(3);
    expect(inputs.employeeCountBand).toBe('medium');
    expect(inputs.adminHeadcountBand).toBe('11_25');
    expect(inputs.invoicingVolumeBand).toBe('high');
    expect(inputs.categoryScoreF).toBe(72);
  });

  test('bez odpovedí platia defaulty (small, medium, 4_10, maturita 2)', () => {
    const inputs = extractROIInputs([], [], 0);

    expect(inputs.maturityLevel).toBe(2);
    expect(inputs.employeeCountBand).toBe('small');
    expect(inputs.invoicingVolumeBand).toBe('medium');
    expect(inputs.adminHeadcountBand).toBe('4_10');
    expect(inputs.manualProcesses).toEqual([]);
  });
});

describe('calculateBusinessImpact — voľba procesov', () => {
  const baseInputs = {
    employeeCountBand: 'small',
    maturityLevel: 1,
    invoicingVolumeBand: 'medium',
    adminHeadcountBand: '4_10',
    categoryScoreF: 60,
  };

  test('bez self-reported procesov počíta s 3 defaultnými benchmark procesmi', () => {
    const impact = calculateBusinessImpact([], [], {
      ...baseInputs,
      manualProcesses: [],
    });

    const processes = impact.calculationAudit.map(e => e.process);
    expect(processes).toEqual(['invoicing', 'reporting', 'approval_workflows']);
    for (const entry of impact.calculationAudit) {
      expect(entry.dataSource).toContain('benchmark');
      expect(entry.dataSource).not.toContain('self-reported,');
    }
  });

  test('self-reported procesy sa použijú presne a označia sa ako mix', () => {
    const impact = calculateBusinessImpact([], [], {
      ...baseInputs,
      manualProcesses: ['invoicing', 'hr_onboarding'],
    });

    const processes = impact.calculationAudit.map(e => e.process);
    expect(processes).toEqual(['invoicing', 'hr_onboarding']);
    for (const entry of impact.calculationAudit) {
      expect(entry.dataSource).toBe('mix (process: self-reported, volumes: benchmark)');
    }
  });

  test('procesy bez benchmarku sa odfiltrujú; ak nezostane nič, nastúpia defaulty', () => {
    // cx_A05 obsahuje aj hodnoty bez benchmarku (warehouse, service, purchasing).
    const impact = calculateBusinessImpact([], [], {
      ...baseInputs,
      manualProcesses: ['warehouse', 'service'],
    });

    const processes = impact.calculationAudit.map(e => e.process);
    expect(processes).toEqual(['invoicing', 'reporting', 'approval_workflows']);
  });
});
