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
 * ZDROJ PRAVDY O SÚHLASE JE COOKIEYES, nie tento modul. Vlastnú kópiu voľby
 * si zámerne nedržíme: používateľ si ju môže kedykoľvek zmeniť v ich widgete
 * a druhý záznam by sa ticho rozišiel. Tento modul len dostane výsledné dve
 * booleovské hodnoty (viď components/ui/GoogleAnalytics.tsx) a podľa nich
 * gtag pripojí alebo prepne.
 */

export const GA_MEASUREMENT_ID = 'G-1NDEBQNTS3';

export interface ConsentState {
  analytics: boolean;
  ads: boolean;
}

type GtagArgs =
  | [command: 'js', config: Date]
  | [command: 'config', targetId: string, config?: Record<string, unknown>]
  | [command: 'event', eventName: string, params?: Record<string, unknown>]
  | [command: 'consent', mode: 'default' | 'update', params: Record<string, string>];

/** Tvar, ktorý vracia globálna funkcia CookieYes `getCkyConsent()`. */
export interface CkyConsent {
  categories?: Record<string, boolean>;
  isUserActionCompleted?: boolean;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
    /** Definuje CookieYes až po načítaní svojho skriptu. */
    getCkyConsent?: () => CkyConsent;
  }
}

/** Beží už gtag? Modulová premenná, nie stav komponentu — pripojenie je globálne. */
let bootstrapped = false;

const flag = (ok: boolean) => (ok ? 'granted' : 'denied');

/**
 * Jediný vstupný bod pre zmenu súhlasu. Volá sa pri načítaní bannera,
 * pri každej zmene voľby, aj pri návrate používateľa s uloženým rozhodnutím.
 * Je idempotentná — opakované volanie s rovnakým stavom nič nepokazí.
 */
export function applyConsent(consent: ConsentState): void {
  if (typeof window === 'undefined') return;

  if (!bootstrapped) {
    // Bez súhlasu s analytikou sa skript nepripája vôbec — to je celá pointa
    // basic režimu. Reklamné kategórii bez analytiky tu nemáme čo obsluhovať.
    if (!consent.analytics) return;
    bootstrapGtag(consent);
    return;
  }

  // Skript už beží — používateľ mení skôr udelenú voľbu (vrátane odvolania).
  // gtag sa odinštalovať nedá, ale `update` na denied zastaví ukladanie
  // a ďalšie zásahy sa prestanú viazať na identifikátor.
  window.gtag?.('consent', 'update', {
    analytics_storage: flag(consent.analytics),
    personalization_storage: flag(consent.analytics),
    ad_storage: flag(consent.ads),
    ad_user_data: flag(consent.ads),
    ad_personalization: flag(consent.ads),
  });
}

function bootstrapGtag(consent: ConsentState): void {
  bootstrapped = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    // Google posiela ARGUMENTS objekt, nie pole — držíme sa doslovného vzoru
    // z oficiálneho snippetu, aby sa správanie nelíšilo v detaile, ktorý
    // Google nikde nešpecifikuje.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  }
  window.gtag = gtag as unknown as typeof window.gtag;

  // Východiskový stav je odmietnutie VŽDY, aj keď skript pripájame až po
  // súhlase. Je to lacná poistka: keby sa sem niekedy dostal iný tag skôr,
  // než dobehne `update` nižšie, nesmie mu prejsť implicitné „not set".
  // Poradie default → update → config je kritické a preto je celé v jednom
  // bloku: gtag.js spracúva dataLayer v poradí vloženia.
  window.gtag!('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    personalization_storage: 'denied',
    // Nevyhnutné pre chod webu (voľba jazyka, veľkosť písma) — nie sledovanie.
    functionality_storage: 'granted',
    security_storage: 'granted',
  });

  window.gtag!('consent', 'update', {
    analytics_storage: flag(consent.analytics),
    personalization_storage: flag(consent.analytics),
    ad_storage: flag(consent.ads),
    ad_user_data: flag(consent.ads),
    ad_personalization: flag(consent.ads),
  });

  window.gtag!('js', new Date());
  window.gtag!('config', GA_MEASUREMENT_ID);

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

/**
 * Odošle udalosť do GA4. Ticho nič nespraví, ak gtag nie je k dispozícii
 * (SSR, nedaný súhlas, adblock) — meranie nikdy nesmie rozbiť funkciu webu.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
