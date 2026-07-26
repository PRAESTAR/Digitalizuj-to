'use client';

import { useEffect, useRef } from 'react';

/**
 * Svetelná stopa za kurzorom v hero sekcii.
 *
 * Skladá sa z DVOCH nezávislých vrstiev, lebo každá má iné požiadavky:
 *
 *  1. STOPA (plátno) — každý snímok sa doterajší obsah trochu zotrie a na
 *     dráhe kurzora sa pridá mäkký farebný kruh. To, čo vidíme ako stopu, je
 *     nedomazaná história; nikde sa neukladá zoznam bodov. Stopa zámerne
 *     zaostáva za kurzorom (EASE), z toho vzniká ten ťah.
 *
 *  2. GUĽÔČKA (DOM prvok) — malý bod presne na kurzore. Je to obyčajný div
 *     posúvaný cez `translate3d`, takže beží na kompozítore, nikdy nevybledne
 *     a nemá žiadne oneskorenie voči myši.
 *
 * Prečo nie je guľôčka tiež na plátne: plátno sa každý snímok stmieva, takže
 * bod na ňom buď zmizne (keď myš stojí), alebo sa pri opakovanom razítkovaní
 * na mieste nakopí do skoro nepriehľadnej škvrny — rovnovážna alfa vychádza
 * okolo 0,76. Ani jedno nie je to, čo chceme. Ako DOM prvok je guľôčka
 * jednoducho stále rovnaká a jej veľkosť sa mení jediným číslom.
 *
 * Farby sú tie isté tri aurora odtiene ako statické bloby v hero sekcii, takže
 * efekt pôsobí ako zosilnenie existujúceho pozadia, nie ako cudzí prvok.
 *
 * Výkon (na tomto projekte už boli sťažnosti na sekanie pri skrolovaní):
 *  - beží LEN pri myši (pointer: fine) — na dotyku nemá kurzor zmysel a šetrí batériu,
 *  - rešpektuje prefers-reduced-motion,
 *  - rAF slučka sa po ~1,5 s bez pohybu sama zastaví a znovu naštartuje až pri pohybe,
 *  - zastaví sa aj pri skrytej záložke,
 *  - pozícia plátna sa číta z cache (aktualizuje sa pri scroll/resize), takže
 *    v pointermove nie je žiadne čítanie layoutu.
 */

/** #0a84ff, #bf5af2, #ff375f — zhodné s .aurora-blob v globals.css. */
const COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [10, 132, 255],
  [191, 90, 242],
  [255, 55, 95],
];

const FADE_PER_FRAME = 0.035; // koľko sa zotrie za snímok → dĺžka stopy
const EASE = 0.14; // 0–1, nižšie = lenivejšie doháňanie kurzora

// Polomer mäkkej stopy. Toto je tá „aura" za kurzorom — široká je zámerne,
// lebo prekryv susedných razítok je to jediné, čo zakryje krokovanie po
// snímkoch. Keď sa zmenšila spolu s guľôčkou, stopa začala pôsobiť skokovo.
const TRAIL_RADIUS = 55;
// Pozadie hero je takmer biele (#fbfbfd), takže slabá stopa na ňom zanikne.
// 0,055 je kompromis: viditeľná, ale stále len nádych farby.
const TRAIL_ALPHA = 0.055;
const STAMP_SPACING = 8; // rozostup razítok; výrazne menší než polomer
const MAX_STEPS = 12; // 12 × 8 px = 96 px prekrytých za snímok

/** Priemer guľôčky v px. Jediné číslo, ktoré treba meniť pri jej zväčšovaní. */
const BALL_SIZE = 14;

const IDLE_FRAMES_BEFORE_STOP = 90; // ~1,5 s pri 60 fps

