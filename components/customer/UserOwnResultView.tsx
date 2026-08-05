'use client';

import { useTranslations, useLocale } from 'next-intl';
import { intlLocale, type Locale } from '@/i18n/routing';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SECTOR_LABELS_SK,
  SIZE_BAND_LABELS_SK,
} from '@/data/peerData';
import { loadResultFromStorage } from '@/lib/resultHash';
import type { PeerSnapshot } from '@/types';
import PeerComparisonPanel from './PeerComparisonPanel';
import QRCodeCard from './QRCodeCard';

const SITE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://matpex.sk';

interface Props {
  hash: string;
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'found'; snapshot: PeerSnapshot }
  | { kind: 'missing' };

export default function UserOwnResultView({ hash }: Props) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [state, setState] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    const stored = loadResultFromStorage(hash);
    if (stored && stored.payload && typeof stored.payload === 'object') {
      // We saved a PeerSnapshot in payload. Validate the shape minimally.
      const p = stored.payload as PeerSnapshot;
      // diiScore100 môže byť vo v2 legitímne null (nemerané DII) — kotvou
      // tvaru je tdriScore, ktorý je number v každej verzii schémy.
      if (
        p.hash === hash &&
        typeof p.tdriScore === 'number' &&
        (typeof p.diiScore100 === 'number' || p.diiScore100 === null)
      ) {
        // localStorage nie je dostupný pri SSR — čítanie musí prebehnúť po mounte,
        // aby prvý klientský render zodpovedal serverovému (žiadny hydration mismatch).
        // Ide o jediný, terminálny setState bez ďalších nadväzujúcich efektov.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({ kind: 'found', snapshot: p });
        return;
      }
    }
    setState({ kind: 'missing' });
  }, [hash]);

  if (state.kind === 'loading') {
    return (
      <div className="site-container py-12 sm:py-16 text-center">
        <div className="inline-flex items-center gap-2 text-[#6e6e73] text-sm">
          <span className="w-2 h-2 rounded-full bg-[#86868b] animate-pulse" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (state.kind === 'missing') {
    return (
      <div className="site-container py-12 sm:py-16 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-6 rounded-3xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] mb-3 break-words">
          {t('customer.notFoundTitle')}
        </h1>
        <p className="text-[#6e6e73] mb-2 leading-relaxed">
          {/* 16-znakový hash je jeden nezalomiteľný reťazec — bez break-all
              pretečie odsek pri 320 px hneď, ako sa zväčší text. */}
          {t.rich('customer.notFoundBody', { hash, mono: (c) => <span className="font-mono text-[#1d1d1f] break-all">{c}</span> })}
        </p>
        <p className="text-[#6e6e73] mb-8 text-sm leading-relaxed">
          {t('customer.notFoundHint')}
        </p>
        {/* Na mobile obe CTA cez celú šírku — „{t('customer.browseSamples')}“ sa
            pri 320 px aj tak zalomí, takže vycentrovaný riadok vyzeral rozbito. */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
          <Link
            href="/"
            className="btn-apple-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3.5 rounded-full text-white font-semibold"
          >
            {t('customer.startNew')}
          </Link>
          <Link
            href="/peers"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border border-black/10 text-[#1d1d1f] rounded-full font-semibold hover:bg-black/5 sm:hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('customer.browseSamples')}
          </Link>
        </div>
      </div>
    );
  }

  const snapshot = state.snapshot;
  const sectorLabel = SECTOR_LABELS_SK[snapshot.sector] ?? snapshot.sector;
  const sizeLabel = SIZE_BAND_LABELS_SK[snapshot.sizeBand];
  const url = `${SITE_URL}/r/${hash}`;
  const dateLabel = new Date(snapshot.completedAt).toLocaleDateString(intlLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="site-container py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* min-w-0 — flex položka inak neklesne pod min-content šírku
              a dlhý sektorový názov by roztlačil hlavičku mimo viewport. */}
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-0.5">
              {t('customer.yourResult')}
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1d1d1f] break-words">
              {sectorLabel} &middot; {sizeLabel}
            </h1>
            <p className="text-sm text-[#6e6e73] mt-1 break-words">
              Hash: <span className="font-mono text-[#1d1d1f] break-all">{hash}</span> &middot; {dateLabel}
            </p>
          </div>
        </div>
      </div>

      {snapshot.schemaVersion !== 2 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 sm:p-4 text-sm text-amber-800 leading-relaxed animate-fade-in-up">
          {t('customer.legacyNote')}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in-up">
        <ScoreCard
          label="DII Score"
          value={snapshot.diiScore100 !== null ? `${snapshot.diiScore100}` : '–'}
          unit={snapshot.diiScore100 !== null ? '/100' : ''}
          subtitle={diiSubtitle(snapshot, t)}
        />
        <ScoreCard
          label="Operational Readiness"
          value={snapshot.orsScore !== null ? `${snapshot.orsScore}` : '–'}
          unit={snapshot.orsScore !== null ? '/100' : ''}
          subtitle="ODRM model"
        />
        <ScoreCard label="Risk Index (TDRI)" value={`${snapshot.tdriScore}`} unit="/100" subtitle={t('customer.higherWorse')} />
        <ScoreCard
          label="Business Impact"
          value={new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(snapshot.businessImpactEur)}
          unit=""
          subtitle={t('customer.eurPerYearMid')}
        />
      </div>

      <PeerComparisonPanel current={snapshot} />
      <QRCodeCard url={url} hash={hash} />

      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 text-sm text-[#1d1d1f] leading-relaxed">
        <p className="font-bold text-emerald-700 mb-1">{t('share.privacyTitle')}</p>
        <p>
          {t('share.privacyText')}
        </p>
      </div>
    </div>
  );
}

/**
 * Podtitulok DII karty podľa verzie snapshotu — v2 priznáva extrapoláciu,
 * legacy v1 nesie označenie starej metodiky (rovnaká logika ako /r/[hash]).
 */
function diiSubtitle(
  snapshot: PeerSnapshot,
  t: ReturnType<typeof useTranslations>
): string {
  if (snapshot.diiScore12 === null) return t('customer.diiUnmeasured');
  if (snapshot.schemaVersion === 2) {
    if (snapshot.diiMeasured !== undefined && snapshot.diiMeasured < 12) {
      return `${snapshot.diiScore12}/12 · ${t('customer.diiEstimate', { measured: snapshot.diiMeasured })}`;
    }
    return `${snapshot.diiScore12}/12 (DII)`;
  }
  return `${snapshot.diiScore12}/12 (DII raw · ${t('customer.legacyV1')})`;
}

function ScoreCard({
  label,
  value,
  unit,
  subtitle,
}: {
  label: string;
  value: string;
  unit: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-3 sm:p-4 lg:p-5 min-w-0">
      <div className="inline-block w-1 h-6 rounded-full bg-[#1d1d1f]/10 mb-3" aria-hidden="true" />
      <p className="text-[11px] sm:text-xs font-bold text-[#6e6e73] uppercase tracking-wide mb-1.5 break-words">
        {label}
      </p>
      {/* Rovnaký prípad ako v /r/[hash]: sk-SK mena používa nezalomiteľné
          medzery, takže „22 800 €“ pri text-2xl pretieklo bunku gridu. */}
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1d1d1f] tracking-tight tabular-nums break-words">
        {value}
        <span className="text-sm font-bold text-[#86868b] ml-1">{unit}</span>
      </p>
      <p className="text-xs text-[#6e6e73] mt-1.5 break-words">{subtitle}</p>
    </div>
  );
}
