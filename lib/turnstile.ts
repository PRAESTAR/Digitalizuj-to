/**
 * Cloudflare Turnstile — klientska vrstva.
 *
 * DVE ROZDIELNE ÚROVNE OCHRANY, vedome:
 *  - `quiz_start`  — SKUTOČNÁ brána. Token sa overuje serverovo (PHP →
 *    siteverify), bez platného tokenu sa kvíz nespustí.
 *  - `view_result` — KOZMETIKA, a je to tak rozhodnuté vedome. Stránky
 *    /r/<hash> sú predgenerované statické súbory a ten istý dataset navyše
 *    verejne stojí na /peers aj v JS bundli, takže brána pred nimi nič
 *    nechráni — `curl` ju obíde. Je tam kvôli UX, nie kvôli bezpečnosti;
 *    nikde ju tak nepopisuj.
 *
 * Site key je verejný (chodí v HTML), takže tajomstvo nie je. Secret key
 * žije IBA v konfigurácii nad docrootom a do prehliadača sa nikdy nedostane.
 */

/**
 * Ostrý kľúč je východzí zámerne — produkcia tak nemôže zlyhať na zabudnutom
 * prepínači. Lokálny vývoj si testovací kľúč vyžiada cez env premennú, lebo
 * ostré kľúče sú viazané na doménu a na localhoste nefungujú.
 *
 * Lokálny vývoj: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`
 * (oficiálny Cloudflare kľúč „vždy prejde", funguje na ľubovoľnej doméne).
 * Nedávaj ho do `.env.local` — `next build` ten súbor číta aj pri produkčnom
 * builde, takže by testovací kľúč prenikol na produkciu. Odovzdaj ho radšej
 * jednorazovo pri spustení: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x… npm run dev`.
 *
 * POZOR: dummy a ostré kľúče sa NESMÚ miešať — ostrý secret dummy token
 * odmietne a naopak. Lokálne teda serverové overenie neprejde nikdy (a PHP
 * tam ani nebeží); brána zostane zatvorená, čo je správne zlyhanie.
 */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAEFMaQHTFwO5VI6e';

/** PHP endpoint nad ktorým beží serverové overenie (siteverify). */
export const TURNSTILE_VERIFY_URL = '/api/verify-turnstile.php';

/** Akcia sa posiela do widgetu aj na server — jeden token = jedna akcia. */
export type TurnstileAction = 'quiz_start' | 'view_result';

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  callback?: (token: string) => void;
  'error-callback'?: (code?: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement | string, opts: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loader: Promise<TurnstileApi> | null = null;

/**
 * Načíta api.js raz za životnosť stránky a počká, kým je `window.turnstile`
 * naozaj k dispozícii.
 *
 * Zámerne sa NEPOUŽÍVA dokumentovaný vzor `?onload=menoFunkcie` s inline
 * skriptom: ten by pri našej CSP padol na `script-src`, lebo by šlo o inline
 * kód. Dynamicky vložený `<script>` z bundlu allowlist hostiteľa pokrýva.
 */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (loader) return loader;

  loader = new Promise<TurnstileApi>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Turnstile sa dá načítať iba v prehliadači'));
      return;
    }
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }

    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      // Ďalší pokus musí smieť skript načítať znova (výpadok siete, adblock).
      loader = null;
      reject(new Error('Turnstile sa nepodarilo načítať'));
    };
    s.onload = () => {
      // api.js definuje `window.turnstile` až krátko po onload, preto krátke
      // čakanie namiesto priameho čítania.
      let tries = 0;
      const tick = () => {
        if (window.turnstile) return resolve(window.turnstile);
        if (++tries > 50) {
          loader = null;
          return reject(new Error('Turnstile sa načítal, ale API nie je dostupné'));
        }
        window.setTimeout(tick, 100);
      };
      tick();
    };
    document.head.appendChild(s);
  });

  return loader;
}

/**
 * Serverové overenie tokenu. BEZ NEHO JE CELÝ WIDGET NA NIČ — klientsky
 * callback sa dá zavolať z konzoly, platnosť potvrdzuje výlučne Cloudflare
 * cez secret key, ku ktorému má prístup len server.
 *
 * Token je JEDNORAZOVÝ a platí 300 s; druhé overenie toho istého tokenu
 * Cloudflare odmietne (`timeout-or-duplicate`). Preto sa volá práve raz
 * a pri neúspechu sa widget resetuje na nový token.
 */
export async function verifyTurnstileToken(
  token: string,
  action: TurnstileAction,
): Promise<boolean> {
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    });
    // Endpoint vracia JSON aj pri neúspechu; HTTP status nie je smerodajný.
    const data = (await res.json()) as { ok?: boolean };
    return data?.ok === true;
  } catch {
    return false;
  }
}
