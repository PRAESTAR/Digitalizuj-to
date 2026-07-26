import type { MetadataRoute } from 'next';

const siteUrl = 'https://digitalizuj.to';

/**
 * `lastModified` zámerne NIE JE `new Date()`.
 *
 * Build time by pri každom deploji (aj čisto technickom) tvrdil, že sa
 * obsah zmenil. Nepresný lastmod vyhľadávače po čase začnú ignorovať,
 * čím sa stráca signál čerstvosti — a ten je pri legislatívnych témach
 * (e-fakturácia 2027, NIS2) to najcennejšie, čo sitemap vie odovzdať.
 * Preto sú tu explicitné dátumy poslednej vecnej zmeny obsahu; pri
 * úprave stránky sa upraví aj príslušná konštanta.
 */
const LAST_CONTENT_UPDATE = new Date('2026-07-25T00:00:00.000Z');
const LAST_RELEASE = new Date('2026-07-24T00:00:00.000Z');

/**
 * V sitemape sú len stránky, ktoré chceme mať zaindexované.
 *
 * Vedome tu NIE SÚ:
 *  - /quiz    — crawlovateľný, ale `noindex` (bez rozbehnutého hodnotenia
 *               renderuje prázdny stav). Sitemap s noindex stránkou je
 *               protirečivý signál.
 *  - /results — stavová stránka, `noindex`.
 *  - /r/[hash] — zdieľané výsledky, `noindex` + Disallow v robots.txt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      // Vstupná stránka nástroja — sem smerujú všetky komerčné dopyty
      // („test digitálnej zrelosti", „audit digitalizácie").
      url: `${siteUrl}/`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      // Jediná stránka s vlastnými dátami — najvyššia citovateľná hodnota
      // po homepage. Pribúdajú do nej výsledky, preto weekly.
      url: `${siteUrl}/peers`,
      lastModified: LAST_CONTENT_UPDATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      // Signál čerstvosti a auditovateľnosti metodiky; mení sa s releasmi.
      url: `${siteUrl}/changelog`,
      lastModified: LAST_RELEASE,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
