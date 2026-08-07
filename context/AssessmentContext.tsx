'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useLocale } from 'next-intl';
import type { Assessment, AssessmentType, Answer, ResultSnapshot, Question, ModelVersionInfo } from '@/types';
import {
  getQuizQuestions,
  getNextQuestion,
  evaluateBranching,
  calculateAnswerScore,
  getProgress,
} from '@/engines/questionEngine';
import { calculateDII, calculateORS } from '@/engines/scoringEngine';
import { calculateTDRI } from '@/engines/riskEngine';
import { calculateAIReadiness } from '@/engines/aiReadinessEngine';
import { calculateBusinessImpact, extractROIInputs } from '@/engines/roiEngine';
import { calculateBenchmarks } from '@/engines/benchmarkEngine';
import { marketForLocale, type Market } from '@/lib/market';
import { generateRecommendations } from '@/engines/recommendationEngine';
import { scoringConfig } from '@/data/scoringConfig';
import { benchmarkData } from '@/data/benchmarkData';
import questionBankJson from '@/data/questionBank.json';

// State
interface AssessmentState {
  assessment: Assessment | null;
  questions: Question[];
  currentQuestion: Question | null;
  progress: { current: number; total: number; percentage: number };
}

const initialState: AssessmentState = {
  assessment: null,
  questions: [],
  currentQuestion: null,
  progress: { current: 0, total: 0, percentage: 0 },
};

// Actions
type Action =
  | { type: 'START_QUIZ'; quizType: AssessmentType }
  | { type: 'SUBMIT_ANSWER'; questionId: string; value: string | string[]; isUnknown: boolean; market: Market }
  | { type: 'COMPLETE_QUIZ'; market: Market }
  | { type: 'RESET' };

