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

  test('chýbajúce vstupy zostávajú null — nedosádzajú sa ticho pásma', () => {
    const inputs = extractROIInputs([], [], 0);

    expect(inputs.maturityLevel).toBe(2); // jediný default, ktorý zostáva
    expect(inputs.employeeCountBand).toBeNull();
    expect(inputs.invoicingVolumeBand).toBeNull();
    expect(inputs.adminHeadcountBand).toBeNull();
    expect(inputs.manualProcesses).toEqual([]);
  });

  test('„Neviem" nie je odpoveď — pásmo zostáva null', () => {
    const answers = [
      { ...answer('cx_ROI03', ''), isUnknown: true },
      { ...answer('ind_02', ''), isUnknown: true },
    ];
    const inputs = extractROIInputs(answers, [], 0);
    expect(inputs.invoicingVolumeBand).toBeNull();
    expect(inputs.employeeCountBand).toBeNull();
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
    }
    // Fakturácia je výnimka: objem je self-reported aj bez označenia procesu.
    const reporting = impact.calculationAudit.find(e => e.process === 'reporting')!;
    expect(reporting.dataSource).toContain('žiadne self-reported dáta');
    const invoicing = impact.calculationAudit.find(e => e.process === 'invoicing')!;
    expect(invoicing.dataSource).toContain('objem faktúr: self-reported');
  });

  test('self-reported procesy sa použijú presne a označia sa ako mix', () => {
    const impact = calculateBusinessImpact([], [], {
      ...baseInputs,
      manualProcesses: ['invoicing', 'hr_onboarding'],
    });

    const processes = impact.calculationAudit.map(e => e.process);
    expect(processes).toEqual(['invoicing', 'hr_onboarding']);
    for (const entry of impact.calculationAudit) {
      expect(entry.dataSource).toContain('self-reported');
    }
  });

  test('sklad, servis a nákup sa mapujú na svoje benchmarky', () => {
    // Tieto tri hodnoty cx_A05 sa volajú inak než ich benchmark, takže sa
    // predtým odfiltrovali — respondent ich označil za ručné a z ROI ticho
    // vypadli, nahradené tromi defaultmi.
    const impact = calculateBusinessImpact([], [], {
      ...baseInputs,
      manualProcesses: ['warehouse', 'service', 'purchasing'],
    });

    const processes = impact.calculationAudit.map(e => e.process);
    expect(processes).toEqual(['inventory_management', 'field_service', 'purchasing']);
    expect(impact.timeSavings.hoursPerYear.mid).toBeGreaterThan(0);
  });

  test('neznáma hodnota procesu sa odfiltruje a nastúpia defaulty', () => {
    const impact = calculateBusinessImpact([], [], {
      ...baseInputs,
      manualProcesses: ['nieco_neexistujuce'],
    });

    const processes = impact.calculationAudit.map(e => e.process);
    expect(processes).toEqual(['invoicing', 'reporting', 'approval_workflows']);
  });
});

