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
/**
 * Tri možnosti = tri trhy (medzikrok k úlohe #34, krajina ako primárna os):
 * slovenčina nesie slovenské referenčné čísla, čeština české a EÚ vlajka
 * anglické rozhranie s priemerom EÚ-27. Nemčina vyradená rozhodnutím
 * z 2. 8. 2026 (messages/de.json žije v git histórii, vráti sa s #34).
 */
export const routing = defineRouting({
  locales: ['sk', 'cs', 'en'],
  defaultLocale: 'sk',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/** Metadáta pre prepínač — vlajka reprezentuje TRH (en = EÚ vlajka). */
export const LOCALE_META: Record<Locale, { flag: string; label: string; htmlLang: string }> = {
  sk: { flag: '🇸🇰', label: 'Slovenčina', htmlLang: 'sk-SK' },
  cs: { flag: '🇨🇿', label: 'Čeština', htmlLang: 'cs-CZ' },
  en: { flag: '🇪🇺', label: 'English (EU)', htmlLang: 'en' },
};

/**
 * Locale pre Intl.* formátovanie (meny, dátumy, čísla).
 * Doteraz bolo 'sk-SK' natvrdo na ~20 miestach — teraz sa odvodí od jazyka.
 */
export function intlLocale(locale: Locale): string {
  return LOCALE_META[locale].htmlLang;
}
