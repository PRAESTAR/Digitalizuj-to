'use client';

import { useEffect, useState } from 'react';
import {
  GA_MEASUREMENT_ID,
  CONSENT_CHANGED_EVENT,
  readConsent,
  type ConsentChoice,
} from '@/lib/analytics';

/**
 * Pripojí Google Analytics 4 — ale AŽ po udelení súhlasu („basic consent
 * mode", zdôvodnenie v lib/analytics.ts). Bez súhlasu tento komponent
 * nevykreslí a nespustí vôbec nič, takže na Google neodíde ani IP adresa.
 *
 * Prečo sa skript pripája imperatívne v `useEffect`, a nie cez `next/script`
 * ani `<script>` v JSX:
 *  - `<script>` vložený Reactom až pri klientskom renderi sa NIKDY nevykoná
 *    (prehliadač spúšťa len skripty prítomné v pôvodnom HTML). Keďže sa tu
 *    rozhoduje podľa localStorage, teda až na klientovi, JSX variant je slepá
 *    ulička.
 *  - `next/script` by fungoval, ale poradie inicializácie by záviselo od jeho
 *    internej stratégie. Tu je poradie kritické (consent PRED config), takže
 *    je lacnejšie mať ho doslovne pod kontrolou než sa spoliehať na cudziu
 *    implementáciu.
 *
 * page_view sa NEPOSIELA ručne: `gtag('config')` ho pošle pri pripojení a
 * klientske prechody medzi routami zachytáva GA4 Enhanced Measurement
 * („Page changes based on browser history events" — Next App Router volá
 * natívne `history.pushState`). Vlastný listener na zmenu cesty by preto
 * počítal každé zobrazenie dvakrát.
 */

/** Poistka proti dvojitému pripojeniu (StrictMode v deve efekty púšťa 2×). */
let gtagBootstrapped = false;

function bootstrapGtag(choice: ConsentChoice) {
  if (gtagBootstrapped) return;
  gtagBootstrapped = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    // Google posiela ARGUMENTS objekt, nie pole — držíme sa doslovného vzoru
    // z oficiálneho snippetu, aby sa správanie nelíšilo v detaile, ktorý
    // Google nikde nešpecifikuje.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  }
  window.gtag = gtag as unknown as typeof window.gtag;

  const v = (ok: boolean) => (ok ? 'granted' : 'denied');

  // Východzí stav je odmietnutie VŽDY, aj keď skript pripájame až po súhlase.
  // Je to lacná poistka: keby sa sem niekedy dostal iný tag skôr, než dobehne
  // `update` nižšie, nesmie mu prejsť implicitné „not set" ako súhlas.
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
    analytics_storage: v(choice.analytics),
    personalization_storage: v(choice.analytics),
    ad_storage: v(choice.ads),
    ad_user_data: v(choice.ads),
    ad_personalization: v(choice.ads),
  });

  window.gtag!('js', new Date());
  window.gtag!('config', GA_MEASUREMENT_ID);

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

export default function GoogleAnalytics() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const sync = () => setChoice(readConsent());
    sync();
    // Banner volá updateConsent(), ktorý túto udalosť vystrelí — vďaka tomu sa
    // meranie zapne okamžite a nezmešká sa práve prebiehajúca návšteva.
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (choice?.analytics) bootstrapGtag(choice);
  }, [choice]);

  // Komponent nič nevykresľuje — existuje len kvôli vedľajšiemu účinku.
  return null;
}
