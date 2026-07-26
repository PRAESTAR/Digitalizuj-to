import { defineRouting } from 'next-intl/routing';

/**
 * Jazykové mutácie digitalizuj.to.
 *
 * `localePrefix: 'always'` — každý jazyk vrátane slovenčiny má vlastný prefix
 * (/sk, /cs, /de, /en). Je to symetrické a jednoznačné: neexistuje URL bez
 * jazyka, ktorá by sa musela zvlášť riešiť v canonical a hreflang značkách.
 * Cena je, že pôvodné adresy (/, /peers, ...) sa menia — preto middleware
 * presmeruje koreň na predvolený jazyk a next.config.ts drží trvalé
 * presmerovania zo starých ciest.
 *
 * POZOR na platnosť modelu: benchmark aj mzdová kotva sú kalibrované per
 * krajinu (viď data/benchmarkData.ts). Jazyk NIE JE to isté ako krajina —
 * nemecky hovoriaci používateľ na Slovensku má vidieť slovenský benchmark.
 * Preto sa krajina rieši samostatne a jazyk určuje len jazyk rozhrania.
 */
export const routing = defineRouting({
  locales: ['sk', 'cs', 'de', 'en'],
  defaultLocale: 'sk',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/** Metadáta pre prepínač jazykov — vlajka + názov v danom jazyku. */
export const LOCALE_META: Record<Locale, { flag: string; label: string; htmlLang: string }> = {
  sk: { flag: '🇸🇰', label: 'Slovenčina', htmlLang: 'sk-SK' },
  cs: { flag: '🇨🇿', label: 'Čeština', htmlLang: 'cs-CZ' },
  de: { flag: '🇩🇪', label: 'Deutsch', htmlLang: 'de-DE' },
  en: { flag: '🇬🇧', label: 'English', htmlLang: 'en-GB' },
};

/**
 * Locale pre Intl.* formátovanie (meny, dátumy, čísla).
 * Doteraz bolo 'sk-SK' natvrdo na ~20 miestach — teraz sa odvodí od jazyka.
 */
export function intlLocale(locale: Locale): string {
  return LOCALE_META[locale].htmlLang;
}
