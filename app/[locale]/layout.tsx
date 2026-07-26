import type { Metadata, Viewport } from 'next';
import { Onest, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import '../globals.css';
import TextSizeControl from '@/components/ui/TextSizeControl';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Link } from '@/i18n/navigation';
import { routing, LOCALE_META, type Locale } from '@/i18n/routing';
// SiteHeader dočasne vypnutý — komponent zostáva v components/ui/SiteHeader.tsx.
// AssessmentProvider už nie je tu — je scoped na app/(assessment)/layout.tsx,
// aby stránky mimo kvízu (/peers, /changelog, /r/[hash]) neťahali 80KB
// otázkovej banky a scoring enginy do svojho JS bundlu.

// Onest — variable, SF Pro–ublízke geometrické proporcie, plná podpora
// slovenskej diakritiky (latin-ext). Nesie primárnu typografiu celej stránky.
const onest = Onest({
  variable: '--font-onest',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = 'https://digitalizuj.to';

// Titulok cieli na reálne vyhľadávanú frázu ("test digitálnej zrelosti"),
// nie na značku — značka je až za oddeľovačom. Do 60 znakov, aby sa v SERP
// neorezal.
const siteTitle = 'Test digitálnej zrelosti firmy zadarmo | digitalizuj.to';

// Meta description do 155 znakov, s konkrétnym prísľubom (čas, výstup)
// a s CTA. Diferenciátory voči konkurencii ("zadarmo", "bez registrácie")
// sú vpredu, lebo sa v SERP zobrazujú aj po orezaní.
const metaDescription =
  'Zistite za 5 minút, ako digitálne zrelá je vaša firma. Bezplatný audit digitalizácie podľa Eurostat DII — skóre, riziká aj odhad úspor. Bez registrácie.';

// Dlhší popis pre OG/JSON-LD, kde limit 155 znakov neplatí.
const longDescription =
  'Bezplatný online test digitálnej zrelosti firmy pre malé a stredné podniky na Slovensku. Anonymne, bez registrácie a bez e-mailu: DII skóre porovnané s EÚ a SK, prevádzková zrelosť v 6 oblastiach, index technologického dlhu a rizík (vrátane pripravenosti na povinnú e-fakturáciu od 1. 1. 2027 a NIS2) a odhad ročných úspor. Metodika je verejná — Eurostat Digital Intensity Index (DII) a Operational Digital Readiness Model (ODRM).';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s | digitalizuj.to',
  },
  description: metaDescription,
  applicationName: 'digitalizuj.to',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  // Google meta keywords ignoruje; ponechané ako kompaktný tematický signál
  // pre ostatné indexy a scrapery. Poradie zodpovedá prioritám z výskumu.
  keywords: [
    'test digitálnej zrelosti',
    'digitálna zrelosť firmy',
    'audit digitalizácie',
    'digitálny audit firmy',
    'digitalizácia firmy',
    'digitalizácia malej firmy',
    'digitalizácia firemných procesov',
    'ako digitalizovať firmu',
    'hodnotenie digitálnej zrelosti',
    'digitálna zrelosť test online zadarmo',
    'automatizácia procesov vo firme',
    'ako začať s AI vo firme',
    'povinná e-fakturácia 2027',
    'NIS2 povinnosti firmy',
    'dotácie na digitalizáciu',
    'index digitálnej intenzity DII',
    'DESI index Slovensko',
    'digitálna transformácia MSP',
    'malé a stredné podniky',
    'Slovensko',
  ],
  authors: [{ name: 'digitalizuj.to', url: siteUrl }],
  creator: 'digitalizuj.to',
  publisher: 'digitalizuj.to',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/sk',
    // Self-referencing hreflang: explicitne deklaruje jazykové zacielenie
    // sk-SK. Zároveň je to miesto, kam pribudne cs-CZ, ak vznikne česká
    // verzia — dopyty ("digitalizace firmy") sa výrazne prekrývajú a musia
    // sa riešiť cez hreflang, nie duplicitným obsahom.
    // Kompletná hreflang mapa — každá mutácia odkazuje na všetky ostatné,
    // inak ich Google považuje za samostatné (a navzájom duplicitné) stránky.
    languages: {
      'sk-SK': '/sk',
      'cs-CZ': '/cs',
      'de-DE': '/de',
      'en-GB': '/en',
      'x-default': '/sk',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'sk_SK',
    url: siteUrl,
    siteName: 'digitalizuj.to',
    title: 'Test digitálnej zrelosti firmy — zadarmo, za 5 minút, bez registrácie',
    description: longDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'digitalizuj.to — bezplatný test digitálnej zrelosti firmy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test digitálnej zrelosti firmy — zadarmo, za 5 minút',
    description:
      'DII skóre vs. EÚ a SK, index technologického dlhu, pripravenosť na e-fakturáciu 2027 a NIS2, odhad úspor. Anonymne, bez registrácie.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  category: 'business',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#fbfbfd',
  colorScheme: 'light',
};

/**
 * Globálny JSON-LD graf.
 *
 * Organization a WebSite platia pre celý web, preto zostávajú tu.
 * WebApplication opisuje samotný nástroj — ideálne by patril iba na `/`,
 * ale app/(assessment)/page.tsx je mimo rozsahu tejto zmeny, takže uzol
 * ostáva globálny a je explicitne ukotvený na `${siteUrl}/` cez `url`
 * a `mainEntityOfPage`. Per-route uzly (BreadcrumbList, Dataset, FAQPage)
 * si pridávajú jednotlivé stránky samy.
 *
 * Zámerne TU NIE JE `aggregateRating`: nemáme žiadne reálne hodnotenia
 * a vymyslené rating dáta sú porušenie Google structured-data guidelines.
 * Bez ratingu markup prejde validáciou, len nespustí app rich result.
 * Rovnako chýba `logo` — kým v /public nebude reálny logo asset
 * (min. 112 × 112 px), odkazovať naň by znamenalo rozbitý structured data.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'digitalizuj.to',
      url: siteUrl,
      description: longDescription,
      // sameAs je vlastnosť, cez ktorú vyhľadávače overujú entitu.
      // Uvádzame len profily, ktoré reálne existujú (odkaz na repozitár
      // je aj vo footeri). Ďalšie (LinkedIn, Wikidata) sem pribudnú, keď
      // budú založené — nevymýšľame URL, ktoré neexistujú.
      sameAs: ['https://github.com/PRAESTAR/digitalizuj'],
      areaServed: {
        '@type': 'Country',
        name: 'Slovakia',
      },
      knowsAbout: [
        'Digitálna zrelosť malých a stredných podnikov',
        'Digital Intensity Index (Eurostat, ISOC_E_DII)',
        'Operational Digital Readiness Model (ODRM)',
        'Audit digitalizácie firmy',
        'Automatizácia firemných procesov',
        'Povinná elektronická fakturácia v SR od 1. 1. 2027 (Peppol, EN 16931)',
        'NIS2 a zákon č. 366/2024 Z. z. o kybernetickej bezpečnosti',
        'Technologický dlh a prevádzkové riziká',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'digitalizuj.to',
      alternateName: 'digitalizuj.to — test digitálnej zrelosti firmy',
      description: longDescription,
      inLanguage: 'sk-SK',
      publisher: { '@id': `${siteUrl}/#organization` },
      mainEntity: { '@id': `${siteUrl}/#webapp` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'digitalizuj.to — test digitálnej zrelosti firmy',
      url: siteUrl,
      mainEntityOfPage: `${siteUrl}/`,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Digital maturity assessment',
      operatingSystem: 'Web',
      browserRequirements: 'Vyžaduje JavaScript. Funguje v každom modernom prehliadači.',
      inLanguage: 'sk-SK',
      countriesSupported: 'SK',
      softwareVersion: '1.1.0',
      releaseNotes: `${siteUrl}/changelog`,
      isAccessibleForFree: true,
      description: longDescription,
      provider: { '@id': `${siteUrl}/#organization` },
      audience: {
        '@type': 'BusinessAudience',
        audienceType: 'Malé a stredné podniky (MSP) na Slovensku',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'DII-Compatible Score — porovnanie s benchmarkom EÚ a SK (Eurostat ISOC_E_DII 2025)',
        'Operational Readiness Score — prevádzková zrelosť v 6 oblastiach (ODRM)',
        'AI & Automatizácia Readiness — prierezový index pripravenosti na AI',
        'Technical Debt & Risk Index — 14 rizikových faktorov vrátane e-fakturácie 2027 a NIS2',
        'Business Impact Potential — odhad ročných úspor v hodinách, MD a EUR (3 scenáre)',
        'Prioritizované odporúčania v 3-fázovej roadmape',
        'Adaptívny dotazník s branching logikou (15 alebo 43–49 otázok)',
        'Spracovanie výlučne v prehliadači — bez registrácie a bez odosielania dát',
      ],
      isBasedOn: [
        'https://ec.europa.eu/eurostat/databrowser/view/isoc_e_dii/default/table',
      ],
    },
  ],
};

/**
 * Predgenerovanie všetkých jazykových mutácií — bez toho by sa stránky
 * renderovali na požiadanie a stratili by sme statický build (62 stránok).
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Neznámy jazyk v URL (napr. /fr/...) → 404, nie tichý fallback.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Nutné, aby zostalo statické renderovanie — bez toho next-intl prepne
  // stránku na dynamickú.
  setRequestLocale(locale);

  const t = await getTranslations();

  return (
    <html
      lang={LOCALE_META[locale as Locale].htmlLang}
      className={`${onest.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-[#fbfbfd] text-[#1d1d1f]">
        {/* Obnoví zvolenú veľkosť písma ešte pred prvým vykreslením, aby text
            pri načítaní stránky "neposkočil" zo 150 % späť na 100 %.
            Statický, vývojárom napísaný kód — žiadny používateľský vstup sa
            doň neinterpoluje (rovnaká trieda bezpečnosti ako JSON-LD nižšie). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=localStorage.getItem('digitalizuj.textScale');if(s==='125'||s==='150'){document.documentElement.style.fontSize=s+'%'}}catch(e){}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider>
          <a href="#main-content" className="skip-to-content">
            {t('common.skipToContent')}
          </a>
          {/* Prepínač jazyka plává NAD obsahom, nie vo vlastnom páse.
              Pás mal vlastné pozadie aj spodnú linku, takže nad hero sekciou
              vznikol viditeľný svetelný zlom — aurora wash doň nesiahal.
              Takto sedí priamo v hero sekcii, na jej vlastnom podklade.
              pointer-events-none na obale, aby priehľadná plocha cez celú
              šírku neblokovala kliky do obsahu pod ňou. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-2 flex justify-end">
              <div className="pointer-events-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          <main id="main-content" className="flex-1">
            {children}
          </main>
        {/* Reklamný banner — zatiaľ placeholder slot (bude nahradený reálnou
            reklamou), preto tichý/neutrálny, bez animácie a bez farebného
            gradientu, aby nekonkuroval zvyšku stránky. */}
        {/* px-4: bez horizontálneho paddingu sa banner na 320 px displeji
            dotýkal oboch okrajov — rovnaký odstup ako má obsah stránok. */}
        <div className="px-4 py-6">
          <a
            href="#"
            className="banner-cta"
            aria-label={t('footer.adBanner')}
          >
            {t('footer.adBanner')}
          </a>
        </div>
        <footer className="border-t border-black/5 bg-[#fbfbfd] mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Na telefónoch skrytý: mobilné prehliadače aj samotný systém už
                majú vlastné zväčšovanie textu, takže vlastný ovládač je tam
                zbytočný a len uberá miesto. Od sm (640 px) vyššie sa zobrazí. */}
            <div className="hidden sm:flex justify-end mb-5">
              <TextSizeControl />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#86868b]">
              <span className="text-center sm:text-left">
                {t('footer.tagline')} &middot; {t('footer.benchmark')}
              </span>
              {/* flex-wrap: na 320 px sa tri odkazy s 44 px dotykovou plochou
                  do jedného riadku nezmestia — radšej zalomiť než pretiecť.
                  min-h-11 + px-3 zdvíha cieľovú plochu na minimum podľa
                  WCAG 2.2 (2.5.8); vizuálna veľkosť textu zostáva rovnaká. */}
              <div className="flex flex-wrap items-center justify-center gap-y-1">
                <Link
                  href="/peers"
                  className="inline-flex items-center min-h-11 px-3 hover:text-[#0068d6] transition-colors font-medium"
                >
                  {t('footer.peers')}
                </Link>
                <span aria-hidden="true" className="text-[#d2d2d7]">
                  &middot;
                </span>
                <Link
                  href="/changelog"
                  className="inline-flex items-center min-h-11 px-3 hover:text-[#0068d6] transition-colors font-medium"
                >
                  {t('footer.changelog')}
                </Link>
                <span aria-hidden="true" className="text-[#d2d2d7]">
                  &middot;
                </span>
                {/* Pôvodné text-[10px] vo farbe #d2d2d7 malo na pozadí #fbfbfd
                    kontrast ~1,5:1 — nečitateľné. text-xs + #86868b je zhodné
                    so zvyškom päty. */}
                <span className="inline-flex flex-wrap items-center justify-center gap-x-1 font-mono text-xs text-[#86868b]">
                  <span>v1.1.0 &middot; build</span>
                  <a
                    href={`https://github.com/PRAESTAR/digitalizuj/commit/${process.env.NEXT_PUBLIC_COMMIT_HASH || 'main'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center min-h-11 px-2 break-all hover:text-[#0068d6] transition-colors underline decoration-dotted underline-offset-2"
                  >
                    {process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev'}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
