'use client';

import { useEffect } from 'react';
import { applyConsent, type CkyConsent } from '@/lib/analytics';

/**
 * Most medzi cookie bannerom (CookieYes) a Google Analytics.
 *
 * Sám nič nevykresľuje — banner rieši CookieYes, meranie rieši lib/analytics.
 * Tento komponent len počúva rozhodnutie návštevníka a preklápa ho na súhlas
 * pre gtag. Kým súhlas nie je, gtag.js sa nenačíta a na Google neodíde ani
 * IP adresa.
 *
 * Prečo TRI zdroje toho istého údaja: každý sám má dieru.
 *  - `cookieyes_banner_load` sa vystrelí raz pri načítaní bannera a nesie stav
 *    aj u vracajúceho sa návštevníka — ale ak sa CookieYes stihne načítať skôr
 *    než React namountuje tento komponent, listener ho už nezachytí.
 *  - `getCkyConsent()` presne túto dieru zaláta, lenže existuje až po načítaní
 *    CookieYes — pri prvom zobrazení stránky spravidla ešte nie je.
 *  - `cookieyes_consent_update` pokrýva zmeny voľby počas návštevy.
 * Spolu pokryjú všetky poradia. `applyConsent` je idempotentná, takže
 * prekrytie dvoch ciest nič nepokazí.
 */

/** Názvy kategórií podľa CookieYes. „advertisement" = reklamná vetva. */
const ANALYTICS_CATEGORY = 'analytics';
const ADS_CATEGORY = 'advertisement';

/** Obe pravopisné varianty, ktoré dokumentácia CookieYes uvádza. */
const BANNER_LOAD_EVENTS = ['cookieyes_banner_load', 'cookieyes_banner_loaded'] as const;

type BannerLoadDetail = { categories?: Record<string, boolean> };
type ConsentUpdateDetail = { accepted?: string[] };

export default function GoogleAnalytics() {
  useEffect(() => {
    const fromCategories = (categories: Record<string, boolean> | undefined) => {
      if (!categories) return;
      applyConsent({
        analytics: categories[ANALYTICS_CATEGORY] === true,
        ads: categories[ADS_CATEGORY] === true,
      });
    };

    const onBannerLoad = (e: Event) => {
      fromCategories((e as CustomEvent<BannerLoadDetail>).detail?.categories);
    };

    // Pri zmene voľby má detail INÝ tvar než pri načítaní: polia názvov
    // kategórií namiesto objektu s booleanmi. Nie je to nekonzistencia z našej
    // strany — takto to CookieYes posiela.
    const onConsentUpdate = (e: Event) => {
      const accepted = (e as CustomEvent<ConsentUpdateDetail>).detail?.accepted ?? [];
      applyConsent({
        analytics: accepted.includes(ANALYTICS_CATEGORY),
        ads: accepted.includes(ADS_CATEGORY),
      });
    };

    // Dva názvy tej istej udalosti zámerne: dokumentácia CookieYes ju na
    // jednom mieste uvádza ako `cookieyes_banner_load` a inde ako
    // `cookieyes_banner_loaded`. Ktorá platí, sa lokálne overiť nedá (skript
    // je zamknutý na doménu), a počúvať obe nič nestojí.
    BANNER_LOAD_EVENTS.forEach((evt) => document.addEventListener(evt, onBannerLoad));
    document.addEventListener('cookieyes_consent_update', onConsentUpdate);

    // Ohraničené dopytovanie ako poistka. Dôvod je konkrétny: skript
    // z cdn-cookieyes.com je len zavádzač (24 kB, bez jediného dispatchEvent) —
    // samotný banner aj jeho udalosti sa dotiahnu až za behu, a keďže je skript
    // zamknutý na doménu matpex.sk, názvy udalostí sa nedajú overiť lokálne.
    // Ak by teda listenery vyššie minuli cieľ, `getCkyConsent()` stav aj tak
    // vyzdvihne. Je to konečné (10 s) a končí hneď po prvom úspechu, takže to
    // nie je nekonečná slučka na pozadí.
    let ticks = 0;
    const poll = window.setInterval(() => {
      const state: CkyConsent | undefined = window.getCkyConsent?.();
      if (state?.categories) {
        fromCategories(state.categories);
        window.clearInterval(poll);
      } else if (++ticks >= 20) {
        window.clearInterval(poll);
      }
    }, 500);

    return () => {
      BANNER_LOAD_EVENTS.forEach((evt) => document.removeEventListener(evt, onBannerLoad));
      document.removeEventListener('cookieyes_consent_update', onConsentUpdate);
      window.clearInterval(poll);
    };
  }, []);

  return null;
}
