import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diagnostika digitálnej zrelosti',
  description:
    'Adaptívny diagnostický kvíz digitálnej zrelosti. Vyplňte otázky a získajte skóre DII, ODRM, Risk Index a Business Impact.',
  alternates: {
    canonical: '/quiz',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