describe('calculateBusinessImpact — self-reported vstupy menia výsledok', () => {
  const base = {
    employeeCountBand: 'medium',
    maturityLevel: 1,
    manualProcesses: ['invoicing'],
    adminHeadcountBand: null,
    categoryScoreF: 60,
  };

  test('objem fakturácie hýbe úsporou — dve firmy už nedostanú to isté', () => {
    const maly = calculateBusinessImpact([], [], { ...base, invoicingVolumeBand: 'low' });
    const velky = calculateBusinessImpact([], [], { ...base, invoicingVolumeBand: 'very_high' });
    expect(velky.timeSavings.hoursPerYear.mid).toBeGreaterThan(maly.timeSavings.hoursPerYear.mid * 5);
  });

  test('proces označený za ručný dostane vyšší podiel manuálnej práce', () => {
    const oznaceny = calculateBusinessImpact([], [], {
      ...base, maturityLevel: 3, invoicingVolumeBand: 'medium', manualProcesses: ['invoicing'],
    });
    const neoznaceny = calculateBusinessImpact([], [], {
      ...base, maturityLevel: 3, invoicingVolumeBand: 'medium', manualProcesses: [],
    });
    const entry = (i: typeof oznaceny) => i.calculationAudit.find(e => e.process === 'invoicing')!;
    expect(entry(oznaceny).manualShare).toBeGreaterThan(entry(neoznaceny).manualShare);
    expect(entry(oznaceny).manualShare).toBeGreaterThanOrEqual(0.85);
  });

  test('kapacita administratívy strop znižuje, nikdy nezvyšuje', () => {
    // Veľa procesov + vysoký objem faktúr prekročí kapacitu dvojčlennej
    // administratívy (2 FTE × 1700 h × 0,6 = 2040 h/rok).
    const vela = {
      ...base,
      invoicingVolumeBand: 'very_high',
      manualProcesses: ['invoicing', 'warehouse', 'service', 'purchasing'],
    };
    const bezStropu = calculateBusinessImpact([], [], vela);
    const maloLudi = calculateBusinessImpact([], [], { ...vela, adminHeadcountBand: '1_3' });

    expect(maloLudi.timeSavings.hoursPerYear.mid).toBeLessThan(bezStropu.timeSavings.hoursPerYear.mid);
    expect(maloLudi.disclaimers.some(d => d.includes('zastropovaný'))).toBe(true);

    // Veľký admin tím strop nespustí — kapacita nesmie odhad NAVYŠOVAŤ.
    const velaLudi = calculateBusinessImpact([], [], { ...vela, adminHeadcountBand: '30_plus' });
    expect(velaLudi.timeSavings.hoursPerYear.mid).toBe(bezStropu.timeSavings.hoursPerYear.mid);
  });
});

describe('calculateBusinessImpact — chýbajúca veľkosť firmy', () => {
  const base = {
    employeeCountBand: null,
    maturityLevel: 1,
    manualProcesses: [],
    invoicingVolumeBand: null,
    adminHeadcountBand: null,
    categoryScoreF: 80,
  };

  test('počíta sa ďalej, ale priznane', () => {
    const impact = calculateBusinessImpact([], [], base);
    expect(impact.inputAssumptions!.sizeBandAssumed).toBe(true);
    expect(impact.disclaimers[0]).toContain('Veľkosť firmy nebola uvedená');
    // Dôveryhodnosť je zastropovaná — základ čísla je hádaný.
    expect(impact.financialImpact.confidence).toBeLessThanOrEqual(0.3);
    // Aj pri vysokej governance sa optimistický scenár nezobrazí.
    expect(impact.displayPolicy!.visibleScenarios).not.toContain('optimistic');
  });
});

describe('calculateBusinessImpact — politika scenárov podľa governance', () => {
  const base = {
    employeeCountBand: 'small',
    maturityLevel: 1,
    manualProcesses: [],
    invoicingVolumeBand: null,
    adminHeadcountBand: null,
  };

  test('vysoká governance odomkne optimistický scenár', () => {
    const i = calculateBusinessImpact([], [], { ...base, categoryScoreF: 80 });
    expect(i.displayPolicy!.gate).toBe('high');
    expect(i.displayPolicy!.visibleScenarios).toContain('optimistic');
    expect(i.displayPolicy!.recommendedScenario).toBe('mid');
  });

  test('nízka governance optimistický scenár skryje', () => {
    const i = calculateBusinessImpact([], [], { ...base, categoryScoreF: 30 });
    expect(i.displayPolicy!.gate).toBe('restricted');
    expect(i.displayPolicy!.visibleScenarios).not.toContain('optimistic');
    expect(i.displayPolicy!.recommendedScenario).toBe('conservative');
  });

  test('nemeraná governance sa nesmie tváriť ako nízka ani ako vysoká', () => {
    const i = calculateBusinessImpact([], [], { ...base, categoryScoreF: null });
    expect(i.displayPolicy!.gate).toBe('unmeasured');
    expect(i.displayPolicy!.governanceScoreF).toBeNull();
    expect(i.displayPolicy!.visibleScenarios).not.toContain('optimistic');
  });
});
