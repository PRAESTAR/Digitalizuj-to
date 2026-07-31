'use client';

import { useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';

/**
 * Ukážková výsledková karta v hero sekcii.
 *
 * Dve veci naraz:
 * 1. Karta "žije" — v slučke strieda ukážkové výsledky (skóre, radar, riziko,
 *    úspora), aby bolo hneď vidieť, že nástroj vracia rôzne profily, nie jeden
 *    obrázok. Bodka "naživo" pulzuje ako radarový ping.
 * 2. Karta sa pri skrolovaní roztrhne na 5 zvislých pásov. Preto sa obsah
 *    renderuje 5×, zakaždým orezaný na iný pás — text je tak fyzicky prerezaný
 *    trhacou líniou a zostáva na svojom útržku, presne ako roztrhnutý papier.
 *    Len prvá kópia je v toku (drží výšku) a prístupná čítačkám obrazovky,
 *    zvyšné štyri sú vizuálne duplikáty s aria-hidden.
 */

const TEARS = [1, 2, 3, 4, 5] as const;
// 3600 -> 2400 -> 1600 ms (dvakrát skrátené o tretinu). Výmena hodnoty trvá
// 0,55 s a prekreslenie radaru 0,75 s, takže na pokojné čítanie zostáva už len
// ~0,85 s. Ďalšie skracovanie by sa začalo javiť ako blikanie.
const CYCLE_MS = 1600;

interface Sample {
  ors: number;
  dii: number;
  risk: string;
  riskTone: string;
  save: string;
  /** Vrcholy radaru v sústave viewBox 0 0 96 96, stred (48,48). */
  radar: string;
}

const SAMPLES: Sample[] = [
  { ors: 78, dii: 7, risk: 'riskMedium', riskTone: 'text-amber-600', save: '14,4k €', radar: '48,20 72,35 67,58 48,78 28,59 26,36' },
  { ors: 52, dii: 4, risk: 'riskHigh', riskTone: 'text-rose-600', save: '31,2k €', radar: '48,29 67,38 62,55 48,67 33,56 31,39' },
  { ors: 91, dii: 10, risk: 'riskLow', riskTone: 'text-emerald-600', save: '6,8k €', radar: '48,14 77,33 75,62 48,82 19,63 18,32' },
  { ors: 34, dii: 2, risk: 'riskCritical', riskTone: 'text-rose-600', save: '48,5k €', radar: '48,35 58,43 58,53 48,63 38,53 36,42' },
];

function CardFace({ s, cycle, gradId }: { s: Sample; cycle: number; gradId: string }) {
  const t = useTranslations('card');
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <span className="text-[11px] uppercase tracking-wider text-[#86868b]">
          {t('title')}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
          <span className="hero-live-dot" />
          {t('live')}
        </span>
      </div>

      <div className="flex items-end justify-between mb-7">
        <div>
          <div key={`ors-${cycle}`} className="hero-val-swap text-5xl font-bold tracking-tight text-[#1d1d1f]">
            {s.ors}
            <span className="text-[#86868b] text-2xl">/100</span>
          </div>
          <div className="text-sm text-[#6e6e73] mt-1">{t('operationalMaturity')}</div>
        </div>
        <svg width="92" height="92" viewBox="0 0 96 96" className="opacity-90" aria-hidden="true">
          <polygon
            className="hero-radar-ring"
            points="48,10 82,30 82,66 48,86 14,66 14,30"
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
          />
          <polygon
            key={`radar-${cycle}`}
            className="hero-radar-swap"
            points={s.radar}
            fill={`url(#${gradId})`}
            fillOpacity="0.25"
            stroke="#0a84ff"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0a84ff" />
              <stop offset="100%" stopColor="#bf5af2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-5 border-t border-black/10 text-center">
        <div>
          <div key={`dii-${cycle}`} className="hero-val-swap text-lg font-semibold text-[#1d1d1f]">
            {s.dii}
            <span className="text-[#86868b] text-xs">/12</span>
          </div>
          <div className="text-[10px] uppercase tracking-wide text-[#86868b] mt-0.5">{t('diiScore')}</div>
        </div>
        <div>
          <div key={`risk-${cycle}`} className={`hero-val-swap text-lg font-semibold ${s.riskTone}`}>
            {t(s.risk)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-[#86868b] mt-0.5">{t('risk')}</div>
        </div>
        <div>
          <div key={`save-${cycle}`} className="hero-val-swap text-lg font-semibold text-emerald-600">
            {s.save}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-[#86868b] mt-0.5">{t('savingsPerYear')}</div>
        </div>
      </div>
    </>
  );
}

export default function HeroResultCard() {
  const [cycle, setCycle] = useState(0);
  const [torn, setTorn] = useState(false);

  // Akonáhle sa začne trhať (t. j. hneď ako používateľ odskroluje z vrchu),
  // karta prestane žiť — roztrhnutý papier už nemá čo pulzovať ani prepočítavať.
  // Pasívny listener throttlovaný cez rAF: raz za snímku porovná jeden boolean
  // a React re-render preskočí, ak sa hodnota nezmenila. Keď sa používateľ
  // vráti hore a karta je zase celá, oživí sa.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setTorn(window.scrollY > 6);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (window.scrollY > 6) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- jednorazové zosúladenie s obnovenou pozíciou skrolu po mounte
      setTorn(true);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    // Pri prefers-reduced-motion ani počas trhania sa nič nestrieda.
    if (torn) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Karta je pod lg (64rem) display:none — interval by len pálil CPU na
    // mobile a každých 1,6 s re-renderoval 5 neviditeľných kópií DOM-u.
    // Media query listener pokrýva aj otočenie tabletu na šírku.
    const mq = window.matchMedia('(min-width: 64rem)');
    let id: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      if (mq.matches && id === undefined) {
        id = setInterval(() => setCycle((c) => c + 1), CYCLE_MS);
      } else if (!mq.matches && id !== undefined) {
        clearInterval(id);
        id = undefined;
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      if (id !== undefined) clearInterval(id);
    };
  }, [torn]);

  const sample = SAMPLES[cycle % SAMPLES.length];

  return (
    <div
      className={`hero-card-stage hidden lg:block relative animate-fade-in-up${torn ? ' hero-card-frozen' : ''}`}
      style={{ animationDelay: '0.15s' }}
    >
      <div className="hero-card-glow absolute -inset-10 bg-gradient-to-br from-[#0a84ff]/10 via-[#bf5af2]/[0.06] to-transparent blur-3xl rounded-[3rem]" />
      <div className="hero-card-shell relative rotate-[1.5deg]">
        <div className="hero-card-shadow" aria-hidden="true" />
        {TEARS.map((n, i) => (
          <div
            key={n}
            className={`hero-card-face hero-tear-${n}${i === 0 ? ' hero-card-face--flow' : ''}`}
            aria-hidden={i === 0 ? undefined : true}
          >
            <CardFace s={sample} cycle={cycle} gradId={`heroRadarFill-${n}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
