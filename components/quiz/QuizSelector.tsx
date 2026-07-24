'use client';

import type { AssessmentType } from '@/types';

interface QuizSelectorProps {
  onSelect: (type: AssessmentType) => void;
}

export default function QuizSelector({ onSelect }: QuizSelectorProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
      {/* Indicative */}
      <button
        onClick={() => onSelect('indicative')}
        className="group text-left p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-blue-400 hover-lift card-shine transition-all relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-5">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-card-blue text-white font-black text-xl shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
              15
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Indikatívny kvíz
              </h3>
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                5-7 minút
              </span>
            </div>
          </div>
          <p className="text-slate-600 mb-5">
            Rýchly screening digitálnej zrelosti. Orientačný výsledok s hlavnými odporúčaniami.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-500 mb-6">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">&#10003;</span>
              Max. 15 otázok
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">&#10003;</span>
              Orientačné skóre digitalizácie
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">&#10003;</span>
              Identifikácia hlavných rizík
            </li>
          </ul>
          <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
            Začať screening
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </button>

      {/* Complex */}
      <button
        onClick={() => onSelect('complex')}
        className="group text-left p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-indigo-400 hover-lift card-shine transition-all relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full" />
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 rounded-full bg-gradient-card-indigo text-white text-xs font-bold shadow-lg shadow-indigo-500/25">
            Odporúčané
          </span>
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-5">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-card-indigo text-white font-black text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
              45+
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Komplexná diagnostika
              </h3>
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                15-20 minút
              </span>
            </div>
          </div>
          <p className="text-slate-600 mb-5">
            Hlbšia analýza s detailným výsledkom. Adaptívne otázky podľa vašich odpovedí.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-500 mb-6">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">&#10003;</span>
              Detailný profil po 6 kategóriách
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">&#10003;</span>
              Risk index a ROI odhad
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">&#10003;</span>
              Prioritizovaná roadmapa
            </li>
          </ul>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold group-hover:gap-3 transition-all">
            Začať diagnostiku
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}
