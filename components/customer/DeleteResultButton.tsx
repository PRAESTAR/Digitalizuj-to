'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { deleteResultFromServer } from '@/lib/resultStore';
import { removeResultFromStorage } from '@/lib/resultHash';

interface Props {
  hash: string;
  /** Volá sa po úspešnom výmaze — stránka /r/{hash} vďaka tomu prepne obsah. */
  onDeleted?: () => void;
}

type Phase = 'idle' | 'confirm' | 'working' | 'done' | 'error';

/**
 * Výmaz uloženého výsledku na žiadosť používateľa.
 *
 * Maže obe kópie naraz — serverovú aj tú v prehliadači. Zmazať len jednu by
 * bolo horšie než nezmazať nič, lebo používateľ by z UI odišiel s dojmom, že
 * výsledok prestal existovať, hoci druhá kópia žije ďalej.
 *
 * Potvrdzovací krok je vlastný, nie `window.confirm`: natívny dialóg sa v
 * niektorých prehliadačoch po opakovanom použití potlačí, a výmaz je
 * nevratný — nesmie závisieť od dialógu, ktorý sa nemusí zobraziť.
 */
export default function DeleteResultButton({ hash, onDeleted }: Props) {
  const t = useTranslations('share');
  const [phase, setPhase] = useState<Phase>('idle');

  async function remove() {
    setPhase('working');
    const ok = await deleteResultFromServer(hash);
    // Lokálnu kópiu mažeme len keď serverová zmizla. Inak by používateľ
    // stratil prístup k výsledku, ktorý na serveri ďalej existuje.
    if (!ok) {
      setPhase('error');
      return;
    }
    removeResultFromStorage(hash);
    setPhase('done');
    onDeleted?.();
  }

  if (phase === 'done') {
    return (
      <p className="text-sm text-[#6e6e73] leading-relaxed" role="status">
        {t('deleteDone')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {phase === 'confirm' || phase === 'working' || phase === 'error' ? (
        <>
          <p className="text-sm text-[#1d1d1f] leading-relaxed">{t('deleteConfirm')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={remove}
              disabled={phase === 'working'}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-[#b3261e]/30 bg-[#b3261e]/[0.06] text-[#b3261e] font-semibold text-sm hover:bg-[#b3261e]/[0.12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {phase === 'working' ? t('deleteWorking') : t('deleteConfirmYes')}
            </button>
            <button
              onClick={() => setPhase('idle')}
              disabled={phase === 'working'}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-black/10 bg-[#1d1d1f]/[0.04] text-[#1d1d1f] font-semibold text-sm hover:bg-[#1d1d1f]/[0.08] disabled:opacity-50 transition-colors duration-200"
            >
              {t('deleteCancel')}
            </button>
          </div>
          {phase === 'error' && (
            <p className="text-sm text-[#b3261e] leading-relaxed" role="alert">
              {t('deleteError')}
            </p>
          )}
        </>
      ) : (
        <button
          onClick={() => setPhase('confirm')}
          className="text-sm font-semibold text-[#6e6e73] underline underline-offset-4 hover:text-[#b3261e] transition-colors duration-200"
        >
          {t('deleteCta')}
        </button>
      )}
    </div>
  );
}
