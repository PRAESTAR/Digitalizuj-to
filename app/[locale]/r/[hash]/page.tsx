import type { Metadata } from 'next';
import { intlLocale, type Locale } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  PEER_DATA,
  getPeerByHash,
  SECTOR_LABELS_SK,
  SIZE_BAND_LABELS_SK,
} from '@/data/peerData';
import { isValidHash, formatHashGroups } from '@/lib/resultHash';
import PeerComparisonPanel from '@/components/customer/PeerComparisonPanel';
import QRCodeCard from '@/components/customer/QRCodeCard';
import UserOwnResultView from '@/components/customer/UserOwnResultView';

const SITE_URL = 'https://matpex.sk';

type Params = Promise<{ locale: string; hash: string }>;

export async function generateStaticParams() {
  return PEER_DATA.map((p) => ({ hash: p.hash }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { hash } = await params;

  if (!isValidHash(hash)) {
    return {
      title: 'Výsledok nenájdený',
      robots: { index: false, follow: false },
    };
  }

  const peer = getPeerByHash(hash);

  if (!peer) {
    // Valid hash format, but not part of the public peer benchmark table —
    // it may still be a real result stored in the visitor's own localStorage
    // (rendered client-side by UserOwnResultView). We cannot check that
    // from the server, so avoid a misleading "not found" title here.
    return {
      title: 'Váš výsledok diagnostiky',
      robots: { index: false, follow: false },
    };
  }

  const sectorLabel = SECTOR_LABELS_SK[peer.sector] ?? peer.sector;
  const sizeLabel = SIZE_BAND_LABELS_SK[peer.sizeBand];

  return {
    title: `Výsledok #${hash.slice(0, 6)}`,
    description: `Anonymizovaný výsledok diagnostiky digitálnej zrelosti — ${sectorLabel}, ${sizeLabel}. DII ${peer.diiScore100}/100, ORS ${peer.orsScore}/100.`,
    // Canonical tu zámerne NIE JE: stránka je noindex,nofollow a canonical
    // na noindex stránke je protirečivý signál (canonical hovorí „indexuj
    // túto adresu", noindex hovorí „neindexuj nič"). Prázdny objekt zároveň
    // PRERUŠUJE dedenie z layoutu — bez neho by sa zdedil canonical na
    // homepage aj hreflang cluster (dedenie metadát je per-kľúč).
    alternates: {},
    robots: { index: false, follow: false },
  };
}

export default async function ResultByHashPage({
  params,
}: {
  params: Params;
}) {
  const { locale, hash } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

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

  const dateLabel = new Date(peer.completedAt).toLocaleDateString(intlLocale(locale as Locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 pt-16 pb-6 sm:pt-8 sm:pb-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-[#1d1d1f]/8 text-[#1d1d1f] flex items-center justify-center"
            aria-hidden="true"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          {/* min-w-0 — bez neho flex položka nikdy neklesne pod svoju
              min-content šírku a dlhý sektorový názov roztlačí celú hlavičku. */}
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wide mb-0.5">{t('customer.anonResult')}</p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1d1d1f] break-words">
              {sectorLabel} &middot; {sizeLabel}
            </h1>
            <p className="text-sm text-[#6e6e73] mt-1 break-words">
              Hash:{' '}
              {/* Skupiny sú spojené obyčajnou medzerou, takže hash sa pri
                  zväčšenom texte zalomí medzi štvoricami. break-words (nie
                  break-all) — zalomenie vnútri štvorice až ako posledná možnosť. */}
              <span className="font-mono text-[#1d1d1f] tracking-[0.12em] break-words">
                {formatHashGroups(hash).join(' ')}
              </span>{' '}
              &middot; {dateLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in-up">
        <ScoreCard
          label="DII Score"
          value={`${peer.diiScore100}`}
          unit="/100"
          subtitle={`${peer.diiScore12}/12 (DII raw)`}
        />
        <ScoreCard
          label="Operational Readiness"
          value={`${peer.orsScore}`}
          unit="/100"
          subtitle="ODRM model"
        />
        <ScoreCard
          label="Risk Index (TDRI)"
          value={`${peer.tdriScore}`}
          unit="/100"
          subtitle={t('customer.higherWorse')}
        />
        <ScoreCard
          label="Business Impact"
          value={new Intl.NumberFormat(intlLocale(locale as Locale), {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(peer.businessImpactEur)}
          unit=""
          subtitle="EUR / rok (mid)"
        />
      </div>

      {/* Peer comparison */}
      <PeerComparisonPanel current={peer} />

      {/* QR + share */}
      <QRCodeCard url={url} hash={hash} />

      {/* Disclaimer */}
      <div className="rounded-3xl bg-white border border-black/5 p-4 sm:p-5 text-sm text-[#6e6e73] leading-relaxed">
        <p className="font-bold text-[#1d1d1f] mb-1">{t('customer.aboutTitle')}</p>
        <p>
          {t('customer.aboutBody')}
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
}: {
  label: string;
  value: string;
  unit: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl bg-white border border-black/5 shadow-sm p-3 sm:p-4 lg:p-5 min-w-0">
      <div
        className="inline-block w-1 h-6 rounded-full bg-[#1d1d1f]/15 mb-3"
        aria-hidden="true"
      />
      <p className="text-[11px] sm:text-xs font-bold text-[#86868b] uppercase tracking-wide mb-1.5 break-words">
        {label}
      </p>
      {/* Business Impact („22 800 €“) potreboval pri text-2xl 109 px v 102 px
          bunke. Menšie mobilné písmo + break-words: hodnota už nerozťahuje
          stĺpec gridu a nepretečie kartu ani pri zväčšenom texte.
          Pozor: sk-SK formát používa nezalomiteľné medzery, preto break-words. */}
      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1d1d1f] tracking-tight tabular-nums break-words">
        {value}
        <span className="text-sm font-bold text-[#86868b] ml-1">{unit}</span>
      </p>
      <p className="text-xs text-[#6e6e73] mt-1.5 break-words">{subtitle}</p>
    </div>
  );
}
