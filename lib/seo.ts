import { routing, LOCALE_META, type Locale } from '@/i18n/routing';

/**
 * Jediný zdroj pravdy pre SEO konštanty a hreflang mapy.
 *
 * Vznikol pri oprave auditu, ktorý našiel tri nezávislé kópie hreflang logiky
 * (layout, sitemap, podstránky) — a každá sa rozišla inak. Podstránky mapu
 * strácali úplne, layout mal natvrdo '/sk' canonical pre všetky jazyky.
 */
export const SITE_URL = 'https://digitalizuj.to';

/** og:locale hodnoty (podčiarkovník, nie pomlčka — OpenGraph konvencia). */
export const OG_LOCALE: Record<Locale, string> = {
  sk: 'sk_SK',
  cs: 'cs_CZ',
  de: 'de_DE',
  en: 'en_GB',
};

/** hreflang kódy zhodné s LOCALE_META.htmlLang (regionálne zacielenie). */
const HREFLANG: Record<Locale, string> = {
  sk: 'sk-SK',
  cs: 'cs-CZ',
  de: 'de-DE',
  en: 'en-GB',
};

/**
 * Kompletná hreflang mapa pre PRELOŽENÚ cestu — každá mutácia odkazuje na
 * všetky ostatné + x-default na slovenskú verziu.
 *
 * Používať IBA na routách, ktorých obsah je reálne preložený (zatiaľ len
 * homepage). Nepreložené routy hreflang nemajú mať vôbec — ich jazykové
 * varianty servírujú ten istý slovenský obsah, čo je duplicita v RÁMCI
 * jedného jazyka, nie jazyková alternatíva. Tie riešia cross-locale
 * canonical na /sk verziu (viď skCanonical nižšie).
 */
export function localeAlternates(path: string = '') {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[HREFLANG[l]] = `/${l}${path}`;
  }
  languages['x-default'] = `/sk${path}`;
  return languages;
}

/**
 * Canonical pre NEPRELOŽENÚ routu: všetky jazykové varianty ukazujú na
 * slovenský originál. Keď sa routa preloží, prejde na self-canonical +
 * localeAlternates a pridá sa do sitemap za všetky jazyky.
 */
export function skCanonical(path: string): string {
  return `/sk${path}`;
}

/** Absolútna URL pre sitemap/JSON-LD (tie neprechádzajú cez metadataBase). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export { LOCALE_META, type Locale };
