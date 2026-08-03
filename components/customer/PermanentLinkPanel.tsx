'use client';

import { useEffect, useState } from 'react';
import type { ResultSnapshot, Respondent } from '@/types';
import { generateHash, saveResultToStorage } from '@/lib/resultHash';
import { toPeerSnapshot } from '@/lib/snapshotMapper';
import QRCodeCard from './QRCodeCard';

interface Props {
  result: ResultSnapshot;
  respondent: Respondent;
  completedAt?: string;
}

const SITE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'https://matpex.sk';

/**
 * Automaticky vygeneruje trvalý hash + QR kód pre výsledok, hneď ako sa
 * zobrazí výsledková stránka — bez nutnosti kliknúť na tlačidlo.
 * Generovanie beží až po mounte (useEffect), aby hash — ktorý je náhodný —
 * nespôsobil hydration mismatch medzi serverovým a klientským renderom.
 */
export default function PermanentLinkPanel({ result, respondent, completedAt }: Props) {
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    const h = generateHash();
    const snapshot = toPeerSnapshot(h, result, respondent, completedAt);
    saveResultToStorage(h, snapshot);
    setHash(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generovať znova len ak sa zmení samotný výsledok
  }, [result.assessmentId]);

  if (!hash) {
    return (
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8">
        <div className="h-5 w-56 bg-[#1d1d1f]/[0.08] rounded-lg mb-2 animate-pulse" />
        <div className="h-4 w-72 bg-[#1d1d1f]/[0.08] rounded-lg mb-6 animate-pulse" />
        {/* Podtržník, nie čiarka — Tailwind prevádza na medzeru iba podtržník,
            takže s čiarkou vznikne neplatné grid-template-columns a stĺpce
            ticho nefungujú. */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="w-[224px] h-[224px] bg-[#1d1d1f]/[0.04] rounded-2xl border-2 border-black/5 flex items-center justify-center text-[#86868b] text-xs mx-auto sm:mx-0">
            Generujem QR…
          </div>
          <div className="h-24 bg-[#1d1d1f]/[0.04] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const url = `${SITE_URL}/r/${hash}`;
  return <QRCodeCard url={url} hash={hash} />;
}
