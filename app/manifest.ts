import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // `id` stabilizuje identitu inštalovanej aplikácie aj pri zmene start_url.
    id: '/',
    name: 'digitalizuj.to — test digitálnej zrelosti firmy',
    short_name: 'digitalizuj.to',
    description:
      'Bezplatný test digitálnej zrelosti firmy pre malé a stredné podniky. DII skóre vs. EÚ a SK, index technologického dlhu a odhad ročných úspor — anonymne, bez registrácie, priamo v prehliadači.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Zosúladené so skutočným pozadím aplikácie (#fbfbfd) a s `viewport.themeColor`
    // v app/layout.tsx — predtým tu zostala stará indigo hodnota #4f46e5,
    // takže systémová lišta pri inštalovanej appke nesedela so stránkou.
    background_color: '#fbfbfd',
    theme_color: '#fbfbfd',
    lang: 'sk-SK',
    dir: 'ltr',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity', 'education', 'utilities'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    shortcuts: [
      {
        name: 'Začať diagnostiku',
        short_name: 'Diagnostika',
        description: 'Spustiť test digitálnej zrelosti firmy',
        url: '/',
      },
      {
        name: 'Benchmark digitálnej zrelosti',
        short_name: 'Benchmark',
        description: 'Anonymizované profily podľa sektora a veľkosti firmy',
        url: '/peers',
      },
    ],
  };
}
