import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

// Next.js 16 premenoval konvenciu middleware -> proxy (viď
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
// next-intl stále exportuje factory pod menom createMiddleware; dôležitý je
// názov SÚBORU a exportu, nie názov importu.
const handleI18n = createMiddleware(routing);

/**
 * Obal okolo next-intl middlewaru kvôli `Vary` hlavičke.
 *
 * Presmerovanie z `/` je content-negotiated — cieľ (/sk vs /de) závisí od
 * Accept-Language a od NEXT_LOCALE cookie. Bez `Vary` smie akákoľvek cache
 * (CDN, proxy, prehliadač) uložiť odpoveď pre jedného používateľa a servírovať
 * ju všetkým: nemecký návštevník by dostal cachnutý redirect na /sk. SEO
 * audit našiel, že odpoveď neniesla Vary vôbec.
 */
export function proxy(req: NextRequest) {
  const res = handleI18n(req);
  if (res.headers.has('location')) {
    res.headers.append('Vary', 'Accept-Language');
    res.headers.append('Vary', 'Cookie');
  }
  return res;
}

export const config = {
  /**
   * Proxy beží len na stránkach — nie na statických assetoch, API,
   * ani na súboroch, ktoré musia zostať na koreni domény bez jazykového
   * prefixu (robots.txt, sitemap.xml, manifest, llms.txt).
   * Keby sa im pridal prefix, crawlery by ich nenašli.
   *
   * `icon` a `favicon.ico` vo výnimkách zostávajú, hoci ikony boli
   * odstránené (5. 8. 2026): prehliadače si `/favicon.ico` pýtajú samy od
   * seba a bez výnimky by ten request middleware presmeroval na /sk/favicon.ico
   * namiesto čistej 404. Pri návrate ikony sa nemusí meniť nič.
   * OG obrázok sa presunul pod [locale] (/sk/opengraph-image), ten prefix má
   * mať; koreňová výnimka zostáva pre prípadné staré odkazy.
   */
  matcher: [
    '/((?!api|_next|_vercel|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|opengraph-image|icon|favicon\\.ico|llms\\.txt|.*\\..*).*)',
  ],
};
