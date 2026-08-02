import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

// Nutne pre output: 'export' — bez toho build padne s "dynamic not configured".
// V serverovom rezime neskodne (routa je aj tak staticka).
export const dynamic = 'force-static';

/**
 * `lastModified` zámerne NIE JE `new Date()`.
 *
 * Build time by pri každom deploji (aj čisto technickom) tvrdil, že sa
 * obsah zmenil. Nepresný lastmod vyhľadávače po čase začnú ignorovať,
 * čím sa stráca signál čerstvosti — a ten je pri legislatívnych témach
 * (e-fakturácia 2027, NIS2) to najcennejšie, čo sitemap vie odovzdať.
 */
const LAST_CONTENT_UPDATE = new Date('2026-07-27T00:00:00.000Z');
const LAST_RELEASE = new Date('2026-08-02T00:00:00.000Z');

/** hreflang kódy zhodné s layoutom (lib/seo.ts). */
const HREFLANG: Record<string, string> = {
  sk: 'sk-SK',
  cs: 'cs-CZ',
  en: 'en',
};

/** Mapa alternates pre routu preloženú do všetkých jazykov. */
function languageAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[HREFLANG[l]] = absoluteUrl(`/${l}${path}`);
  }
  languages['x-default'] = absoluteUrl(`/sk${path}`);
  return { languages };
}

/**
 * V sitemape sú len stránky, ktoré chceme mať zaindexované, a len v tých
 * jazykoch, v ktorých reálne existuje preložený obsah.
 *
 * PO i18n MIGRÁCII (kritický nález SEO auditu): pôvodná sitemap obsahovala
 * len staré bezjazykové URL (/, /peers, /changelog), ktoré všetky 308-kujú —
 * čiže nula indexovateľných adries. Teraz:
 *
 *  - Homepage je preložená vo všetkých 4 jazykoch → 4 záznamy, každý
 *    s kompletnou hreflang mapou (alternates.languages podporuje priamo
 *    sitemap konvencia tejto verzie Nextu).
 *  - /peers, /changelog, /metodika majú zatiaľ len slovenský obsah → iba
 *    /sk/ verzie, bez hreflang. Jazykové varianty sa pridajú, keď sa routa
 *    preloží (vtedy dostane aj self-canonical + hreflang v metadata).
 *
 * Vedome tu NIE SÚ:
 *  - /quiz    — crawlovateľný, ale `noindex` (bez rozbehnutého hodnotenia
 *               renderuje prázdny stav). Sitemap s noindex stránkou je
 *               protirečivý signál.
 *  - /results — stavová stránka, `noindex`.
 *  - /r/[hash] — zdieľané výsledky, `noindex,nofollow`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const homepages: MetadataRoute.Sitemap = routing.locales.map((l) => ({
    // Vstupná stránka nástroja — sem smerujú všetky komerčné dopyty.
    url: absoluteUrl(`/${l}`),
    lastModified: LAST_CONTENT_UPDATE,
    changeFrequency: 'weekly',
    priority: 1,
    alternates: languageAlternates(''),
  }));

  return [
    ...homepages,
    {
      // Jediná stránka s vlastnými dátami — najvyššia citovateľná hodnota
      // po homepage. Pribúdajú do nej výsledky, preto weekly.
      url: `${SITE_URL}/sk/peers`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      // Verejná metodika — E-E-A-T kotva a najbohatší faktický obsah webu.
      url: `${SITE_URL}/sk/metodika`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      // Signál čerstvosti a auditovateľnosti metodiky; mení sa s releasmi.
      url: `${SITE_URL}/sk/changelog`,
      lastModified: LAST_RELEASE,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
