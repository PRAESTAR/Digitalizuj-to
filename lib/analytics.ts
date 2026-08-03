/**
 * Tenká vrstva nad gtag.js (Google Analytics 4) — meracie ID G-1NDEBQNTS3.
 *
 * REŽIM SÚHLASU: „basic consent mode" — gtag.js sa NENAČÍTA VÔBEC, kým
 * návštevník neudelí súhlas. Nie je to len opatrnosť, je to meraný záver:
 * v „advanced" režime (skript beží, `analytics_storage: denied`) sa síce
 * nenastavia cookies, ale na Google stále odchádzajú cookieless pingy s IP,
 * plnou URL a user agentom — a do reportov sa dostanú výlučne cez behaviorálne
 * modelovanie, ktoré vyžaduje ≥ 1 000 súhlasiacich používateľov denne počas
 * 7 dní. Pod týmto prahom sa nemodeluje nič, takže advanced režim by na tomto
 * webe posielal dáta návštevníkov do Google výmenou za prázdne reporty.
 *
 * Dôsledok pre cookie banner (úloha #31): stačí, aby zavolal `updateConsent`.
 * Voľba sa uloží, GoogleAnalytics komponent si ju vypočuje a gtag.js pripojí
 * okamžite — bez reloadu stránky.
 *
 * Meracie ID je verejné (chodí v URL skriptu), takže nie je tajomstvo a nemusí
 * ísť cez env premennú — v statickom exporte by aj tak skončilo v HTML.
 */

export const GA_MEASUREMENT_ID = 'G-1NDEBQNTS3';

/** Kľúč v localStorage. Menný priestor zhodný s `digitalizuj.textScale`. */
export const CONSENT_STORAGE_KEY = 'digitalizuj.consent';

/**
 * Vlastná DOM udalosť, ktorou sa banner dorozumie s GoogleAnalytics
 * komponentom. Bez nej by sa gtag.js pripojil až pri ďalšom načítaní stránky
 * a prvá — najzaujímavejšia — návšteva by sa nezmerala.
 */
export const CONSENT_CHANGED_EVENT = 'digitalizuj:consent-changed';

export interface ConsentChoice {
  analytics: boolean;
  ads: boolean;
  /** Kedy návštevník voľbu spravil (ISO milisekundy) — pre audit aj expiráciu. */
  ts: number;
}

type GtagArgs =
  | [command: 'js', config: Date]
  | [command: 'config', targetId: string, config?: Record<string, unknown>]
  | [command: 'event', eventName: string, params?: Record<string, unknown>]
  | [command: 'consent', mode: 'default' | 'update', params: Record<string, string>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

/** Uložená voľba, alebo null ak sa návštevník ešte nerozhodol. */
export function readConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>;
    // Tvarová kontrola: poškodený alebo cudzí zápis sa musí správať ako
    // „nerozhodnuté", nie ako súhlas.
    if (typeof parsed?.analytics !== 'boolean' || typeof parsed?.ads !== 'boolean') {
      return null;
    }
    return { analytics: parsed.analytics, ads: parsed.ads, ts: parsed.ts ?? 0 };
  } catch {
    // localStorage nedostupný (privátny režim, zakázané úložisko) — bez
    // uloženej voľby platí, že súhlas nie je.
    return null;
  }
}

/**
 * Zaznamená rozhodnutie návštevníka. Volá to cookie banner (úloha #31) —
 * pri súhlase AJ pri odmietnutí, aby sa banner prestal pýtať.
 *
 * Nevolá `gtag('event', 'page_view')` po udelení súhlasu zámerne: v basic
 * režime pred súhlasom neodletel žiadny page_view, takže ho netreba dobiehať —
 * `gtag('config', …)` pri pripojení skriptu ho pošle sám. Doplnkové volanie
 * by vstupnú stránku započítalo dvakrát.
 */
export function updateConsent(opts: { analytics: boolean; ads: boolean }): void {
  if (typeof window === 'undefined') return;

  const choice: ConsentChoice = { analytics: opts.analytics, ads: opts.ads, ts: Date.now() };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
  } catch {
    // Bez úložiska sa voľba nezapamätá do ďalšej návštevy, ale v rámci tejto
    // relácie musí platiť — preto sa pokračuje aj po zlyhaní zápisu.
  }

  // Ak gtag už beží (návštevník mení skôr udelenú voľbu), oznám mu zmenu.
  // Ak ešte nebeží, postará sa o pripojenie GoogleAnalytics komponent nižšie.
  if (typeof window.gtag === 'function') {
    const v = (ok: boolean) => (ok ? 'granted' : 'denied');
    window.gtag('consent', 'update', {
      analytics_storage: v(opts.analytics),
      personalization_storage: v(opts.analytics),
      ad_storage: v(opts.ads),
      ad_user_data: v(opts.ads),
      ad_personalization: v(opts.ads),
    });
  }

  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));
}

/**
 * Odošle udalosť do GA4. Ticho nič nespraví, ak gtag nie je k dispozícii
 * (SSR, nedaný súhlas, adblock) — meranie nikdy nesmie rozbiť funkciu webu.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
