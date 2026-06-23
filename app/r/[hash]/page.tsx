import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  PEER_DATA,
  getPeerByHash,
  SECTOR_LABELS_SK,
  SIZE_BAND_LABELS_SK,
} from '@/data/peerData';
import { isValidHash } from '@/lib/resultHash';
import PeerComparisonPanel from '@/components/customer/PeerComparisonPanel';
import QRCodeCard from '@/components/customer/QRCodeCard';
import UserOwnResultView from '@/components/customer/UserOwnResultView';

const SITE_URL = 'https://digitalizuj.to';

type Params = Promise<{ hash: string }>;

export async function generateStaticParams() {
  return PEER_DATA.map((p) => ({ hash: p.hash }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { hash } = await params;
  const peer = getPeerByHash(hash);

  if (!peer) {
    return {
      title: 'Výsledok nenájdený',
      robots: { index: false, follow: false },
    };
  }

  const sectorLabel = SECTOR_LABELS_SK[peer.sector] ?? peer.sector;
  const sizeLabel = SIZE_BAND_LABELS_SK[peer.sizeBand];

  return {
    title: `Výsledok #${hash.slice(0, 6)}`,
    description: `Anonymizovaný výsledok diagnostiky digitálnej zrelosti — ${sectorLabel}, ${sizeLabel}. DII ${peer.diiScore100}/100, ORS ${peer.orsScore}/100.`,
    alternates: { canonical: `/r/${hash}` },
    robots: { index: false, follow: false },
  };
}

export default async function ResultByHashPage({
  params,
}: {
  params: Params;
}) {
  const { hash } = await params;

  if (!isValidHash(hash)) {
    notFound();
  }

  const peer = getPeerByHash(hash);

  // Unknown hash — could be the user's own result stored in localStorage.
  // Fall through to a client-side view that reads localStorage.
  if (!peer) {
    return <UserOwnResultView hash={hash} />;
  }

  const sectorLabel = SECTOR_LABELS_SK[peer.sector] ?? peer.sector;
  const sizeLabel = SIZE_BAND_LABELS_SK[peer.sizeBand];
  const url = `${SITE_URL}/r/${hash}`;

  const dateLabel = new Date(peer.completedAt).toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"
            aria-hidden="true"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">
              Anonymizovaný výsledok
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

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
        <ScoreCard
          label="DII Score"
          value={`${peer.diiScore100}`}
          unit="/100"
          subtitle={`${peer.diiScore12}/12 (DII raw)`}
          gradient="from-indigo-500 to-blue-600"
        />
        <ScoreCard
          label="Operational Readiness"
          value={`${peer.orsScore}`}
          unit="/100"
          subtitle="ODRM model"
          gradient="from-cyan-500 to-teal-500"
        />
        <ScoreCard
          label="Risk Index (TDRI)"
          value={`${peer.tdriScore}`}
          unit="/100"
          subtitle="Vyššie = horšie"
          gradient="from-rose-500 to-orange-500"
        />
        <ScoreCard
          label="Business Impact"
          value={new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(peer.businessImpactEur)}
          unit=""
          subtitle="EUR / rok (mid)"
          gradient="from-emerald-500 to-green-600"
        />
      </div>

      {/* Peer comparison */}
      <PeerComparisonPanel current={peer} />

      {/* QR + share */}
      <QRCodeCard url={url} hash={hash} />

      {/* Disclaimer */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-sm text-slate-600 leading-relaxed">
        <p className="font-bold text-slate-700 mb-1">O tomto zobrazení</p>
        <p>
          Toto je anonymizovaný snapshot výsledku z testovacieho vzorky 50 firiem na Slovensku.
          Žiadne identifikačné údaje firmy sa neukladajú a nezobrazujú. Stránka je dostupná iba
          cez tento konkrétny hash a nie je indexovaná vyhľadávačmi.
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
      <div
        className={`inline-block w-1 h-6 rounded-full bg-gradient-to-b ${gradient} mb-3`}
        aria-hidden="true"
      />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        {value}
        <span className="text-sm font-bold text-slate-400 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>
    </div>
  );
}
