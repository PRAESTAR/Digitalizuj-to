import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Next.js 16 premenoval konvenciu middleware -> proxy (viď
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
// next-intl stále exportuje factory pod menom createMiddleware; dôležitý je
// názov SÚBORU a exportu, nie názov importu.
export const proxy = createMiddleware(routing);

export const config = {
  /**
   * Proxy beží len na stránkach — nie na statických assetoch, API,
   * ani na súboroch, ktoré musia zostať na koreni domény bez jazykového
   * prefixu (robots.txt, sitemap.xml, manifest, OG obrázok, favicon).
   * Keby sa im pridal prefix, crawlery by ich nenašli.
   */
  matcher: [
    '/((?!api|_next|_vercel|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|opengraph-image|favicon\\.ico|llms\\.txt|.*\\..*).*)',
  ],
};
