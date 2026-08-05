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
    // Ikony sú zámerne vynechané — favicon aj generovaná PNG ikona boli
    // odstránené (5. 8. 2026), kým nevznikne nová vizuálna identita.
    // DÔSLEDOK: bez aspoň jednej PNG ikony >= 144 px Chrome appku neponúkne
    // na inštaláciu, takže PWA je dovtedy neinštalovateľná. Zvyšok manifestu
    // (názov, farby, skratky) zostáva, aby sa po dodaní ikony len doplnil
    // `icons` blok.
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
