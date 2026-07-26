'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';
import QuestionCard from '@/components/quiz/QuestionCard';
import ProgressBar from '@/components/quiz/ProgressBar';
import { getModuleName } from '@/engines/questionEngine';

export default function QuizPage() {
  const router = useRouter();
  const { state, submitAnswer, completeQuiz } = useAssessment();
  const { assessment, currentQuestion, progress } = state;

  // Handle redirects in useEffect to avoid setState-during-render
  useEffect(() => {
    if (assessment?.status === 'completed') {
      router.push('/results');
    } else if (assessment && !currentQuestion) {
      completeQuiz();
      router.push('/results');
    }
  }, [assessment, currentQuestion, completeQuiz, router]);

  // Redirect if no active assessment
  if (!assessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-2xl">
          ?
        </div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-4">
          Žiadne aktívne hodnotenie
        </h1>
        <p className="text-[#6e6e73] mb-6">
          Najprv si vyberte typ hodnotenia na hlavnej stránke.
        </p>
        <Link
          href="/"
          className="btn-apple-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold"
        >
          Späť na úvod
        </Link>
      </div>
    );
  }

  // Show nothing while redirecting
  if (assessment.status === 'completed' || !currentQuestion) {
    return null;
  }

  const handleSubmit = (value: string | string[], isUnknown: boolean) => {
    submitAnswer(currentQuestion.id, value, isUnknown);
  };

  const moduleName = assessment.type === 'complex'
    ? getModuleName(currentQuestion.id)
    : undefined;

  const quizTitle = assessment.type === 'indicative'
    ? 'Indikatívny kvíz'
    : 'Komplexná diagnostika';

  return (
    <div className="max-w-3xl mx-auto px-4 pt-16 pb-6 sm:pt-8 sm:pb-8">
      {/* Quiz header */}
      <div className="mb-6 animate-fade-in-up flex items-center gap-3">
        {/* shrink-0 — bez neho sa ikona pri dlhom názve a zväčšenom texte
            stlačí na elipsu namiesto toho, aby sa zalomil nadpis. */}
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-base sm:text-lg font-bold text-[#1d1d1f] min-w-0 break-words">{quizTitle}</h1>
      </div>

      <ProgressBar
        current={progress.current}
        total={progress.total}
        percentage={progress.percentage}
        moduleName={moduleName}
      />

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onSubmit={handleSubmit}
      />

      <div className="mt-8 text-center animate-fade-in">
        {/* Text sa na mobile zalomí do viacerých riadkov, preto rounded-2xl a
            zarovnanie vľavo; bodka potrebuje flex-shrink-0, inak ju zalomený
            text stlačí na nulovú šírku. */}
        <div className="inline-flex items-start sm:items-center gap-2 px-4 py-2 rounded-2xl sm:rounded-full bg-white border border-black/5 text-left">
          <span className="w-2 h-2 mt-1 sm:mt-0 flex-shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-[#6e6e73] font-medium">
            Vaše odpovede sa spracovávajú lokálne. Žiadne dáta sa neodosielajú na server.
          </span>
        </div>
      </div>
    </div>
  );
}
