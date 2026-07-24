'use client';

// Jeden konzistentný nav bar naprieč celou stránkou — tenký, tmavý,
// polopriehľadný so sklenným blur efektom, presne ako globálna navigácia
// na apple.com (rovnaká na každej stránke, nezávislá od pozadia pod ňou).
export default function SiteHeader() {
  return (
    <header className="bg-[#1d1d1f]/85 backdrop-blur-xl sticky top-0 z-50 shadow-[0_1px_0_rgba(255,255,255,0.06),0_8px_30px_-8px_rgba(0,0,0,0.35)]">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
        <a
          href="/"
          className="text-[15px] font-semibold tracking-tight group flex items-center gap-2 text-white"
        >
          <span className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center text-white text-xs font-bold group-hover:animate-wiggle transition">
            d
          </span>
          digitalizuj
          <span className="text-white/50">.to</span>
        </a>
        <span className="text-xs text-white/45 hidden sm:block">
          Digitálna auditná platforma
        </span>
      </div>
    </header>
  );
}
