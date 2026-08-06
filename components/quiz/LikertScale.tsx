'use client';

/**
 * Škála 0–10 s textovými kotvami na oboch koncoch.
 *
 * Používa sa na otázky typu `likert_11` v kvíze a na spätnú väzbu (NPS) po
 * výsledku. Farba je len doplnkový signál — vybraná hodnota je označená aj
 * rámčekom a `aria-checked`, takže funguje aj pri poruche farbocitu a v
 * čítačke obrazovky.
 *
 * Jedenásť tlačidiel sa musí zmestiť do jedného riadku aj pri 320 px: pásik
 * má význam len ako spojitá os, zalomenie by ho rozbilo. Preto `min-w-0`,
 * `flex-1` a menšie písmo na mobile namiesto `flex-wrap`.
 */

interface Props {
  value: number | null;
  onChange: (value: number) => void;
  anchorLow: string;
  anchorHigh: string;
  /** Popis pre čítačku obrazovky — celé znenie otázky. */
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * Farba stupňa. Prechod oranžová → žltá → zelená kopíruje bežnú konvenciu
 * „nízke = zlé". Pri NPS aj pri zámere investovať platí, že vyššie = lepšie,
 * takže smer je pre obe použitia rovnaký.
 */
const STEP_COLORS = [
  '#e8613c', '#ec7d3a', '#f09838', '#f4b03a', '#f6c73f',
  '#f2d43f', '#d4d13f', '#aecb45', '#8ac24b', '#6ab74e', '#4caf50',
];

export default function LikertScale({
  value, onChange, anchorLow, anchorHigh, ariaLabel, disabled = false,
}: Props) {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="flex items-stretch gap-1 sm:gap-1.5"
      >
        {STEP_COLORS.map((color, i) => {
          const isSelected = value === i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={String(i)}
              disabled={disabled}
              onClick={() => onChange(i)}
              // Nevybraté stupne sú stlmené, aby vybratý vystúpil. Rámček
              // a posun nahor nesú výber aj bez farby.
              style={{ backgroundColor: color, opacity: value === null || isSelected ? 1 : 0.45 }}
              className={`min-w-0 flex-1 rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-white font-bold text-xs sm:text-sm
                transition-all duration-150 disabled:cursor-not-allowed
                ${isSelected
                  ? 'ring-2 ring-offset-2 ring-[#1d1d1f] -translate-y-0.5 shadow-md'
                  : 'hover:opacity-100 hover:-translate-y-0.5'}`}
            >
              {i}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 gap-3">
        <span className="text-xs text-[#86868b] font-medium">{anchorLow}</span>
        <span className="text-xs text-[#86868b] font-medium text-right">{anchorHigh}</span>
      </div>
    </div>
  );
}
