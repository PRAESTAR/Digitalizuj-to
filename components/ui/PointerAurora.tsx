'use client';

import { useEffect, useRef } from 'react';

/**
 * Svetelná stopa za kurzorom v hero sekcii — kométa.
 *
 * Skladá sa z DVOCH nezávislých vrstiev, lebo každá má iné požiadavky:
 *
 *  1. STOPA (plátno) — história posledných pozícií kurzora. Každý bod si
 *     pamätá, kedy vznikol, a s vekom mu klesá POLOMER aj PRIEHĽADNOSŤ. Preto
 *     sa stopa smerom dozadu zužuje do stratena, nie je to pás.
 *
 *  2. GUĽÔČKA (DOM prvok) — malý bod presne na kurzore. Obyčajný div posúvaný
 *     cez `translate3d`, takže beží na kompozítore, nikdy nevybledne a nemá
 *     voči myši žiadne oneskorenie.
 *
 * Prečo NIE technika „stmievaj celé plátno":
 * predtým sa každý snímok zotrel kúsok plátna a na dráhe pribudlo razítko.
 * Lenže staré razítka si držia pôvodný polomer a len blednú — výsledkom je
 * pás s konštantnou šírkou. Zúženie do stratena sa takto spraviť nedá.
 * Vedľajší efekt: odpadol aj starý problém s 8-bitovou presnosťou, keď sa
 * postupné stmievanie zaseklo na nízkej alfe a nikdy nedosiahlo nulu —
 * plátno sa teraz každý snímok maže načisto.
 *
 * Prečo je guľôčka DOM a nie na plátne: plátno sa prekresľuje, takže bod na
 * ňom pri stojacej myši buď zmizne, alebo sa pri opakovanom kreslení nakopí.
 *
 * Výkon: namiesto `createRadialGradient` pre každý bod a snímok sa raz
 * predkreslí sada mäkkých koliesok (sprite) a tie sa už len škálovane
 * vykresľujú cez `drawImage`. To je rádovo lacnejšie a drží to aj pri
 * plnej histórii pod jednu milisekundu na snímok.
 *
 *  - beží LEN pri myši (pointer: fine) — na dotyku nemá kurzor zmysel,
 *  - rešpektuje prefers-reduced-motion,
 *  - slučka sa sama zastaví, keď stopa dohorí, a naštartuje až pri pohybe,
 *  - zastaví sa aj pri skrytej záložke.
 *
 * Pozícia plátna sa číta ČERSTVO pri každom pohybe, nie z cache. Cache tu
 * predtým bola kvôli výkonu a obnovovala sa na scroll/resize — lenže hero sa
 * vie posunúť aj bez takého eventu (doloadovaný obrázok nad ním, výmena
 * fontu, zmena výšky obsahu pri prepnutí jazyka) a vtedy sa všetko kreslilo
 * o ten rozdiel vedľa. Odmerané: čítanie stojí ~36 µs na event, čo je pri
 * 120 Hz asi 0,4 % rozpočtu snímku. Čítame PRED zápisom transformu, takže
 * v handleri nevzniká read-after-write thrash.
 */

/** #0a84ff, #bf5af2, #ff375f — zhodné s .aurora-blob v globals.css. */
const COLORS: ReadonlyArray<readonly [number, number, number]> = [
  [10, 132, 255],
  [191, 90, 242],
  [255, 55, 95],
];

/** Ako dlho bod žije. Toto je tá „ostáva tam dlho" páčka — nižšie = kratšia stopa. */
const LIFETIME_MS = 600;
/** Polomer na hlave stopy; smerom dozadu klesá k nule. */
const HEAD_RADIUS = 46;
/** Vrcholová sýtosť jedného bodu. Hero má takmer biele pozadie (#fbfbfd). */
const PEAK_ALPHA = 0.075;
/** Exponenty starnutia. Alfa klesá rýchlejšie než polomer → chvost sa stráca skôr, než sa stihne zúžiť do špičky. */
const RADIUS_FALLOFF = 0.75;
const ALPHA_FALLOFF = 1.7;
/** Rozostup vzoriek na dráhe; pri rýchlom pohybe sa medzi ne dopĺňa. */
const SAMPLE_SPACING = 6;
const MAX_POINTS = 90;

/** Počet predkreslených odtieňov naprieč aurora paletou. */
const SPRITE_COUNT = 12;
const SPRITE_RADIUS = 64;

/** Priemer guľôčky v px. Jediné číslo na jej zväčšenie/zmenšenie. */
const BALL_SIZE = 14;

type Point = { x: number; y: number; born: number; sprite: number };

