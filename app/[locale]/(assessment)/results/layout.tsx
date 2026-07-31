import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Výsledky testu digitálnej zrelosti vašej firmy',
  description:
    'DII skóre vs. EÚ a SK, radar 6 oblastí prevádzkovej zrelosti, index technologického dlhu, odhad ročných úspor a prioritizovaná roadmapa odporúčaní.',
  // Prerušenie dedenia alternates z layoutu (viď quiz/layout.tsx).
  alternates: {},
  /**
   * `noindex, nofollow` je tu správne: stránka existuje len ako výstup
   * dokončeného kvízu, obsah vzniká z klientského stavu a pre návštevníka
   * z vyhľadávania by bola prázdna. Zároveň je /results v Disallow
   * (app/robots.ts) — je to stavová URL, nie obsahová stránka.
   */
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
