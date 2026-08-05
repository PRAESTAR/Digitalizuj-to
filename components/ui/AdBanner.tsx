'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';

/**
 * Spodný reklamný slot v päte (leaderboard 728×90).
 *
 * Vyčlenený z layoutu do klientského komponentu kvôli meraniu — layout je
 * serverový a `onClick` ani IntersectionObserver v ňom žiť nemôžu.
 *
 * Meria sa dvojicou odporúčaných GA4 promo udalostí, aby sa dal počítať CTR:
 * `view_promotion` pri zobrazení a `select_promotion` pri kliknutí. Obe idú
 * cez `trackEvent`, ktorý bez súhlasu s analytikou ticho nespraví nič.
 */

/**
 * Cieľ kliknutia — afiliate odkaz Websupportu. Parameter `ref` nesie
 * identifikátor partnera, na ktorý sa viaže provízia; pri výmene kreatívy
 * ho netreba meniť, pri zmene partnerského účtu áno.
 */
const TARGET_URL = 'https://www.websupport.sk/?ref=NDgvHlg5';

const CREATIVE_DIR = '/reklama/websupport-ad-banners-sk';
const PROMOTION_ID = 'websupport_freeweb_sk';

export default function AdBanner() {
  const t = useTranslations('footer');
  const label = t('adBanner');
  const slotRef = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  // Impresia sa počíta až keď je banner naozaj vidieť (aspoň polovica plochy),
  // nie pri načítaní stránky. Banner sedí v päte, takže väčšina návštevníkov
  // sa k nemu nikdy nedoscrolluje — počítať zobrazenie pri načítaní by CTR
  // delilo zobrazeniami, ktoré nikto nevidel. Ráta sa raz za načítanie stránky.
  useEffect(() => {
    const el = slotRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || counted.current) continue;
          counted.current = true;
          trackEvent('view_promotion', {
            promotion_id: PROMOTION_ID,
            promotion_name: label,
            creative_slot: 'footer_banner',
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [label]);

  return (
    // flex-1 min-w-0: banner delí riadok s ovládačom veľkosti textu a pri
    // užšom okne sa radšej zúži, než by sa zalomil pod neho.
    <div ref={slotRef} className="min-w-0 flex-1">
      <a
        href={TARGET_URL}
        className="banner-cta"
        aria-label={label}
        // Nová karta zámerne: banner je v päte na každej stránke vrátane
        // kvízu a rozpracované odpovede žijú len v pamäti — odchod z karty
        // uprostred vypĺňania by ich zahodil.
        target="_blank"
        // sponsored = platený/afiliate odkaz; Google ho pre reklamné odkazy
        // vyžaduje, inak ide o nepriznaný platený odkaz. noopener je pri
        // target="_blank" bezpečnostné minimum. noreferrer zámerne NIE JE —
        // referrer sa niekedy používa na overenie zdroja provízie.
        rel="sponsored noopener"
        onClick={() =>
          trackEvent('select_promotion', {
            promotion_id: PROMOTION_ID,
            promotion_name: label,
            creative_slot: 'footer_banner',
          })
        }
      >
        {/* Na mobile sa slot zúži na šírku obsahu (288 px pri 320 px displeji).
            Kreatíva 728×90 by tam mala ~36 px na výšku a bola by nečitateľná,
            preto sa pod 640 px načíta 320×100 varianta tej istej kampane.
            width/height na oboch zdrojoch držia pomer strán, takže sa pri
            načítaní neposunie obsah pod bannerom. */}
        <picture>
          <source
            media="(max-width: 639px)"
            srcSet={`${CREATIVE_DIR}/freeweb-sk-3.png`}
            width={320}
            height={100}
          />
          <img
            src={`${CREATIVE_DIR}/freeweb-sk-5.png`}
            width={728}
            height={90}
            alt={label}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </a>
    </div>
  );
}
