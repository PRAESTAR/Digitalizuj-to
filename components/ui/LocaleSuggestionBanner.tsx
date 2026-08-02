'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { persistLocaleChoice, hasLocaleChoice } from '@/lib/localeChoice';
import type { Locale } from '@/i18n/routing';

/**
 * Nenásilná ponuka jazyka podľa krajiny návštevníka.
 *
 * Zámerne BANNER, nie tvrdý redirect: geo presmerovania rozbíjajú SEO
 * (crawler chodí z USA), cache aj zdieľané odkazy, a mýlia sa (VPN,
 * dochádzanie cez hranice). Koreň webu rieši jazyk PREHLIADAČA
 * (Accept-Language v .htaccess); tento banner dopĺňa druhý signál —
 * KRAJINU — pre návštevníkov, ktorí prišli hlbokým odkazom na mutáciu,
 * ktorá ich krajine nezodpovedá.
 *
 * Krajina sa číta zo same-origin /geo.php (Cloudflare CF-IPCountry na
 * hostingu) — žiadna tretia strana, žiadny zásah do CSP.
 *
 * Text ponuky je v CIEĽOVOM jazyku (návštevník, ktorému je určená, mu
 * rozumie; aktuálny jazyk stránky číta zjavne tiež, preto je tlačidlo
 * „zostať" v aktuálnom jazyku). Vzory z jazykových interstitialov.
 *
 * Rešpekt voľby: akonáhle si používateľ jazyk vybral (bannerom ALEBO
 * vlajkovým prepínačom — obe cesty volajú persistLocaleChoice), banner sa
 * už nikdy nezobrazí a koreňová negociácia číta uloženú voľbu z cookie
 * ešte pred Accept-Language.
 */

/** Krajina → jazyk mutácie. Krajiny mimo zoznamu ponuku nedostanú. */
// SK a CZ maju vlastne mutacie; VSETKY ostatne krajiny mapuju na EU/anglicku
// verziu (EU vlajka = priemer EU-27). Ziadny zoznam krajin — default je 'en'.
const COUNTRY_TO_LOCALE = (country: string): Locale =>
  country === 'SK' ? 'sk' : country === 'CZ' ? 'cs' : 'en';

/** Veta ponuky + tlačidlo prepnutia v CIEĽOVOM jazyku. */
const OFFER: Record<Locale, { text: string; cta: string }> = {
  sk: { text: 'Tento web je dostupný aj v slovenčine.', cta: 'Prepnúť do slovenčiny' },
  cs: { text: 'Tento web je k dispozici i v češtině.', cta: 'Přepnout do češtiny' },
  en: { text: 'This website is also available in English.', cta: 'Switch to English' },
};

export default function LocaleSuggestionBanner() {
  const t = useTranslations('suggestion');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [target, setTarget] = useState<Locale | null>(null);

  useEffect(() => {
    // Používateľ už raz rozhodol — nikdy viac nenavrhovať.
    if (hasLocaleChoice()) return;

    const ctl = new AbortController();
    fetch('/geo.php', { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { country?: string | null } | null) => {
        const suggested = data?.country ? COUNTRY_TO_LOCALE(data.country) : undefined;
        if (suggested && suggested !== locale) setTarget(suggested);
      })
      .catch(() => {
        // Bez geo informácie žiadna ponuka — ticho, nie je to chyba UX.
      });
    return () => ctl.abort();
  }, [locale]);

  if (!target) return null;

  const offer = OFFER[target];

  const choose = (chosen: Locale) => {
    persistLocaleChoice(chosen);
    setTarget(null);
    if (chosen !== locale) {
      router.replace(pathname, { locale: chosen });
    }
  };

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={offer.text}
      className="fixed inset-x-0 bottom-4 z-40 px-4 pointer-events-none animate-fade-in-up"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-3xl sm:rounded-full bg-white/95 backdrop-blur border border-black/10 shadow-lg px-5 py-3">
        <p className="text-sm text-[#1d1d1f] text-center" lang={target}>
          {offer.text}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            lang={target}
            onClick={() => choose(target)}
            className="min-h-11 px-4 rounded-full bg-[#1d1d1f] text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            {offer.cta}
          </button>
          <button
            type="button"
            onClick={() => choose(locale)}
            className="min-h-11 px-3 rounded-full text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
          >
            {t('stay')}
          </button>
        </div>
      </div>
    </div>
  );
}
