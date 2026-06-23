'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/30">
          ?
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">
          Žiadne aktívne hodnotenie
        </h1>
        <p className="text-slate-600 mb-6">
          Najprv si vyberte typ hodnotenia na hlavnej stránke.
        </p>
        <a
          href="/"
          className="inline-flex px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          Späť na úvod
        </a>
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Quiz header */}
      <div className="mb-6 animate-fade-in-up flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-lg font-black text-slate-800">{quizTitle}</h1>
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">
            Vaše odpovede sa spracovávajú lokálne. Žiadne dáta sa neodosielajú na server.
          </span>
        </div>
      </div>
    </div>
  );
}
