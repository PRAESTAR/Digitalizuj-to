'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import TurnstileGate from '@/components/ui/TurnstileGate';
import type { AssessmentType } from '@/types';

/**
 * Výber diagnostiky. Texty idú z messages/*.json (quizSelector.*) — dlho tu
 * boli natvrdo po slovensky, hoci kľúče existovali od začiatku i18n.
 *
 * Router je z @/i18n/navigation, NIE z next/navigation: obyčajný push('/quiz')
 * ignoroval jazyk a v statickom exporte (bez middlewaru) by nemeckého
 * používateľa poslal cez legacy 301 na /sk/quiz. Locale-aware router pushne
 * /de/quiz.
 */
export default function QuizSelector() {
  const t = useTranslations('quizSelector');
  const router = useRouter();
  const { startQuiz } = useAssessment();

  /**
   * Kvíz sa nespustí priamo — najprv Turnstile. Zvolený typ čaká v stave a
   * `startQuiz` sa zavolá až po ÚSPEŠNOM SERVEROVOM overení tokenu, takže
   * obídenie klientskeho callbacku nič nezískava.
   */
  const [pending, setPending] = useState<AssessmentType | null>(null);

  const handleSelect = (type: AssessmentType) => setPending(type);

  const startVerified = () => {
    if (!pending) return;
    startQuiz(pending);
    setPending(null);
    router.push('/quiz');
  };

  const check = (
    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">
      &#10003;
    </span>
  );
  const arrow = (
    <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 max-w-4xl mx-auto">
      {/* Indicative */}
      <button
        onClick={() => handleSelect('indicative')}
        className="group text-left p-6 sm:p-8 rounded-3xl bg-white border border-black/5 hover-lift card-shine transition-all relative overflow-hidden"
      >
        <div className="relative">
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <span className="flex flex-shrink-0 items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1d1d1f]/[0.05] font-bold text-lg sm:text-xl">
              <span className="text-gradient-aurora">15</span>
            </span>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-[#1d1d1f] break-words">
                {t('indicative.title')}
              </h3>
              <span className="mt-1 inline-block text-xs text-[#0068d6] font-medium bg-[#0068d6]/5 px-2 py-0.5 rounded-full">
                {t('indicative.duration')}
              </span>
            </div>
          </div>
          <p className="text-[#6e6e73] mb-5">{t('indicative.description')}</p>
          <ul className="space-y-2.5 text-sm text-[#6e6e73] mb-6">
            <li className="flex items-center gap-2">{check}{t('indicative.bullet1')}</li>
            <li className="flex items-center gap-2">{check}{t('indicative.bullet2')}</li>
            <li className="flex items-center gap-2">{check}{t('indicative.bullet3')}</li>
          </ul>
          <div className="flex items-center gap-2 text-[#0068d6] font-semibold group-hover:gap-3 transition-all">
            {t('indicative.cta')}
            {arrow}
          </div>
        </div>
      </button>

      {/* Complex */}
      <button
        onClick={() => handleSelect('complex')}
        className="group text-left p-6 sm:p-8 rounded-3xl bg-white border border-black/5 hover-lift card-shine transition-all relative overflow-hidden"
      >
        {/* Na úzkom displeji je odznak v toku nad hlavičkou — absolútne
            umiestnený vpravo hore sa prekrýval so začiatkom nadpisu karty. */}
        <span className="relative z-10 mb-4 inline-flex px-3 py-1 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] text-xs font-bold sm:absolute sm:top-4 sm:right-4 sm:mb-0">
          {t('recommended')}
        </span>
        <div className="relative">
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <span className="flex flex-shrink-0 items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1d1d1f]/[0.05] font-bold text-lg sm:text-xl">
              <span className="text-gradient-aurora">43+</span>
            </span>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-[#1d1d1f] break-words">
                {t('complex.title')}
              </h3>
              <span className="mt-1 inline-block text-xs text-[#0068d6] font-medium bg-[#0068d6]/5 px-2 py-0.5 rounded-full">
                {t('complex.duration')}
              </span>
            </div>
          </div>
          <p className="text-[#6e6e73] mb-5">{t('complex.description')}</p>
          <ul className="space-y-2.5 text-sm text-[#6e6e73] mb-6">
            <li className="flex items-center gap-2">{check}{t('complex.bullet1')}</li>
            <li className="flex items-center gap-2">{check}{t('complex.bullet2')}</li>
            <li className="flex items-center gap-2">{check}{t('complex.bullet3')}</li>
          </ul>
          <div className="flex items-center gap-2 text-[#0068d6] font-semibold group-hover:gap-3 transition-all">
            {t('complex.cta')}
            {arrow}
          </div>
        </div>
      </button>

      <TurnstileGate
        open={pending !== null}
        action="quiz_start"
        onVerified={startVerified}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
