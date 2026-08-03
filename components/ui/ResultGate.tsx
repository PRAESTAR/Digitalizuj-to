'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import TurnstileGate from '@/components/ui/TurnstileGate';

/**
 * Výzva pred zobrazením zdieľaného výsledku.
 *
 * TOTO NIE JE BEZPEČNOSTNÁ OCHRANA a nikde ju tak nepopisuj. Stránky
 * /r/<hash> sú predgenerované statické súbory na disku, takže `curl` túto
 * bránu obíde — a ten istý dataset navyše verejne stojí na /peers aj
 * v klientskom JS bundli, kde si ho ktokoľvek stiahne bez akejkoľvek výzvy.
 * Zmysel je čisto UX/dojem, vedomé rozhodnutie zadávateľa.
 *
 * Skutočnú bránu má iba spustenie kvízu (`quiz_start`), kde sa bez platného
 * serverovo overeného tokenu naozaj nedá pokračovať.
 *
 * Na ochranu pred hromadným sťahovaním obsahu slúži Bot Fight Mode / WAF
 * pravidlo v Cloudflare — to pokrýva aj statické HTML a JS chunky.
 */
export default function ResultGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  if (verified) return <>{children}</>;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-16 pb-6 sm:pt-8 sm:pb-8">
      {/* Zástupný obsah, aby stránka pod modálom nebola prázdna plocha. */}
      <div aria-hidden="true" className="space-y-4 opacity-40">
        <div className="h-12 w-2/3 rounded-2xl bg-black/5" />
        <div className="h-40 rounded-3xl bg-black/5" />
        <div className="h-40 rounded-3xl bg-black/5" />
      </div>

      <TurnstileGate
        open
        action="view_result"
        onVerified={() => setVerified(true)}
        onCancel={() => router.push('/')}
      />
    </div>
  );
}