export default function PointerAurora() {
  const ref = useRef<HTMLCanvasElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ball = ballRef.current;
    if (!canvas || !ball) return;

    // Bez myši alebo pri obmedzenom pohybe efekt vôbec nespúšťame.
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Rect sa mení pri scrollovaní aj pri zmene veľkosti; držíme si ho v cache,
    // aby pointermove nemusel siahať na layout.
    const refreshRect = () => {
      rect = canvas.getBoundingClientRect();
    };

    let targetX = -1;
    let targetY = -1;
    let x = -1;
    let y = -1;
    let hue = 0;
    let idle = 0;
    let raf = 0;
    let running = false;

    const stamp = (
      px: number,
      py: number,
      color: readonly [number, number, number]
    ) => {
      const [r, g, b] = color;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, TRAIL_RADIUS);
      grad.addColorStop(0, `rgba(${r},${g},${b},${TRAIL_ALPHA})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(
        px - TRAIL_RADIUS,
        py - TRAIL_RADIUS,
        TRAIL_RADIUS * 2,
        TRAIL_RADIUS * 2
      );
    };

    const frame = () => {
      // 1) zotri kúsok predchádzajúceho snímku — z toho vzniká doznievanie
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${FADE_PER_FRAME})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      // 2) posuň sa k cieľu (zotrvačnosť)
      const prevX = x;
      const prevY = y;
      x += (targetX - x) * EASE;
      y += (targetY - y) * EASE;

      const dx = x - prevX;
      const dy = y - prevY;
      const dist = Math.hypot(dx, dy);

      // 3) pri rýchlom pohybe doplň medzikroky, inak by stopa bola prerušovaná
      const steps = Math.min(Math.ceil(dist / STAMP_SPACING), MAX_STEPS);

      hue = (hue + 0.004) % 1;
      const ci = hue * COLORS.length;
      const i0 = Math.floor(ci) % COLORS.length;
      const i1 = (i0 + 1) % COLORS.length;
      const f = ci % 1;
      const c0 = COLORS[i0];
      const c1 = COLORS[i1];
      const color = [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ] as const;

      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 1 : i / steps;
        stamp(prevX + dx * t, prevY + dy * t, color);
      }

      // 4) keď sa nič nedeje, nech slučka po doznení stopy zhasne.
      //    Guľôčka je DOM prvok, takže zastavenie slučky sa jej netýka —
      //    zostane svietiť na mieste, kde myš stojí.
      idle = dist < 0.15 ? idle + 1 : 0;
      if (idle > IDLE_FRAMES_BEFORE_STOP) {
        // Tvrdé domazanie. Postupné stmievanie cez destination-out násobí
        // alfu, takže pri 8-bitovej presnosti sa zasekne na nízkej hodnote
        // (4 × 0,955 sa zaokrúhli späť na 4) a nikdy nedosiahne nulu. Zvyšok
        // je síce takmer neviditeľný, ale bez tohto by sa naprieč dlhou
        // reláciou nazbieral do viditeľného závoja.
        ctx.clearRect(0, 0, w, h);
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Listener je na window (plátno má pointer-events: none), súradnice si
    // prepočítame voči cachovanému rectu a mimo plátna nič nekreslíme.
    const onMove = (e: PointerEvent) => {
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (px < 0 || py < 0 || px > w || py > h) {
        // Kurzor opustil hero — guľôčku schovaj, nech nezostane visieť na kraji.
        ball.style.opacity = '0';
        return;
      }

      // Guľôčka ide na SKUTOČNÚ pozíciu kurzora, bez zotrvačnosti. Preto
      // nikdy nezaostáva a nepôsobí skokovo. Stopa naopak zaostáva zámerne.
      ball.style.transform = `translate3d(${px - BALL_SIZE / 2}px, ${py - BALL_SIZE / 2}px, 0)`;
      ball.style.opacity = '1';

      targetX = px;
      targetY = py;
      if (x < 0) {
        x = px;
        y = py;
      }
      idle = 0;
      start();
    };

    const onVisibility = () => {
      if (document.hidden) stop();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', refreshRect, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', refreshRect);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <>
      <canvas
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div
        ref={ballRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 rounded-full opacity-0 will-change-transform"
        style={{
          width: BALL_SIZE,
          height: BALL_SIZE,
          background:
            'radial-gradient(circle, rgba(10,132,255,0.55) 0%, rgba(191,90,242,0.28) 45%, rgba(191,90,242,0) 70%)',
          transition: 'opacity 220ms ease-out',
        }}
      />
    </>
  );
}
