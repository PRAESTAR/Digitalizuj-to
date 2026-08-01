import type { Locale } from '@/i18n/routing';

/**
 * Trvalá voľba jazyka — jediné miesto, ktoré o nej rozhoduje.
 *
 * Zapisuje sa DVAKRÁT zámerne:
 *  - cookie NEXT_LOCALE číta .htaccess pri koreňovej negociácii `/` —
 *    uložená voľba má prednosť pred Accept-Language (server-side, funguje
 *    aj bez JavaScriptu pri návrate na koreň),
 *  - localStorage číta LocaleSuggestionBanner — akonáhle voľba existuje,
 *    geo ponuka sa už nikdy nezobrazí.
 *
 * Voľbu ukladá banner AJ vlajkový prepínač — manuálne kliknutie na vlajku
 * je rovnako silné rozhodnutie ako odpoveď na ponuku.
 */

const LS_KEY = 'digitalizuj.localeChoice';

export function persistLocaleChoice(locale: Locale): void {
  try {
    localStorage.setItem(LS_KEY, locale);
  } catch {
    // Súkromný režim bez localStorage — cookie nižšie stále zaberie.
  }
  // Rok platnosti; SameSite=Lax stačí — cookie číta len vlastný server.
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function hasLocaleChoice(): boolean {
  try {
    if (localStorage.getItem(LS_KEY)) return true;
  } catch {
    // pokračuj na cookie
  }
  return /(^|;\s*)NEXT_LOCALE=/.test(document.cookie);
}
