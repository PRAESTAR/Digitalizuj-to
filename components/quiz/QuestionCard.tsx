'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  onSubmit: (value: string | string[], isUnknown: boolean) => void;
}

export default function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const t = useTranslations('quiz');
  const [selected, setSelected] = useState<string | string[]>(
    question.question_type === 'multi_select' ? [] : ''
  );
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSingleSelect = (value: string) => {
    setSelected(value);
  };

  const handleMultiSelect = (value: string) => {
    setSelected(prev => {
      if (!Array.isArray(prev)) return [value];
      if (value === 'none') return ['none'];
      const filtered = prev.filter(v => v !== 'none');
      return filtered.includes(value)
        ? filtered.filter(v => v !== value)
        : [...filtered, value];
    });
  };

  const handleSubmit = () => {
    if (question.question_type === 'multi_select') {
      const arr = Array.isArray(selected) ? selected : [selected];
      if (arr.length === 0) return;
      onSubmit(arr, false);
    } else {
      if (!selected || selected === '') return;
      onSubmit(selected as string, false);
    }
    setSelected(question.question_type === 'multi_select' ? [] : '');
  };

  const handleUnknown = () => {
    onSubmit(question.question_type === 'multi_select' ? [] : '', true);
    setSelected(question.question_type === 'multi_select' ? [] : '');
  };

  const isSubmitDisabled = question.question_type === 'multi_select'
    ? !Array.isArray(selected) || selected.length === 0
    : !selected || selected === '';

  return (
    <div className="animate-fade-in-up">
      {/* Padding rastie až s displejom — pri 320 px a zväčšenom texte ukrajovalo
          pevných p-8 (2rem) z oboch strán viac miesta, než koľko zostalo na text. */}
      <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#1d1d1f]/10" />

        {/* relative kvôli tooltipu, ktorý sa od sm: kotví k celej hlavičke,
            nie k úzkemu stĺpcu tlačidla „?" */}
        <div className="mb-6 relative">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#1d1d1f] leading-tight min-w-0 break-words">
              {question.question_sk}
            </h2>
            {question.tooltip && (
              /* Dotyková plocha 44x44 (WCAG 2.5.8); vizuálny krúžok zostáva 28 px
                 vo vnorenom span, záporné okraje držia pôvodné optické zarovnanie. */
              <button
                type="button"
                aria-expanded={showTooltip}
                aria-label={t('tooltipLabel')}
                className="group/help flex-shrink-0 -mr-2 -mt-2 w-11 h-11 flex items-center justify-center rounded-full"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
              >
                <span
                  aria-hidden="true"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] text-xs font-bold transition-colors group-hover/help:bg-[#1d1d1f]/12"
                >
                  ?
                </span>
              </button>
            )}
          </div>
          {question.tooltip && showTooltip && (
            /* Na mobile blok v toku pod nadpisom — pevných w-72 (288 px) kotvených
               vpravo pretekalo pri 320 px mimo karty a text sa orezal. */
            <div className="relative mt-3 w-full p-4 bg-[#1d1d1f] text-white text-sm rounded-2xl shadow-xl z-10 animate-scale-in sm:absolute sm:right-0 sm:top-11 sm:mt-0 sm:w-72">
              <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[#1d1d1f] rotate-45" />
              {question.tooltip}
            </div>
          )}
          {question.question_type === 'multi_select' && (
            <p className="text-sm text-[#6e6e73] mt-2 font-medium">{t('multiSelectHint')}</p>
          )}
        </div>

        <div className="space-y-2.5 stagger-children">
          {question.options?.map((option) => {
            const isMulti = question.question_type === 'multi_select';
            const isSelected = isMulti
              ? Array.isArray(selected) && selected.includes(option.value)
              : selected === option.value;

            return (
              <button
                key={option.value}
                onClick={() => isMulti ? handleMultiSelect(option.value) : handleSingleSelect(option.value)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-[#0068d6] bg-[#0068d6]/5 text-[#1d1d1f] shadow-sm'
                    : 'border-black/5 bg-white text-[#1d1d1f] hover:border-black/10 hover:bg-black/[0.02] hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Trieda sa musí uviesť celá — Tailwind skenuje zdroj ako
                      text, takže `rounded-${'${'}...}` by nikdy nevygeneroval.
                      Doteraz to fungovalo len náhodou, lebo rounded-lg aj
                      rounded-full pribudli do buildu z iných komponentov. */}
                  <div className={`w-6 h-6 ${isMulti ? 'rounded-lg' : 'rounded-full'} border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#0068d6] bg-[#0068d6]'
                      : 'border-black/10'
                  }`}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium min-w-0 break-words">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* flex-col-reverse drží primárne CTA hore aj v stĺpcovom režime — vedľa
            seba sa obe tlačidlá pri 320 px a zväčšenom texte nezmestili a
            „Pokračovať" sa orezalo o okraj karty. */}
        <div className="flex flex-col-reverse gap-3 mt-8 pt-6 border-t border-black/5 sm:flex-row sm:items-center sm:justify-between">
          {question.allow_unknown ? (
            <button
              type="button"
              onClick={handleUnknown}
              className="w-full sm:w-auto min-h-11 px-3 sm:-ml-3 rounded-full text-sm text-[#86868b] hover:text-[#6e6e73] transition-colors inline-flex items-center justify-center sm:justify-start gap-1.5"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {t('skip')}
            </button>
          ) : (
            /* Prázdna výplň má zmysel len pri justify-between na širokom displeji;
               v stĺpci by pridala zbytočnú medzeru. */
            <div className="hidden sm:block" />
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold transition-all duration-200 ${
              isSubmitDisabled
                ? 'bg-[#1d1d1f]/5 text-[#86868b] cursor-not-allowed'
                : 'btn-apple-primary text-white'
            }`}
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
