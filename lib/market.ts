import type { Locale } from '@/i18n/routing';

/**
 * Trh (krajina referenčných čísel) odvodený od jazykovej mutácie.
 *
 * Medzikrok k úlohe #34 (krajina ako primárna os): dnes voľba vlajky určuje
 * jazyk AJ referenčné metriky naraz — slovenčina nesie slovenské čísla,
 * čeština české, EÚ vlajka anglické rozhranie s priemerom EÚ-27.
 *
 * Vedomé zjednodušenie: „nemecky hovoriaci na Slovensku" si dnes vybrať
 * kombináciu nevie — plná matica krajina × jazyk príde s #34.
 */
export type Market = 'SK' | 'CZ' | 'EU27';

export const LOCALE_TO_MARKET: Record<Locale, Market> = {
  sk: 'SK',
  cs: 'CZ',
  en: 'EU27',
};

/** Krátke označenie trhu do textov porovnaní (gap labely, titulky kariet). */
export const MARKET_LABEL: Record<Market, string> = {
  SK: 'SK',
  CZ: 'ČR',
  EU27: 'EÚ',
};

export function marketForLocale(locale: string): Market {
  return LOCALE_TO_MARKET[locale as Locale] ?? 'SK';
}
