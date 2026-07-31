'use client';

import { useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';

/**
 * Prístupnostný ovládač veľkosti písma — tri "A" s oblúkom, 100 / 125 / 150 %.
 *
 * Škáluje font-size na <html>, takže sa proporcionálne zväčší všetko, čo je
 * v rem jednotkách (text aj rozostupy) — to je presne to, čo očakáva používateľ
 * so zhoršeným zrakom. Voľba sa ukladá do localStorage a obnovuje sa ešte pred
 * prvým vykreslením malým inline skriptom v app/layout.tsx, aby písmo pri
 * načítaní stránky "neposkočilo" zo 150 % späť na 100 %.
 *
 * Glyf "A" má pevnú veľkosť v px (13/17/21), aby ukážka veľkosti nezávisela
 * od práve zvoleného škálovania. Samotná dotyková plocha tlačidla je naopak
 * v rem a má minimum 44 × 44 px podľa WCAG 2.2 (2.5.8) — pôvodných 32 × 32 px
 * bolo pod minimom práve pri ovládači, ktorý najviac potrebujú používatelia
 * s motorickým alebo zrakovým obmedzením. Ovládač je síce skrytý pod sm,
 * na tabletoch sa však ovláda dotykom.
 */

const STORAGE_KEY = 'digitalizuj.textScale';

type Scale = 100 | 125 | 150;

const SCALES: { value: Scale; glyphPx: number; labelKey: string }[] = [
  { value: 100, glyphPx: 13, labelKey: 'textSizeStandard' },
  { value: 125, glyphPx: 17, labelKey: 'textSizeLarge' },
  { value: 150, glyphPx: 21, labelKey: 'textSizeLargest' },
];

function applyScale(value: Scale) {
  // 100 % = žiadny override, nech platí predvolená veľkosť z prehliadača.
  document.documentElement.style.fontSize = value === 100 ? '' : `${value}%`;
}

export default function TextSizeControl() {
  const t = useTranslations('footer');
  const [scale, setScale] = useState<Scale>(100);

  // Zosúladenie Reactu s hodnotou, ktorú už na <html> nastavil inline skript.
  // Čítať localStorage sa dá až po mounte — počas serverového renderu neexistuje,
  // takže lazy initializer v useState by spôsobil hydration mismatch.
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(STORAGE_KEY));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazová, terminálna synchronizácia s localStorage po mounte; viď komentár vyššie
      if (stored === 125 || stored === 150) setScale(stored);
    } catch {
      // localStorage nedostupný (privátny režim, zakázané cookies) — ignorujeme.
    }
  }, []);

  const handleSelect = (value: Scale) => {
    setScale(value);
    applyScale(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Preferencia sa neuloží, ale v rámci relácie funguje.
    }
  };

  return (
    <div className="flex items-center gap-3" role="group" aria-label={t('textSize')}>
      <span aria-hidden="true" className="text-[11px] uppercase tracking-wider text-[#86868b]">{t('textSize')}</span>
      {/* gap-1 namiesto gap-px: medzi dvoma dotykovými cieľmi nesmie byť
          1 px, inak sa pri dotyku trafí susedné tlačidlo. */}
      <div className="flex items-center gap-1">
        {SCALES.map((s) => {
          const active = scale === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => handleSelect(s.value)}
              aria-pressed={active}
              aria-label={t(s.labelKey)}
              title={`${s.value} %`}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-xl border transition-colors ${
                active
                  ? 'border-[#0068d6]/30 bg-[#0068d6]/[0.08] text-[#0068d6]'
                  : 'border-transparent text-[#6e6e73] hover:border-black/10 hover:bg-black/[0.03] hover:text-[#1d1d1f]'
              }`}
            >
              <span style={{ fontSize: s.glyphPx, lineHeight: 1 }} className="font-semibold">
                A
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
