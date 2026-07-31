import type { MetadataRoute } from 'next';

// Nutne pre output: 'export' — bez toho build padne s "dynamic not configured".
// V serverovom rezime neskodne (routa je aj tak staticka).
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // `id` stabilizuje identitu inštalovanej aplikácie aj pri zmene start_url.
    id: '/',
    name: 'digitalizuj.to — test digitálnej zrelosti firmy',
    short_name: 'digitalizuj.to',
    description:
      'Bezplatný test digitálnej zrelosti firmy pre malé a stredné podniky. DII skóre vs. EÚ a SK, index technologického dlhu a odhad ročných úspor — anonymne, bez registrácie, priamo v prehliadači.',
    // Priamo na slovenskú mutáciu — '/' je 307 presmerovanie a inštalovaná
    // PWA by štartovala cez redirect. Scope zostáva '/' (pokrýva všetky jazyky).
    start_url: '/sk',
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
      // Generovaná PNG ikona (app/icon.tsx). Samotný favicon.ico nespĺňal
      // minimá pre inštalovateľnú PWA (Chrome vyžaduje aspoň jednu PNG
      // ikonu >= 144 px s deklarovanou veľkosťou).
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Začať diagnostiku',
        short_name: 'Diagnostika',
        description: 'Spustiť test digitálnej zrelosti firmy',
        url: '/sk',
      },
      {
        name: 'Benchmark digitálnej zrelosti',
        short_name: 'Benchmark',
        description: 'Anonymizované profily podľa sektora a veľkosti firmy',
        url: '/sk/peers',
      },
    ],
  };
}
