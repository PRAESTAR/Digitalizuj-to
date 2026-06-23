'use client';

import { usePathname } from 'next/navigation';

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Home: transparent header overlaying hero gradient.
  // Other pages: glassy white header for readability on light bg.
  const wrapperClass = isHome
    ? 'bg-transparent absolute top-0 left-0 right-0 z-50'
    : 'bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50';

  const brandTextClass = isHome ? 'text-white' : 'text-slate-900';
  const brandDotClass = isHome
    ? 'text-white/80'
    : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent';
  const logoBoxClass = isHome
    ? 'bg-white/20'
    : 'bg-gradient-card-blue';
  const taglineClass = isHome ? 'text-white/60' : 'text-slate-400';

  return (
    <header className={wrapperClass}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a
          href="/"
          className="text-xl font-bold tracking-tight group flex items-center gap-2"
        >
          <span
            className={`w-8 h-8 rounded-lg ${logoBoxClass} flex items-center justify-center text-white text-sm font-black group-hover:animate-wiggle transition`}
          >
            d
          </span>
          <span className={brandTextClass}>digitalizuj</span>
          <span className={brandDotClass}>.to</span>
        </a>
        <span className={`text-xs ${taglineClass} hidden sm:block`}>
          Digitálna auditná platforma
        </span>
      </div>
    </header>
  );
}
