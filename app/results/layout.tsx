import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Výsledky diagnostiky',
  description:
    'Váš profil digitálnej zrelosti — DII skóre, radarový graf 6 kategórií, risk index, business impact a prioritizované odporúčania.',
  alternates: {
    canonical: '/results',
  },
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
