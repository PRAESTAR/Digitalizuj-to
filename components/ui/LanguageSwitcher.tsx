'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_META, type Locale } from '@/i18n/routing';
import FlagIcon from './FlagIcon';

/**
 * Prepínač jazyka — vlajky vpravo hore.
 *
 * Zámerne bez rozbaľovacieho menu: štyri jazyky sa zmestia vedľa seba aj na
 * telefóne a jedno klepnutie je rýchlejšie než otvoriť menu a vybrať z neho.
 *
 * `usePathname` z i18n/navigation vracia cestu BEZ jazykového prefixu, takže
 * pri prepnutí jazyka zostane používateľ na tej istej stránke (/sk/peers ->
 * /de/peers) namiesto toho, aby ho to hodilo na úvod.
 *
 * Vlajka je čisto dekoratívna (aria-hidden) — vlajka nie je jazyk a čítačka
 * obrazovky by z emoji prečítala názov krajiny. Prístupný názov nesie
 * aria-label s riadnym názvom jazyka.
 */
export default function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label={t('languageSwitcher')} className="flex items-center gap-0.5">
      {routing.locales.map((l) => {
        const active = l === locale;
        const meta = LOCALE_META[l];
        return (
          <button
            key={l}
            type="button"
            lang={meta.htmlLang}
            aria-label={meta.label}
            aria-current={active ? 'true' : undefined}
            title={meta.label}
            onClick={() => router.replace(pathname, { locale: l })}
            /* Žiadne pozadie ani rámček. Aktívny jazyk sa odlíši sýtosťou:
               neaktívne vlajky sú odfarbené a stlmené, aktívna je v plnej
               farbe. Dotyková plocha 44 px zostáva, len je neviditeľná. */
            className={`inline-flex items-center justify-center min-h-11 min-w-11 transition-all duration-200 ${
              active
                ? 'opacity-100'
                : 'opacity-45 grayscale hover:opacity-90 hover:grayscale-0'
            }`}
          >
            <FlagIcon locale={l} />
            <span className="sr-only">{meta.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
