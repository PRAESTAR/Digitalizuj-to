'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ResultSnapshot, Respondent } from '@/types';
import { generateHash, saveResultToStorage } from '@/lib/resultHash';
import { toPeerSnapshot } from '@/lib/snapshotMapper';

interface Props {
  result: ResultSnapshot;
  respondent: Respondent;
  completedAt?: string;
}

export default function PermanentLinkPanel({ result, respondent, completedAt }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function generateLink() {
    setPending(true);
    const hash = generateHash();
    const snapshot = toPeerSnapshot(hash, result, respondent, completedAt);
    saveResultToStorage(hash, snapshot);
    router.push(`/r/${hash}`);
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 animate-fade-in-up">
      <div className="flex items-start gap-4 mb-5">
        <div
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0"
          aria-hidden="true"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-900">
            Získať trvalý odkaz a QR kód
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Vygenerujeme jedinečný odkaz na vašu výsledkovú stránku — nájdete na nej
            QR kód, peer porovnanie so segmentom firiem rovnakej veľkosti a SK priemer.
            Výsledok zostáva uložený iba v tomto prehliadači.
          </p>
        </div>
      </div>

      <button
        onClick={generateLink}
        disabled={pending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-progress"
      >
        {pending ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Generujem…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Vygenerovať odkaz a QR kód
          </>
        )}
      </button>
    </div>
  );
}
