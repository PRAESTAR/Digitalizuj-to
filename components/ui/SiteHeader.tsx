'use client';

import Link from 'next/link';

// Jeden konzistentný nav bar naprieč celou stránkou — svetlý, sklenný
// (blur + jemná priehľadnosť), v rovnakej farebnej rodine ako zvyšok
// stránky, takže nepôsobí ako farebne odskočený cudzí prvok.
export default function SiteHeader() {
  return (
    <header className="bg-[#fbfbfd]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-black/5 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
      <div className="site-container h-12 flex items-center justify-between">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight group flex items-center gap-2 text-[#1d1d1f]"
        >
          <span className="w-6 h-6 rounded-md bg-[#1d1d1f]/8 flex items-center justify-center text-[#1d1d1f] text-xs font-bold transition-colors">
            d
          </span>
          digitalizuj
          <span className="text-[#86868b]">.to</span>
        </Link>
        <span className="text-xs text-[#86868b] hidden sm:block">
          Digitálna auditná platforma
        </span>
      </div>
    </header>
  );
}
