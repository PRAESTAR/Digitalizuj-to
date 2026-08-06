import type { Metadata, Viewport } from 'next';
import { Onest, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import '../globals.css';
import TextSizeControl from '@/components/ui/TextSizeControl';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import LocaleSuggestionBanner from '@/components/ui/LocaleSuggestionBanner';
import GoogleAnalytics from '@/components/ui/GoogleAnalytics';
import AdBanner from '@/components/ui/AdBanner';
import { Link } from '@/i18n/navigation';
import { routing, LOCALE_META, type Locale } from '@/i18n/routing';
import { SITE_URL, OG_LOCALE, localeAlternates } from '@/lib/seo';
// SiteHeader dočasne vypnutý — komponent zostáva v components/ui/SiteHeader.tsx.
// AssessmentProvider už nie je tu — je scoped na app/(assessment)/layout.tsx,
// aby stránky mimo kvízu (/peers, /changelog, /r/[hash]) neťahali 80KB
// otázkovej banky a scoring enginy do svojho JS bundlu.

// Onest — variable, SF Pro–ublízke geometrické proporcie, plná podpora
// slovenskej diakritiky (latin-ext). Nesie primárnu typografiu celej stránky.
// Váha 'variable' (celá os), nie výčet: výčet ['400','500',...] núti
// next/font stiahnuť a preloadovať samostatnú statickú inštanciu pre každú
// váhu × subset (12 woff2 preloadov na každej stránke, súperia s LCP).
// 'variable' = jeden variabilný súbor na subset, vzhľad identický.
const onest = Onest({
  variable: '--font-onest',
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = SITE_URL;

/**
 * Metadata sú funkciou jazyka, nie konštantou.
 *
 * Statický export tu bol kritická SEO chyba nájdená auditom: každá jazyková
 * mutácia deklarovala canonical '/sk', slovenský titulok a og:locale sk_SK —
 * Google tým dostal pokyn de-indexovať /cs, /de aj /en a hreflang mapa si
 * protirečila s canonicalom. Teraz je každá mutácia self-canonical
 * s vlastným prekladom.
 *
 * Zámerne TU NIE JE openGraph.images ani twitter.*: obrázok dodáva
 * file-konvencia app/[locale]/opengraph-image.tsx (musí sedieť v TOMTO
 * segmente — na app roote sa resolvoval bez metadataBase a build hádzal
 * localhost warning na každej stránke) a Next si twitter kartu doplní
 * z openGraph sám, takže podstránky nezdedia titulok homepage.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = (hasLocale(routing.locales, raw) ? raw : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      // Titulok cieli na vyhľadávanú frázu, značka až za oddeľovačom.
      default: t('title'),
      template: '%s | MATPEX SK',
    },
    // Do 155 znakov, konkrétny prísľub (čas, výstup), diferenciátory vpredu.
    description: t('description'),
    applicationName: 'digitalizuj.to',
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    // Google meta keywords ignoruje; ponechané ako kompaktný tematický signál
    // pre ostatné indexy a scrapery. Zámerne po slovensky vo všetkých
    // mutáciách — cielia na slovenský trh, ktorý je primárny.
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
    // /sk a nie holý koreň — koreň 307-kuje a rel=author by bol jediný
    // presmerúvajúci odkaz v <head>.
    // Autor/vydavateľ je SPOLOČNOSŤ (MATPEX SK), nie produkt: „digitalizuj.to"
    // je marketingový názov nástroja, ktorý za ním stojí ako značka, nie
    // právny subjekt. Rovnaké rozlíšenie drží aj JSON-LD nižšie.
    authors: [{ name: 'MATPEX SK', url: `${siteUrl}/sk` }],
    creator: 'MATPEX SK',
    publisher: 'MATPEX SK',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      // Self-canonical na vlastnú mutáciu + kompletná hreflang mapa.
      // Platí pre homepage (jediná plne preložená routa) — podstránky si
      // canonical prepisujú samy podľa stavu prekladu (viď lib/seo.ts).
      canonical: `/${locale}`,
      languages: localeAlternates(''),
    },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
      // og:url = canonical. Predtým ukazovala na holý koreň, ktorý presmeruje.
      url: `/${locale}`,
      siteName: 'digitalizuj.to',
      title: t('ogTitle'),
      description: t('description'),
    },
    twitter: {
      card: 'summary_large_image',
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#fbfbfd',
  colorScheme: 'light',
};

/**
 * Globálny JSON-LD graf — funkcia jazyka, nie konštanta.
 *
 * Organization a WebSite platia pre celý web, preto zostávajú tu.
 * WebApplication opisuje samotný nástroj. Per-route uzly (BreadcrumbList,
 * Dataset, FAQPage) si pridávajú jednotlivé stránky samy.
 *
 * Audit našiel dve chyby pôvodnej konštanty: inLanguage tvrdil sk-SK aj na
 * nemeckej stránke a url polia ukazovali na holé (presmerúvajúce) adresy.
 * `@id` kotvy zostávajú stabilné naprieč mutáciami, takže vyhľadávač si
 * štyri jazykové kópie zdeduplikuje na jednu entitu.
 *
 * Zámerne TU NIE JE `aggregateRating` (nemáme reálne hodnotenia — vymyslené
 * sú porušenie Google guidelines), `logo` (v /public nie je reálny asset
 * min. 112×112 px) ani `sameAs` — GitHub repozitár vracia 404, a sameAs
 * s nefunkčnou URL je horší signál než žiadny. Vráti sa, keď bude repo
 * verejné alebo vznikne LinkedIn profil.
 */
function buildJsonLd(locale: Locale, description: string) {
  const lang = LOCALE_META[locale].htmlLang;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // Organization = REÁLNA spoločnosť za projektom. „digitalizuj.to" je
        // marketingový názov samotného nástroja a žije nižšie ako WebSite
        // a WebApplication; miešať ich do jedného uzla by vyhľadávaču tvrdilo,
        // že produkt je firma. Právna forma, IČO ani adresa tu zámerne nie sú —
        // doplniť až s overenými údajmi, vymyslené sú horšie než žiadne.
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'MATPEX SK',
        url: `${siteUrl}/sk`,
        description,
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
        url: `${siteUrl}/sk`,
        name: 'digitalizuj.to',
        alternateName: 'digitalizuj.to — test digitálnej zrelosti firmy',
        description,
        // Web existuje v štyroch jazykoch; uzol je zdieľaný, tak ich uvádza všetky.
        inLanguage: routing.locales.map((l) => LOCALE_META[l].htmlLang),
        publisher: { '@id': `${siteUrl}/#organization` },
        mainEntity: { '@id': `${siteUrl}/#webapp` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}/#webapp`,
        name: 'digitalizuj.to — test digitálnej zrelosti firmy',
        url: `${siteUrl}/${locale}`,
        mainEntityOfPage: `${siteUrl}/${locale}`,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Digital maturity assessment',
        operatingSystem: 'Web',
        browserRequirements: 'Vyžaduje JavaScript. Funguje v každom modernom prehliadači.',
        inLanguage: lang,
        countriesSupported: 'SK',
        softwareVersion: '1.0.0',
        releaseNotes: `${siteUrl}/sk/changelog`,
        isAccessibleForFree: true,
        description,
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
          'Adaptívny dotazník s branching logikou (19 alebo 50–58 otázok)',
          'Odpovede aj výpočet výlučne v prehliadači — bez registrácie a bez odosielania odpovedí na server',
        ],
        isBasedOn: [
          'https://ec.europa.eu/eurostat/databrowser/view/isoc_e_dii/default/table',
        ],
      },
    ],
  };
}

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
  const jsonLd = buildJsonLd(locale as Locale, t('meta.description'));

  return (
    <html
      lang={LOCALE_META[locale as Locale].htmlLang}
      className={`${onest.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-[#fbfbfd] text-[#1d1d1f]">
        {/* Cookie banner (CookieYes). Zámerne ako obyčajný <script> v SSR HTML,
            nie cez next/script ani podmienene z Reactu: musí bežať čo najskôr
            a nezávisle od hydratácie — je to jediná vec, ktorá sa načíta pred
            súhlasom, lebo bez nej by sa nemal kto pýtať. Meranie samo (GA4)
            čaká na jeho rozhodnutie, viď GoogleAnalytics nižšie.
            Kľúč v URL je verejný identifikátor webu, nie tajomstvo.
            POZOR pri lokálnom vývoji: skript má natvrdo zadrôtované
            `registeredDomain: "matpex.sk"` a na inom hostiteľovi (localhost)
            zámerne vyhodí výnimku „Looks like your website URL has changed".
            Nie je to chyba nasadenia — banner sa dá overiť len na ostrej
            doméne. Dôsledok je bezpečný: bez bannera niet súhlasu, teda sa
            lokálne nespustí ani meranie.
            SRI (`integrity`) tu zámerne NIE JE: dodávateľ skript priebežne
            mení a hash by pri prvej ich aktualizácii zhodil zber súhlasu. */}
        <script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/af08152e82680b3cb39ae1711a14ff62/script.js"
        />
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
        {/* Meranie návštevnosti. Nevykresľuje nič a gtag.js pripojí až po
            udelení súhlasu — bez neho na Google neodíde ani IP adresa. */}
        <GoogleAnalytics />
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
            <div className="site-container pt-2 flex justify-end">
              <div className="pointer-events-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          <main id="main-content" className="flex-1">
            {children}
          </main>
          {/* Geo ponuka jazyka — vykreslí sa len návštevníkovi bez uloženej
              voľby, ktorého krajina mapuje na inú mutáciu než aktuálnu. */}
          <LocaleSuggestionBanner />
        <footer className="border-t border-black/5 bg-[#fbfbfd] mt-auto">
          <div className="site-container py-6">
            {/* Reklamný banner a ovládač veľkosti textu zdieľajú jeden riadok:
                banner vľavo na osi obsahu päty, ovládač vpravo. Samostatný
                riadok pre banner by pätu predĺžil o celú jeho výšku (90 px)
                bez toho, aby čokoľvek pribudlo. Banner žije v päte, nie nad
                ňou — inak visel v prázdnom páse medzi obsahom a pätou. */}
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 mb-5">
              <AdBanner />
              {/* Na telefónoch skrytý: mobilné prehliadače aj samotný systém už
                  majú vlastné zväčšovanie textu, takže vlastný ovládač je tam
                  zbytočný a len uberá miesto. Od sm (640 px) vyššie sa zobrazí. */}
              <div className="hidden sm:flex shrink-0">
                <TextSizeControl />
              </div>
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
                  href="/metodika"
                  className="inline-flex items-center min-h-11 px-3 hover:text-[#0068d6] transition-colors font-medium"
                >
                  {t('footer.methodology')}
                </Link>
                <span aria-hidden="true" className="text-[#d2d2d7]">
                  &middot;
                </span>
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
                  <span>v1.0.0 &middot; build</span>
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
