'use client';

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
    : 'https://digitalizuj.to';

interface Props {
  hash: string;
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'found'; snapshot: PeerSnapshot }
  | { kind: 'missing' };

export default function UserOwnResultView({ hash }: Props) {
  const [state, setState] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    const stored = loadResultFromStorage(hash);
    if (stored && stored.payload && typeof stored.payload === 'object') {
      // We saved a PeerSnapshot in payload. Validate the shape minimally.
      const p = stored.payload as PeerSnapshot;
      if (p.hash === hash && typeof p.diiScore100 === 'number') {
        setState({ kind: 'found', snapshot: p });
        return;
      }
    }
    setState({ kind: 'missing' });
  }, [hash]);

  if (state.kind === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Načítavam výsledok…
        </div>
      </div>
    );
  }

  if (state.kind === 'missing') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">
          Výsledok nie je dostupný na tomto zariadení
        </h1>
        <p className="text-slate-600 mb-2 leading-relaxed">
          Hash <span className="font-mono text-slate-800">{hash}</span> sme nenašli ani v anonymizovanej vzorke,
          ani v lokálnej pamäti tohto prehliadača.
        </p>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Výsledky vlastnej diagnostiky sú uložené iba lokálne v zariadení, kde ste kvíz vyplnili.
          Otvorte odkaz v rovnakom prehliadači, alebo si urobte novú diagnostiku.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Začať novú diagnostiku
          </Link>
          <Link
            href="/peers"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
          >
            Prezerať vzorové výsledky
          </Link>
        </div>
      </div>
    );
  }

  const snapshot = state.snapshot;
  const sectorLabel = SECTOR_LABELS_SK[snapshot.sector] ?? snapshot.sector;
  const sizeLabel = SIZE_BAND_LABELS_SK[snapshot.sizeBand];
  const url = `${SITE_URL}/r/${hash}`;
  const dateLabel = new Date(snapshot.completedAt).toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"
            aria-hidden="true"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-0.5">
              Váš výsledok
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {sectorLabel} &middot; {sizeLabel}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Hash: <span className="font-mono text-slate-700">{hash}</span> &middot; {dateLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
        <ScoreCard label="DII Score" value={`${snapshot.diiScore100}`} unit="/100" subtitle={`${snapshot.diiScore12}/12 (DII raw)`} gradient="from-indigo-500 to-blue-600" />
        <ScoreCard label="Operational Readiness" value={`${snapshot.orsScore}`} unit="/100" subtitle="ODRM model" gradient="from-cyan-500 to-teal-500" />
        <ScoreCard label="Risk Index (TDRI)" value={`${snapshot.tdriScore}`} unit="/100" subtitle="Vyššie = horšie" gradient="from-rose-500 to-orange-500" />
        <ScoreCard
          label="Business Impact"
          value={new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(snapshot.businessImpactEur)}
          unit=""
          subtitle="EUR / rok (mid)"
          gradient="from-emerald-500 to-green-600"
        />
      </div>

      <PeerComparisonPanel current={snapshot} />
      <QRCodeCard url={url} hash={hash} />

      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-sm text-slate-700 leading-relaxed">
        <p className="font-bold text-emerald-700 mb-1">Súkromie</p>
        <p>
          Tento výsledok je uložený iba lokálne v tomto prehliadači. Ak QR kód alebo odkaz
          zdieľate, druhá strana uvidí len anonymizovaný snapshot, ktorý už nedokáže
          identifikovať vašu firmu.
        </p>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  unit,
  subtitle,
  gradient,
}: {
  label: string;
  value: string;
  unit: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className={`inline-block w-1 h-6 rounded-full bg-gradient-to-b ${gradient} mb-3`} aria-hidden="true" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        {value}
        <span className="text-sm font-bold text-slate-400 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>
    </div>
  );
}