function reducer(state: AssessmentState, action: Action): AssessmentState {
  switch (action.type) {
    case 'START_QUIZ': {
      const questions = getQuizQuestions(action.quizType);
      const skipped = new Set<string>();
      const assessment: Assessment = {
        id: crypto.randomUUID(),
        type: action.quizType,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        respondent: { sector: '', employeeCountBand: '' },
        answers: [],
        currentQuestionIndex: 0,
        skippedQuestions: skipped,
        riskFlags: new Set<string>(),
      };

      const currentQuestion = getNextQuestion(questions, [], skipped);
      const progress = getProgress(questions, [], skipped);

      return { assessment, questions, currentQuestion, progress };
    }

    case 'SUBMIT_ANSWER': {
      if (!state.assessment) return state;

      const question = state.questions.find(q => q.id === action.questionId);
      if (!question) return state;

      const score = action.isUnknown ? 0 : calculateAnswerScore(question, action.value);

      const answer: Answer = {
        questionId: action.questionId,
        value: action.value,
        score,
        isUnknown: action.isUnknown,
        wasSkipped: false,
        timestamp: new Date().toISOString(),
      };

      const newAnswers = [...state.assessment.answers, answer];
      const newSkipped = new Set(state.assessment.skippedQuestions);
      const newRiskFlags = new Set(state.assessment.riskFlags);

      // Vetvenie sa vyhodnocuje aj pri „Neviem" — pravidlo si samo určuje,
      // či sa vtedy uplatní (on_unknown). Predtým sa preskakovalo celé, takže
      // respondent, ktorý priznal nevedomosť, dostal najviac otázok.
      const branchResult = evaluateBranching(question, answer);
      branchResult.riskFlags.forEach(id => newRiskFlags.add(id));
      // 'include' targets are NOT skipped (they stay in the question list)

      // Preskočená otázka sa materializuje ako syntetická odpoveď s
      // `wasSkipped`. Bez toho sa nedalo odlíšiť „Neviem" od „nikdy sme sa
      // nespýtali" — obe vyzerali ako chýbajúca odpoveď a miešali sa do
      // ukazovateľa spoľahlivosti kategórie.
      for (const { target, reason } of branchResult.skip) {
        if (newSkipped.has(target) || newAnswers.some(a => a.questionId === target)) continue;
        newSkipped.add(target);
        newAnswers.push({
          questionId: target,
          value: '',
          score: 0,
          isUnknown: false,
          wasSkipped: true,
          skipReason: `${question.id}: ${reason}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Update respondent from meta questions
      const respondent = { ...state.assessment.respondent };
      if (question.maps_to_score.includes('benchmark_sector') && typeof action.value === 'string') {
        respondent.sector = action.value;
      }
      if (question.maps_to_score.includes('benchmark_size') && typeof action.value === 'string') {
        respondent.employeeCountBand = action.value as Assessment['respondent']['employeeCountBand'];
      }

      const newAssessment: Assessment = {
        ...state.assessment,
        answers: newAnswers,
        skippedQuestions: newSkipped,
        riskFlags: newRiskFlags,
        respondent,
      };

      const currentQuestion = getNextQuestion(state.questions, newAnswers, newSkipped);
      const progress = getProgress(state.questions, newAnswers, newSkipped);

      // Auto-complete if no more questions
      if (!currentQuestion) {
        newAssessment.status = 'completed';
        newAssessment.completedAt = new Date().toISOString();
        newAssessment.result = computeResult(newAssessment, state.questions, action.market);
      }

      return {
        ...state,
        assessment: newAssessment,
        currentQuestion,
        progress,
      };
    }

    case 'COMPLETE_QUIZ': {
      if (!state.assessment) return state;
      const completed: Assessment = {
        ...state.assessment,
        status: 'completed',
        completedAt: new Date().toISOString(),
        result: computeResult(state.assessment, state.questions, action.market),
      };
      return { ...state, assessment: completed, currentQuestion: null };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/**
 * Trh referenčných čísel (SK/CZ/EU27) sa odovzdáva v akcii, nie cez modulovú
 * premennú.
 *
 * Dovtedy tu bolo `let activeMarket`, ktoré provider prepisoval PRIAMO POČAS
 * RENDERU. To je nebezpečné aj mimo súbežného renderovania: React smie render
 * zahodiť alebo zopakovať, ale zápis do modulovej premennej prežije — hodnota
 * potom pochádza z renderu, ktorý sa nikdy nezobrazil. Zároveň je to jediná
 * inštancia na celý modul, takže dva providery (alebo dva jazyky v jednom
 * procese pri generovaní statického exportu) si ju prepisujú navzájom.
 *
 * Parameter v akcii to rieši bez ďalšieho stavu: provider pozná locale
 * v momente dispatchu a reducer dostane presne tú hodnotu, ktorá k danému
 * dokončeniu kvízu patrí.
 */
function computeResult(assessment: Assessment, questions: Question[], market: Market): ResultSnapshot {
  const { answers, respondent, riskFlags } = assessment;

  // Pásmo veľkosti sa NEDOPĹŇA: prázdna odpoveď znamená, že sa skóre
  // neprepočítava (scoringEngine.sizeAdjustedScore). Benchmark nižšie si
  // náhradnú hodnotu dosadiť smie — tam ide o porovnanie, nie o skóre firmy.
  const sizeBand = respondent.employeeCountBand || null;

  const dii = calculateDII(answers, questions);
  const ors = calculateORS(answers, questions, sizeBand);
  const tdri = calculateTDRI(answers, questions, riskFlags);
  const aiReadiness = calculateAIReadiness(answers, questions);

  // null = F nemerané (nie 0!) — roiEngine potom governance disclaimer preskočí
  const roiInputs = extractROIInputs(answers, questions, ors.categories['F']?.score ?? null);
  const businessImpact = calculateBusinessImpact(answers, questions, roiInputs);

  const benchmarks = calculateBenchmarks(
    dii, ors,
    respondent.sector || 'other',
    respondent.employeeCountBand || 'small',
    market
  );

  const recommendations = generateRecommendations(answers, questions, ors, tdri, dii, aiReadiness);

  const modelVersion: ModelVersionInfo = {
    questionBankVersion: questionBankJson.version || '1.0-MVP',
    scoringConfigVersion: scoringConfig.version,
    benchmarkDataVersion: benchmarkData.version,
    diiMethodologyVersion: scoringConfig.diiMethodologyVersion,
    computedAt: new Date().toISOString(),
  };

  return {
    assessmentId: assessment.id,
    modelVersion,
    dii,
    ors,
    tdri,
    aiReadiness,
    businessImpact,
    benchmarks,
    recommendations,
  };
}

// Context
interface AssessmentContextValue {
  state: AssessmentState;
  startQuiz: (type: AssessmentType) => void;
  submitAnswer: (questionId: string, value: string | string[], isUnknown?: boolean) => void;
  completeQuiz: () => void;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Trh referenčných čísel sleduje jazykovú mutáciu (sk→SK, cs→CZ, en→EU27).
  // Odvodzuje sa počas renderu, ale nikam sa nezapisuje — do reducera ide
  // až v payloade akcie.
  const locale = useLocale();
  const market = marketForLocale(locale);

  const startQuiz = useCallback((type: AssessmentType) => {
    dispatch({ type: 'START_QUIZ', quizType: type });
  }, []);

  const submitAnswer = useCallback((questionId: string, value: string | string[], isUnknown = false) => {
    // Trh ide v akcii aj sem: posledná odpoveď kvíz automaticky dokončí,
    // takže tento dispatch tiež spúšťa výpočet výsledku.
    dispatch({ type: 'SUBMIT_ANSWER', questionId, value, isUnknown, market });
  }, [market]);

  const completeQuiz = useCallback(() => {
    dispatch({ type: 'COMPLETE_QUIZ', market });
  }, [market]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AssessmentContext.Provider value={{ state, startQuiz, submitAnswer, completeQuiz, reset }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
