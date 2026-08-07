'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useLocale } from 'next-intl';
import type { Assessment, AssessmentType, ResultSnapshot, Question, ModelVersionInfo } from '@/types';
import { getQuizQuestions, getNextQuestion, getProgress } from '@/engines/questionEngine';
import { applyAnswer, replayAnswers } from '@/engines/quizState';
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
  | { type: 'EDIT_ANSWER'; questionId: string; value: string | string[]; isUnknown: boolean }
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
      if (!state.questions.some(q => q.id === action.questionId)) return state;

      // Rovnaká funkcia, akú používa prehratie pri EDIT_ANSWER — aby sa stav
      // po oprave odpovede nemohol rozísť so stavom z čerstvého behu.
      const acc = {
        answers: [...state.assessment.answers],
        skipped: new Set(state.assessment.skippedQuestions),
        riskFlags: new Set(state.assessment.riskFlags),
        respondent: { ...state.assessment.respondent },
      };
      applyAnswer(
        { questionId: action.questionId, value: action.value, isUnknown: action.isUnknown },
        state.questions,
        acc,
        new Date().toISOString()
      );

      const newAnswers = acc.answers;
      const newSkipped = acc.skipped;
      const newAssessment: Assessment = {
        ...state.assessment,
        answers: newAnswers,
        skippedQuestions: newSkipped,
        riskFlags: acc.riskFlags,
        respondent: acc.respondent,
      };

      const currentQuestion = getNextQuestion(state.questions, newAnswers, newSkipped);
      const progress = getProgress(state.questions, newAnswers, newSkipped);

      // Posledná odpoveď kvíz NEDOKONČÍ. Prejde do medzistavu `answered`:
      // otázky sú zodpovedané, výsledok ešte nie je spočítaný.
      //
      // Do 7. 8. 2026 tu bolo `status = 'completed'` plus rovno
      // `computeResult`. Efekt v `quiz/page.tsx` potom vždy trafil prvú vetvu
      // (`status === 'completed'` → presmeruj) a `COMPLETE_QUIZ` sa v celom
      // normálnom toku nezavolala ani raz — bola to mŕtva vetva reducera.
      // Dôsledok nie je len kozmetický: medzi poslednou odpoveďou a výsledkom
      // neexistoval okamih, do ktorého by sa dalo čokoľvek vložiť — ani
      // rekapitulácia, ani ponuka opravy odpovede.
      if (!currentQuestion) {
        newAssessment.status = 'answered';
      }

      return {
        ...state,
        assessment: newAssessment,
        currentQuestion,
        progress,
      };
    }

    /**
     * Oprava už zodpovedanej otázky.
     *
     * Odpovede boli do 7. 8. 2026 append-only: respondent sa nemal ako vrátiť,
     * takže preklep alebo zle prečítaná otázka ostali vo výsledku natrvalo.
     * S kontrolou rozporov (`data/answerConflicts.ts`) by to bolo obzvlášť
     * zlé — nástroj by rozpor ukázal a neponúkol nič, čím ho odstrániť.
     *
     * Stav sa NEUPRAVUJE na mieste, ale PREHRÁVA od začiatku. Vetvenie je
     * závislé od odpovedí: zmena `cx_02` z `medium` na `micro` má odskočiť
     * `cx_E08_nis2`, zmena späť ho má vrátiť. Rovnako `riskFlags`, ktoré
     * pôvodná odpoveď nastavila, aj `respondent` (sektor a veľkosť poháňajú
     * veľkostné kotvy, výber benchmarku aj NIS2 vetvu). Ktorúkoľvek z tých
     * vecí by inkrementálna úprava zabudla vrátiť späť.
     *
     * Prehráva sa v pôvodnom poradí odpovedí; syntetické `wasSkipped` záznamy
     * sa zahadzujú a vznikajú nanovo z prehratého vetvenia.
     */
    case 'EDIT_ANSWER': {
      if (!state.assessment) return state;
      const edited = state.questions.find(q => q.id === action.questionId);
      if (!edited) return state;
      // Upraviť sa dá len otázka, na ktorú respondent reálne odpovedal.
      const existing = state.assessment.answers.find(
        a => a.questionId === action.questionId && !a.wasSkipped
      );
      if (!existing) return state;

      const replayInputs = state.assessment.answers
        .filter(a => !a.wasSkipped)
        .map(a => a.questionId === action.questionId
          ? { questionId: a.questionId, value: action.value, isUnknown: action.isUnknown }
          : { questionId: a.questionId, value: a.value, isUnknown: a.isUnknown });

      const replayed = replayAnswers(replayInputs, state.questions);
      const currentQuestion = getNextQuestion(state.questions, replayed.answers, replayed.skipped);

      return {
        ...state,
        assessment: {
          ...state.assessment,
          answers: replayed.answers,
          skippedQuestions: replayed.skipped,
          riskFlags: replayed.riskFlags,
          respondent: replayed.respondent,
          // Výsledok po oprave neplatí; prepočíta sa až cez COMPLETE_QUIZ.
          status: currentQuestion ? 'in_progress' : 'answered',
          result: undefined,
          completedAt: undefined,
        },
        currentQuestion,
        progress: getProgress(state.questions, replayed.answers, replayed.skipped),
      };
    }

    case 'COMPLETE_QUIZ': {
      if (!state.assessment) return state;
      // Idempotentné: druhé zavolanie výsledok neprepočíta. Efekt v React 18+
      // môže v StrictMode bežať dvakrát a `computeResult` razí `computedAt`,
      // takže druhý beh by ticho vyrobil iný snapshot toho istého kvízu.
      if (state.assessment.status === 'completed') return state;
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
  /** Oprava už zodpovedanej otázky — stav sa prehrá od začiatku (viď EDIT_ANSWER). */
  editAnswer: (questionId: string, value: string | string[], isUnknown?: boolean) => void;
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

  const editAnswer = useCallback((questionId: string, value: string | string[], isUnknown = false) => {
    dispatch({ type: 'EDIT_ANSWER', questionId, value, isUnknown });
  }, []);

  const completeQuiz = useCallback(() => {
    dispatch({ type: 'COMPLETE_QUIZ', market });
  }, [market]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AssessmentContext.Provider value={{ state, startQuiz, submitAnswer, editAnswer, completeQuiz, reset }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
