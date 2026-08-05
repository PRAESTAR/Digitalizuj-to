'use client';

import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';

/**
 * Spodný reklamný slot (728×90 placeholder).
 *
 * Vyčlenený z layoutu do klientského komponentu kvôli meraniu preklikov —
 * layout je serverový a `onClick` v ňom žiť nemôže. Markup aj triedy sú
 * zhodné s pôvodným inline variantom, aby sa vzhľad nezmenil.
 *
 * Udalosť sa posiela ako `select_promotion` (odporúčaná GA4 e-commerce
 * udalosť pre kliknutie na promo kreatívu) — GA4 ju vie zobraziť v hotových
 * reportoch, na rozdiel od vymysleného vlastného názvu. `creative_slot`
 * odlíši tento slot od ďalších bannerov, ktoré časom pribudnú.
 */
export default function AdBanner() {
  const t = useTranslations('footer');
  const label = t('adBanner');

  return (
    /* Bez vlastného px-* — vodorovné odsadenie dáva .site-container päty,
       inak by sa padding zdvojil a banner by sa rozišiel s hranou valca. */
    <div className="pb-6">
      <a
        href="#"
        className="banner-cta"
        aria-label={label}
        onClick={() =>
          trackEvent('select_promotion', {
            creative_slot: 'footer_banner',
            promotion_name: label,
          })
        }
      >
        {label}
      </a>
    </div>
  );
}
