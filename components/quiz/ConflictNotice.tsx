'use client';

import { useTranslations } from 'next-intl';
import type { DetectedConflict } from '@/data/answerConflicts';

interface Props {
  conflicts: DetectedConflict[];
  /** Vráti respondenta k danej otázke, aby si odpoveď mohol opraviť. */
  onEdit: (questionId: string) => void;
  /** Pokračovať bez zmeny — odpovede sa berú tak, ako ich dal. */
  onContinue: () => void;
}

/**
 * Ponuka opraviť si odpoveď, ktorá si odporuje s inou.
 *
 * Zobrazuje sa v medzistave `answered` — teda po poslednej otázke a PRED
 * spočítaním výsledku. To miesto do 7. 8. 2026 neexistovalo: `SUBMIT_ANSWER`
 * kvíz sám dokončil a rovno počítal skóre.
 *
 * ČO TO ZÁMERNE NIE JE:
 *  - nie je to obvinenie z nepozornosti — rozpor môže mať aj vecný dôvod
 *    (firma fakturuje automaticky, ale dobropisy rieši ručne),
 *  - nie je to blokácia — „Pokračovať" je rovnocenné tlačidlo, nie únikové,
 *  - nie je to skóre kvality odpovedí, ani skryté. Model berie odpovede tak,
 *    ako ich respondent dal, v oboch prípadoch rovnako.
 *
 * Keby sa z toho stal prah alebo hodnotenie, rekapitulácia by vyrobila NOVÝ
 * zdroj skreslenia: doladenie odpovedí k lepšiemu číslu.
 */
export default function ConflictNotice({ conflicts, onEdit, onContinue }: Props) {
  const t = useTranslations('quiz');
  if (conflicts.length === 0) return null;

  return (
    <div className="site-container py-12 sm:py-16 animate-fade-in-up">
      <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-black/5 shadow-sm p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 shrink-0 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center text-lg font-bold">
            ?
          </span>
          <h1 className="min-w-0 text-lg sm:text-xl font-bold text-[#1d1d1f]">
            {t('conflictTitle')}
          </h1>
        </div>

        <p className="text-sm text-[#6e6e73] leading-relaxed mb-6">
          {t('conflictIntro')}
        </p>

        <div className="space-y-4 mb-8">
          {conflicts.map(c => (
            <div key={c.id} className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-[#1d1d1f] leading-relaxed mb-3">{c.messageSk}</p>
              <div className="flex flex-wrap gap-2">
                {c.questionIds.map((qid, i) => (
                  <button
                    key={qid}
                    type="button"
                    onClick={() => onEdit(qid)}
                    className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-[#1d1d1f] hover:border-amber-400 transition-colors text-left min-w-0 break-words"
                  >
                    {t('conflictEdit', { question: c.questionLabelsSk[i] })}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="btn-apple-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold"
          >
            {t('conflictContinue')}
          </button>
        </div>

        <p className="text-xs text-[#86868b] leading-relaxed mt-4">
          {t('conflictNote')}
        </p>
      </div>
    </div>
  );
}
