import type { MetadataRoute } from 'next';

const siteUrl = 'https://digitalizuj.to';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/quiz', '/results', '/r/', '/peers'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
