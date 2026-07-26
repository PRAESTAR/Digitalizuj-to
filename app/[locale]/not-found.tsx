import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Stránka nenájdená',
  description: 'Hľadaná stránka neexistuje alebo bola presunutá.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-[#1d1d1f]/8 flex items-center justify-center text-[#1d1d1f]">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-5xl font-black text-slate-900 mb-3">404</p>
        <h1 className="text-2xl font-black text-slate-900 mb-3">
          Stránka nenájdená
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Hľadaná stránka neexistuje alebo bola presunutá. Skontrolujte adresu,
          alebo sa vráťte na úvod.
        </p>
        <Link
          href="/"
          className="btn-apple-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Späť na úvod
        </Link>
      </div>
    </div>
  );
}
