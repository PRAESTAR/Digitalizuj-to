import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test digitálnej zrelosti — adaptívny dotazník',
  description:
    'Adaptívny dotazník digitálnej zrelosti: 15 otázok (5–7 min) alebo 43–49 otázok (15–20 min). Odpovede zostávajú vo vašom prehliadači.',
  alternates: {
    canonical: '/quiz',
  },
  /**
   * `noindex` je tu SPRÁVNE a zámerne ponechané.
   *
   * Zvažovali sme, či z /quiz spraviť indexovateľnú landing page pre dopyt
   * „test digitálnej zrelosti". Nie — stránka je stavová: bez rozbehnutého
   * hodnotenia (`assessment === null`) vykreslí len prázdny stav „Žiadne
   * aktívne hodnotenie" s odkazom späť. Presne to by videl crawler aj
   * používateľ prichádzajúci z vyhľadávania, čo je thin page / soft 404
   * a poškodilo by to celú doménu.
   *
   * Vstupná stránka nástroja pre vyhľadávače je `/` — obsahuje výber
   * diagnostiky, popis výstupov aj FAQ a kvíz priamo spúšťa. Cieľová fráza
   * teda nie je stratená, len je obsadená správnou URL.
   *
   * `follow: true` ponechané, aby sa odkazová hodnota preniesla ďalej.
   * Zároveň /quiz už NIE JE v Disallow (app/robots.ts) — inak by crawler
   * tento `noindex` nikdy neuvidel.
   */
  robots: {
    index: false,
    follow: true,
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
