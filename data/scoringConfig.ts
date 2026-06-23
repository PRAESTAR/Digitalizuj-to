import type { ScoringConfig } from '@/types';

export const scoringConfig: ScoringConfig = {
  version: '1.1-MVP',
  diiMethodologyVersion: 'DII v3 (Eurostat 2023, isoc_e_dii)',
  categoryWeights: {
    A: 0.20,
    B: 0.20,
    C: 0.15,
    D: 0.15,
    E: 0.20,
    F: 0.10,
  },
  maturityThresholds: [20, 40, 60, 80],
  riskThresholds: [15, 35, 60],
  securityPenaltyThreshold: 30,
  securityPenaltyMaxFactor: 0.30,
  unknownAnswerExclusionThreshold: 0.50,
  pilotCriteria: {
    cronbachAlphaMin: 0.80,
    completionRateMin: 0.85,
    unknownAnswerRateMax: 0.10,
    orsToCorrelationMin: 0.50,
    minPilotSampleSize: 200,
    itemDiscriminationMin: 0.30,
  },
};

export const maturityLabels: Record<number, string> = {
  0: 'Digitálny nováčik',
  1: 'Začiatočník',
  2: 'Rozvíjajúci sa',
  3: 'Pokročilý',
  4: 'Digitálny líder',
};

export const diiLevelLabels: Record<string, string> = {
  very_low: 'Veľmi nízka digitálna intenzita',
  low: 'Nízka digitálna intenzita',
  high: 'Vysoká digitálna intenzita',
  very_high: 'Veľmi vysoká digitálna intenzita',
};

export const riskLevelLabels: Record<string, string> = {
  low: 'Dobre riadené',
  medium: 'Vyžaduje pozornosť',
  high: 'Vyžaduje okamžitú akciu',
  critical: 'Ohrozenie prevádzky',
};

export const categoryNames: Record<string, string> = {
  A: 'Procesy a digitalizácia práce',
  B: 'Systémy a integrácie',
  C: 'Dáta a reporting',
  D: 'Infraštruktúra a cloud',
  E: 'Bezpečnosť a technologický dlh',
  F: 'Governance a ľudia',
};

export const riskFactorDefinitions = [
  { id: 'RF01', name: 'Out-of-support core OS/DB', maxPenalty: 15, severity: 'critical' as const },
  { id: 'RF02', name: 'Chýbajúce zálohy core dát', maxPenalty: 15, severity: 'critical' as const },
  { id: 'RF03', name: 'Zálohy existujú, ale netestované', maxPenalty: 8, severity: 'high' as const },
  { id: 'RF04', name: 'Chýbajúci patch management', maxPenalty: 10, severity: 'critical' as const },
  { id: 'RF05', name: 'Absencia MFA na kritických systémoch', maxPenalty: 10, severity: 'critical' as const },
  { id: 'RF06', name: 'Single point of failure (infraštruktúra)', maxPenalty: 8, severity: 'high' as const },
  { id: 'RF07', name: 'Single point of failure (ľudia)', maxPenalty: 8, severity: 'high' as const },
  { id: 'RF08', name: 'Nezdokumentované/neowned systémy', maxPenalty: 5, severity: 'medium' as const },
  { id: 'RF09', name: 'Žiadny BC/DR plán', maxPenalty: 7, severity: 'high' as const },
  { id: 'RF10', name: 'Žiadny asset inventory', maxPenalty: 4, severity: 'medium' as const },
  { id: 'RF11', name: 'Žiadne logovanie/monitoring', maxPenalty: 5, severity: 'medium' as const },
  { id: 'RF12', name: 'Out-of-support aplikácie (nie core)', maxPenalty: 5, severity: 'medium' as const },
];

export const hourlyCostMap: Record<string, number> = {
  low: 12,
  medium: 20,
  high: 35,
  very_high: 55,
};

export const processBenchmarks: Record<string, {
  frequencyPerMonth: Record<string, number>;
  timePerUnitMinutes: number;
  automatableShare: number;
  errorRate: number;
  reworkMinutesPerError: number;
  exceptionRate: number;
}> = {
  invoicing: {
    frequencyPerMonth: { micro: 20, small: 50, medium: 200, large: 500 },
    timePerUnitMinutes: 15,
    automatableShare: 0.70,
    errorRate: 0.05,
    reworkMinutesPerError: 25,
    exceptionRate: 0.08,
  },
  reporting: {
    frequencyPerMonth: { micro: 2, small: 4, medium: 12, large: 30 },
    timePerUnitMinutes: 60,
    automatableShare: 0.80,
    errorRate: 0.08,
    reworkMinutesPerError: 45,
    exceptionRate: 0.05,
  },
  approval_workflows: {
    frequencyPerMonth: { micro: 10, small: 20, medium: 60, large: 150 },
    timePerUnitMinutes: 30,
    automatableShare: 0.75,
    errorRate: 0.02,
    reworkMinutesPerError: 20,
    exceptionRate: 0.10,
  },
  order_processing: {
    frequencyPerMonth: { micro: 15, small: 30, medium: 150, large: 400 },
    timePerUnitMinutes: 20,
    automatableShare: 0.60,
    errorRate: 0.03,
    reworkMinutesPerError: 30,
    exceptionRate: 0.07,
  },
  hr_onboarding: {
    frequencyPerMonth: { micro: 0.5, small: 1, medium: 4, large: 10 },
    timePerUnitMinutes: 480,
    automatableShare: 0.40,
    errorRate: 0.10,
    reworkMinutesPerError: 120,
    exceptionRate: 0.15,
  },
};

export const manualShareFromMaturity: Record<number, number> = {
  0: 0.90,
  1: 0.65,
  2: 0.40,
  3: 0.15,
  4: 0.05,
};
