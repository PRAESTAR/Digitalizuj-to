'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import QuestionCard from '@/components/quiz/QuestionCard';
import ProgressBar from '@/components/quiz/ProgressBar';
import { getModuleName } from '@/engines/questionEngine';
import ConflictNotice from '@/components/quiz/ConflictNotice';
import { detectAnswerConflicts } from '@/data/answerConflicts';

export default function QuizPage() {
  const router = useRouter();
  const t = useTranslations();
  const { state, submitAnswer, editAnswer, completeQuiz } = useAssessment();
  const { assessment, currentQuestion, progress } = state;

  /**
   * Rekapitulácia rozporov sa ponúka RAZ. Keď respondent povie, že odpovede sú
   * správne, druhýkrát sa ho už nepýtame — inak by sa z ponuky stalo nabádanie
   * doladiť odpovede k lepšiemu číslu.
   */
  const [conflictsDismissed, setConflictsDismissed] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const conflicts = useMemo(
    () => (assessment ? detectAnswerConflicts(assessment.answers, state.questions) : []),
    [assessment, state.questions]
  );
  const showConflicts =
    assessment?.status === 'answered' && conflicts.length > 0 && !conflictsDismissed && !editing;

  // Presmerovanie v efekte, aby sa nemenil stav počas renderu.
  //
  // Poradie vetiev je nosné. `answered` (všetko zodpovedané, výsledok ešte
  // nespočítaný) sa rieši PRVÉ: až tu sa zavolá `completeQuiz`, ktorý výsledok
  // spočíta. Predtým `SUBMIT_ANSWER` nastavil rovno `completed` a výsledok si
  // spočítal sám, takže sa vždy uplatnila vetva s presmerovaním a
  // `completeQuiz` sa nezavolal nikdy.
  useEffect(() => {
    if (!assessment) return;
    if (assessment.status === 'answered') {
      // Kým visí nezodpovedaná ponuka opraviť rozpor, výsledok sa nepočíta.
      if (conflicts.length > 0 && !conflictsDismissed) return;
      completeQuiz();
      return; // presmeruje až ďalší beh, keď je výsledok spočítaný
    }
    if (assessment.status === 'completed' || !currentQuestion) {
      router.push('/results');
    }
  }, [assessment, currentQuestion, completeQuiz, router, conflicts.length, conflictsDismissed]);

  // Redirect if no active assessment
  if (!assessment) {
    return (
      <div className="site-container py-16 text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-2xl">
          ?
        </div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-4">
          {t('quiz.emptyTitle')}
        </h1>
        <p className="text-[#6e6e73] mb-6">
          {t('quiz.emptyText')}
        </p>
        <Link
          href="/"
          className="btn-apple-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold"
        >
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  if (showConflicts) {
    return (
      <ConflictNotice
        conflicts={conflicts}
        onEdit={setEditing}
        onContinue={() => setConflictsDismissed(true)}
      />
    );
  }

  // Oprava jednej odpovede — tá istá karta otázky, len sa uloží cez EDIT_ANSWER,
  // ktorý stav prehrá od začiatku (vetvenie závisí od odpovedí).
  const editedQuestion = editing ? state.questions.find(q => q.id === editing) : undefined;
  if (editedQuestion) {
    return (
      <div className="site-container pt-16 pb-6 sm:pt-8 sm:pb-8">
        <QuestionCard
          key={editedQuestion.id}
          question={editedQuestion}
          onSubmit={(value, isUnknown) => {
            editAnswer(editedQuestion.id, value, isUnknown);
            setEditing(null);
          }}
        />
      </div>
    );
  }

  // Počas dopočítavania výsledku aj počas presmerovania sa nevykresľuje nič.
  if (assessment.status === 'answered' || assessment.status === 'completed' || !currentQuestion) {
    return null;
  }

  const handleSubmit = (value: string | string[], isUnknown: boolean) => {
    submitAnswer(currentQuestion.id, value, isUnknown);
  };

  const moduleName = assessment.type === 'complex'
    ? getModuleName(currentQuestion.id)
    : undefined;

  const quizTitle = assessment.type === 'indicative'
    ? t('quizSelector.indicative.title')
    : t('quizSelector.complex.title');

  return (
    <div className="site-container pt-16 pb-6 sm:pt-8 sm:pb-8">
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
            {t('quiz.localNotice')}
          </span>
        </div>
      </div>
    </div>
  );
}
