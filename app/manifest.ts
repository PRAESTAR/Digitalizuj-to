import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'digitalizuj.to — Digitálna auditná platforma',
    short_name: 'digitalizuj.to',
    description:
      'Digitálna auditná platforma pre malé a stredné podniky. Metodicky obhájiteľné hodnotenie digitálnej zrelosti.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    lang: 'sk',
    categories: ['business', 'productivity', 'education'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
