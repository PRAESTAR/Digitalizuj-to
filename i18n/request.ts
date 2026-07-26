import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Načítanie správ pre daný jazyk na serveri.
 *
 * Ak požadovaný jazyk nie je v zozname (napr. ručne dopísaná URL /fr/...),
 * spadneme na predvolený namiesto vyhodenia chyby — používateľ dostane
 * funkčnú stránku, nie 500.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
