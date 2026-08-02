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
    case 'en':
      // EÚ vlajka — anglická mutácia reprezentuje EÚ trh (priemer EÚ-27),
      // nie Britániu. 12 hviezd v kruhu; pri 14 px sú vykreslené ako body.
      // Súradnice sú PREDPOČÍTANÉ konštanty, nie Math.cos/sin za behu:
      // trigonometria nie je bitovo stabilná medzi Node a prehliadačom
      // a posledné desatinné miesto rozbíjalo React hydratáciu.
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#003399" />
          {(
            [
              [12, 2.8], [14.6, 3.5], [16.5, 5.4], [17.2, 8],
              [16.5, 10.6], [14.6, 12.5], [12, 13.2], [9.4, 12.5],
              [7.5, 10.6], [6.8, 8], [7.5, 5.4], [9.4, 3.5],
            ] as const
          ).map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.85" fill="#FFCC00" />
          ))}
        </svg>
      );
  }
}
