'use client';

import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import type { AssessmentType } from '@/types';

export default function QuizSelector() {
  const router = useRouter();
  const { startQuiz } = useAssessment();

  const handleSelect = (type: AssessmentType) => {
    startQuiz(type);
    router.push('/quiz');
  };

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
                Indikatívny kvíz
              </h3>
              <span className="mt-1 inline-block text-xs text-[#0068d6] font-medium bg-[#0068d6]/5 px-2 py-0.5 rounded-full">
                5-7 minút
              </span>
            </div>
          </div>
          <p className="text-[#6e6e73] mb-5">
            Rýchly screening digitálnej zrelosti. Orientačný výsledok s hlavnými odporúčaniami.
          </p>
          <ul className="space-y-2.5 text-sm text-[#6e6e73] mb-6">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">&#10003;</span>
              Max. 15 otázok
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">&#10003;</span>
              Orientačné skóre digitalizácie
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">&#10003;</span>
              Identifikácia hlavných rizík
            </li>
          </ul>
          <div className="flex items-center gap-2 text-[#0068d6] font-semibold group-hover:gap-3 transition-all">
            Začať screening
            <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
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
          Odporúčané
        </span>
        <div className="relative">
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <span className="flex flex-shrink-0 items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1d1d1f]/[0.05] font-bold text-lg sm:text-xl">
              <span className="text-gradient-aurora">43+</span>
            </span>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-[#1d1d1f] break-words">
                Komplexná diagnostika
              </h3>
              <span className="mt-1 inline-block text-xs text-[#0068d6] font-medium bg-[#0068d6]/5 px-2 py-0.5 rounded-full">
                15-20 minút
              </span>
            </div>
          </div>
          <p className="text-[#6e6e73] mb-5">
            Hlbšia analýza s detailným výsledkom. Adaptívne otázky podľa vašich odpovedí.
          </p>
          <ul className="space-y-2.5 text-sm text-[#6e6e73] mb-6">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">&#10003;</span>
              Detailný profil po 6 kategóriách
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">&#10003;</span>
              Risk index a ROI odhad
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center text-xs">&#10003;</span>
              Prioritizovaná roadmapa
            </li>
          </ul>
          <div className="flex items-center gap-2 text-[#0068d6] font-semibold group-hover:gap-3 transition-all">
            Začať diagnostiku
            <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}
