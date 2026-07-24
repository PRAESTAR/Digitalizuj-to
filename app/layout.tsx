import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AssessmentProvider } from '@/context/AssessmentContext';
import SiteHeader from '@/components/ui/SiteHeader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = 'https://digitalizuj.to';
const siteTitle = 'digitalizuj.to — Digitálna auditná platforma';
const siteDescription =
  'Digitálna auditná platforma pre malé a stredné podniky. Metodicky obhájiteľné hodnotenie digitálnej zrelosti, rizikový profil a prioritizované odporúčania. Postavená na EU Digital Intensity Index (DII) a Operational Digital Readiness Model (ODRM).';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s | digitalizuj.to',
  },
  description: siteDescription,
  applicationName: 'digitalizuj.to',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'digitálna zrelosť',
    'digitálny audit',
    'digitalizácia SME',
    'DII',
    'Digital Intensity Index',
    'ODRM',
    'digitálna transformácia',
    'audit digitalizácie',
    'malé a stredné podniky',
    'Slovensko',
    'benchmark EÚ',
  ],
  authors: [{ name: 'digitalizuj.to' }],
  creator: 'digitalizuj.to',
  publisher: 'digitalizuj.to',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'sk_SK',
    url: siteUrl,
    siteName: 'digitalizuj.to',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'digitalizuj.to — Digitálna auditná platforma',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#312e81' },
  ],
  colorScheme: 'light',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'digitalizuj.to',
      url: siteUrl,
      description: siteDescription,
      areaServed: {
        '@type': 'Country',
        name: 'Slovakia',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'digitalizuj.to',
      description: siteDescription,
      inLanguage: 'sk-SK',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'digitalizuj.to — Digitálna auditná platforma',
      url: siteUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'sk-SK',
      description: siteDescription,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      featureList: [
        'DII-Compatible Score (EU benchmark)',
        'Operational Readiness Score',
        'Technical Debt & Risk Index',
        'Business Impact Potential',
        'Adaptívny model DAP',
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#main-content" className="skip-to-content">
          Preskočiť na obsah
        </a>
        <AssessmentProvider>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          {/* Banner */}
          <div className="py-6">
            <a
              href="#"
              className="banner-cta"
              aria-label="Potrebujete digitalizovať?"
            >
              Potrebujete digitalizovať?
            </a>
          </div>
          <footer className="border-t border-slate-200 bg-white mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  Adaptívny model DAP &middot; DII-Compatible + ODRM &middot;
                  Benchmark: Eurostat DII 2025 (isoc_e_dii)
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="/peers"
                    className="hover:text-indigo-500 transition-colors font-medium"
                  >
                    Peer výsledky
                  </a>
                  <span className="text-slate-300">&middot;</span>
                  <a
                    href="/changelog"
                    className="hover:text-indigo-500 transition-colors font-medium"
                  >
                    Changelog
                  </a>
                  <span className="text-slate-300">&middot;</span>
                  <span className="font-mono text-[10px] text-slate-300">
                    v1.0.0-pre-alpha &middot; build{' '}
                    <a
                      href={`https://github.com/PRAESTAR/digitalizuj/commit/${process.env.NEXT_PUBLIC_COMMIT_HASH || 'main'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-400 transition-colors underline decoration-dotted underline-offset-2"
                    >
                      {process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev'}
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </AssessmentProvider>
      </body>
    </html>
  );
}
