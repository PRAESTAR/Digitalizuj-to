import type { Locale } from '@/i18n/routing';

/**
 * Vlajky ako inline SVG, NIE emoji.
 *
 * Windows nedodáva font s vlajkovými emoji (Segoe UI Emoji ich zámerne
 * neobsahuje), takže „🇸🇰" sa tam vykreslí ako dve písmená „SK". Overené
 * priamo v prehliadači: skutočná vlajka a nezmyselná kombinácia regionálnych
 * indikátorov mali rovnakú šírku, teda obe spadli na písmenový zápis.
 * Keďže väčšina cieľovej skupiny sedí na Windows, emoji nie sú použiteľné.
 *
 * SVG je zjednodušené (bez detailov erbu), ale na 20 px je to nerozoznateľné
 * a celé to váži pár stoviek bajtov bez jedinej sieťovej požiadavky.
 */
export default function FlagIcon({ locale }: { locale: Locale }) {
  const common = {
    viewBox: '0 0 24 16',
    // Bez rámčeka aj bez zaoblenia — vlajka má pôsobiť ako čistý znak,
    // nie ako orámovaná ikonka.
    className: 'block h-[14px] w-[21px]',
    'aria-hidden': true as const,
  };

  switch (locale) {
    case 'sk':
      return (
        <svg {...common}>
          {/* Trikolóra */}
          <rect width="24" height="16" fill="#fff" />
          <rect y="5.33" width="24" height="5.33" fill="#0b4ea2" />
          <rect y="10.66" width="24" height="5.34" fill="#ee1c25" />

          {/* Štátny znak — červený štít s bielym dvojkrížom na troch
              modrých vŕškoch. Posunutý do ľavej polovice, ako na vlajke. */}
          <path
            d="M4.2 3h6.6v5.6c0 2.5-1.9 4.2-3.3 4.9-1.4-.7-3.3-2.4-3.3-4.9V3z"
            fill="#ee1c25"
            stroke="#fff"
            strokeWidth="0.55"
          />
          {/* Tri vŕšky, prostredný najvyšší */}
          <path
            d="M4.2 11.25q1.1-1.45 2.15 0 1.15-2.15 2.3 0 1.05-1.45 2.15 0v-.6c0 1.55-1.85 2.85-3.3 3.5-1.45-.65-3.3-1.95-3.3-3.5z"
            fill="#0b4ea2"
          />
          {/* Dvojkríž: horné rameno kratšie, dolné dlhšie */}
          <path
            d="M7.05 3.95h0.9v6.6h-0.9z M5.95 5.5h3.1v0.85h-3.1z M5.35 7.35h4.3v0.85h-4.3z"
            fill="#fff"
          />
        </svg>
      );
    case 'cs':
      return (
        <svg {...common}>
          <rect width="24" height="8" fill="#fff" />
          <rect y="8" width="24" height="8" fill="#d7141a" />
          <path d="M0 0l12 8L0 16z" fill="#11457e" />
        </svg>
      );
    case 'de':
      return (
        <svg {...common}>
          <rect width="24" height="5.33" fill="#000" />
          <rect y="5.33" width="24" height="5.33" fill="#d00" />
          <rect y="10.66" width="24" height="5.34" fill="#ffce00" />
        </svg>
      );
    case 'en':
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3.2" />
          <path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1.9" />
          <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5.3" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3.2" />
        </svg>
      );
  }
}