/** Mäkké koliesko pre každý odtieň, predkreslené raz. */
function buildSprites(): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  for (let s = 0; s < SPRITE_COUNT; s++) {
    const f = (s / SPRITE_COUNT) * COLORS.length;
    const i0 = Math.floor(f) % COLORS.length;
    const i1 = (i0 + 1) % COLORS.length;
    const k = f % 1;
    const c0 = COLORS[i0];
    const c1 = COLORS[i1];
    const r = Math.round(c0[0] + (c1[0] - c0[0]) * k);
    const g = Math.round(c0[1] + (c1[1] - c0[1]) * k);
    const b = Math.round(c0[2] + (c1[2] - c0[2]) * k);

    const cv = document.createElement('canvas');
    cv.width = SPRITE_RADIUS * 2;
    cv.height = SPRITE_RADIUS * 2;
    const c = cv.getContext('2d');
    if (c) {
      const grad = c.createRadialGradient(
        SPRITE_RADIUS, SPRITE_RADIUS, 0,
        SPRITE_RADIUS, SPRITE_RADIUS, SPRITE_RADIUS
      );
      grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
      grad.addColorStop(0.45, `rgba(${r},${g},${b},0.35)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      c.fillStyle = grad;
      c.fillRect(0, 0, SPRITE_RADIUS * 2, SPRITE_RADIUS * 2);
    }
    out.push(cv);
  }
  return out;
}

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

    const sprites = buildSprites();

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const points: Point[] = [];
    let lastX = -1;
    let lastY = -1;
    let hue = 0;
    let raf = 0;
    let running = false;

    const push = (px: number, py: number, now: number) => {
      hue = (hue + 0.5) % SPRITE_COUNT;
      points.push({ x: px, y: py, born: now, sprite: Math.floor(hue) });
      if (points.length > MAX_POINTS) points.shift();
    };

    const frame = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      // zahoď, čo dohorelo
      while (points.length && now - points[0].born >= LIFETIME_MS) points.shift();

      // od najstaršieho po najmladší, nech je hlava navrchu
      for (const p of points) {
        const t = (now - p.born) / LIFETIME_MS; // 0 = čerstvý, 1 = koniec života
        const life = 1 - t;
        const r = HEAD_RADIUS * Math.pow(life, RADIUS_FALLOFF);
        if (r < 0.5) continue;
        ctx.globalAlpha = PEAK_ALPHA * Math.pow(life, ALPHA_FALLOFF);
        ctx.drawImage(sprites[p.sprite], p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      if (!points.length) {
        running = false;
        return; // plátno je už čisté z clearRect
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

    // Listener je na window (plátno má pointer-events: none).
    //
    // Plátno je FIXED cez celý viewport, takže clientX/Y SÚ priamo súradnice
    // plátna — žiadne getBoundingClientRect v pointermove. História: najprv
    // tu bola cache rectu (po posune layoutu kreslila vedľa), potom čerstvé
    // čítanie pri každom pohybe (správne, ale nútený layout read ~36 µs na
    // event — INP hygiena). Fixed pozícia oba problémy ruší konštrukciou;
    // rect číta už len resize().
    const onMove = (e: PointerEvent) => {
      const px = e.clientX;
      const py = e.clientY;

      if (px < 0 || py < 0 || px > w || py > h) {
        // Kurzor opustil viewport — guľôčku schovaj, nech nezostane visieť na kraji.
        ball.style.opacity = '0';
        lastX = -1;
        return;
      }

      // Guľôčka ide na SKUTOČNÚ pozíciu kurzora, bez zotrvačnosti.
      ball.style.transform = `translate3d(${px - BALL_SIZE / 2}px, ${py - BALL_SIZE / 2}px, 0)`;
      ball.style.opacity = '1';

      const now = performance.now();
      if (lastX < 0) {
        push(px, py, now);
      } else {
        // Doplň medzivzorky, inak by pri rýchlom pohybe stopa preskakovala.
        const dx = px - lastX;
        const dy = py - lastY;
        const dist = Math.hypot(dx, dy);
        const steps = Math.min(Math.ceil(dist / SAMPLE_SPACING), MAX_POINTS);
        for (let i = 1; i <= steps; i++) {
          const k = i / steps;
          push(lastX + dx * k, lastY + dy * k, now);
        }
        if (steps === 0) push(px, py, now);
      }
      lastX = px;
      lastY = py;
      start();
    };

    const onVisibility = () => {
      if (document.hidden) stop();
    };

    // Scroll listener tu zámerne NIE JE: fixed plátno sa so scrollom nehýbe.
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
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
