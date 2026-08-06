'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LikertScale from '@/components/quiz/LikertScale';
import { sendFeedbackToServer } from '@/lib/resultStore';

interface Props {
  hash: string;
}

/**
 * Hodnotenie testu na škále 0–10, zobrazené pod výsledkom.
 *
 * Jediný spätnoväzbový kanál, ktorý produkt má — bez neho sa nedá zistiť,
 * či je výsledok pre firmy použiteľný, alebo len pekne vyzerá. Ukladá sa
 * k existujúcemu riadku výsledku, takže sa dá porovnať so skóre, ktoré ho
 * vyvolalo.
 *
 * Odosiela sa hneď po kliknutí, bez potvrdzovacieho tlačidla: hodnotenie je
 * jeden klik a druhý krok by časť ľudí stratila. Zlyhanie zápisu sa nehlási —
 * je to voliteľná spätná väzba, nie súčasť výsledku, a chybová hláška by
 * používateľa zaťažila niečím, čo preňho nemá dôsledok.
 */
export default function FeedbackPanel({ hash }: Props) {
  const t = useTranslations('feedback');
  const [score, setScore] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  function handle(value: number) {
    setScore(value);
    setSent(true);
    void sendFeedbackToServer(hash, value);
  }

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-4 sm:p-6 lg:p-8">
      <h2 className="text-base sm:text-lg font-bold text-[#1d1d1f] break-words">{t('title')}</h2>
      <p className="text-sm text-[#6e6e73] mt-1 mb-5 leading-relaxed break-words">{t('subtitle')}</p>

      <LikertScale
        value={score}
        onChange={handle}
        anchorLow={t('anchorLow')}
        anchorHigh={t('anchorHigh')}
        ariaLabel={t('title')}
      />

      {sent && (
        <p className="text-sm text-emerald-700 font-medium mt-4" role="status">
          {t('thanks')}
        </p>
      )}
    </div>
  );
}
