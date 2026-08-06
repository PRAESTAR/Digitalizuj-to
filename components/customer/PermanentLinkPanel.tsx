'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { ResultSnapshot, Respondent, AssessmentType } from '@/types';
import { generateResultId, saveResultToStorage } from '@/lib/resultHash';
import { saveResultToServer } from '@/lib/resultStore';
import { toPeerSnapshot } from '@/lib/snapshotMapper';
import QRCodeCard from './QRCodeCard';
import DeleteResultButton from './DeleteResultButton';

interface Props {
  result: ResultSnapshot;
  respondent: Respondent;
  quizType: AssessmentType;
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
export default function PermanentLinkPanel({
  result,
  respondent,
  quizType,
  completedAt,
}: Props) {
  const locale = useLocale();
  const t = useTranslations('share');
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    // SHA-256 sa počíta asynchrónne; `cancelled` bráni zápisu stavu, keby sa
    // komponent odmountoval skôr, než digest dobehne.
    let cancelled = false;
    (async () => {
      const { hash: h, uuid } = await generateResultId();
      if (cancelled) return;

      // Najprv lokálne: je to okamžité a výsledok tak existuje aj vtedy, keď
      // je server nedostupný. Odkaz sa zobrazí hneď, nečaká sa na sieť.
      const snapshot = toPeerSnapshot(h, result, respondent, completedAt);
      saveResultToStorage(h, snapshot, uuid);
      setHash(h);

      // Potom na server — až vďaka tomu odkaz a QR kód fungujú aj na inom
      // zariadení a výsledok sa dá zobraziť neskôr. Zlyhanie sa prehltne,
      // používateľ oň lokálne nepríde. Odosielajú sa len agregáty, nie
      // odpovede po otázkach (viď lib/resultStore.ts).
      void saveResultToServer({
        hash: h,
        uuid,
        result,
        respondent,
        quizType,
        locale,
        completedAt,
      });
    })();
    return () => {
      cancelled = true;
    };
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
  return (
    <div className="space-y-3">
      <QRCodeCard url={url} hash={hash} />
      {/* Výmaz patrí sem, nie len na /r/{hash}: toto je prvá a často jediná
          obrazovka, kde sa používateľ dozvie, že sa výsledok vôbec uložil. */}
      <div className="px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-[#86868b] leading-relaxed mb-2">{t('retention')}</p>
        <DeleteResultButton hash={hash} />
      </div>
    </div>
  );
}
