'use client';

import { useState } from 'react';
import type { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  onSubmit: (value: string | string[], isUnknown: boolean) => void;
}

export default function QuestionCard({ question, onSubmit }: QuestionCardProps) {
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
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 relative overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {question.question_sk}
            </h2>
            {question.tooltip && (
              <div className="relative">
                <button
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold hover:bg-indigo-200 transition-colors"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                >
                  ?
                </button>
                {showTooltip && (
                  <div className="absolute right-0 top-9 w-72 p-4 bg-slate-800 text-white text-sm rounded-2xl shadow-xl z-10 animate-scale-in">
                    <div className="absolute -top-1.5 right-3 w-3 h-3 bg-slate-800 rotate-45" />
                    {question.tooltip}
                  </div>
                )}
              </div>
            )}
          </div>
          {question.question_type === 'multi_select' && (
            <p className="text-sm text-indigo-500 mt-2 font-medium">Vyberte všetky, ktoré platia</p>
          )}
        </div>

        <div className="space-y-2.5 stagger-children">
          {question.options?.map((option, idx) => {
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
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md shadow-indigo-500/10 scale-[1.01]'
                    : 'border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-${isMulti ? 'lg' : 'full'} border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500 scale-110'
                      : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          {question.allow_unknown ? (
            <button
              onClick={handleUnknown}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 group"
            >
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Neviem / Preskočiť
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`px-8 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${
              isSubmitDisabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-100'
            }`}
          >
            Pokračovať
          </button>
        </div>
      </div>
    </div>
  );
}
