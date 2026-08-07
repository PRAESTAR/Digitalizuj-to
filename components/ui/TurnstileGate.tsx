'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  TURNSTILE_SITE_KEY,
  loadTurnstile,
  verifyTurnstileToken,
  type TurnstileAction,
} from '@/lib/turnstile';

/**
 * Modálne okno s výzvou Cloudflare Turnstile.
 *
 * Volajúci komponent drží akciu, ktorú chce vykonať, a spustí ju až v
 * `onVerified` — takže bez úspešného SERVEROVÉHO overenia sa nestane nič.
 * Klientsky callback samotný nič nedokazuje (dá sa zavolať z konzoly);
 * platnosť potvrdzuje výlučne Cloudflare cez secret key na serveri.
 *
 * Widget sa renderuje až pri otvorení, nie pri načítaní stránky. Token žije
 * len 300 s, takže vyrobiť ho dopredu by znamenalo, že používateľovi vyprší
 * skôr, než naň klikne.
 */

interface Props {
  open: boolean;
  action: TurnstileAction;
  onVerified: () => void;
  onCancel: () => void;
}

type Phase = 'loading' | 'widget' | 'verifying' | 'error';

export default function TurnstileGate({ open, action, onVerified, onCancel }: Props) {
  const t = useTranslations('turnstile');
  const locale = useLocale();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  // Ref, nie state: callback z Turnstile žije mimo React cyklu a musí vidieť
  // aktuálnu hodnotu bez toho, aby si vynútil pretvorenie widgetu.
  //
  // Aktualizácia patrí do efektu, nie do renderu: React smie render zahodiť
  // alebo zopakovať, ale zápis do refu prežije — ref by potom držal callback
  // z renderu, ktorý sa nikdy nezobrazil. Efekt beží až po commite, takže
  // hodnota vždy zodpovedá tomu, čo je naozaj na obrazovke.
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  // Reset fázy pri (znovu)otvorení brány.
  //
  // Predtým to robil `setPhase('loading')` v efekte, čo React Compiler právom
  // hlásil ako kaskádový render: efekt beží až po commite, takže sa najprv
  // vykreslila stará fáza (napr. `error` z predchádzajúceho pokusu) a hneď
  // nato prekreslila na `loading`.
  //
  // Toto je dokumentovaný vzor „úprava stavu pri zmene propu": React render
  // zahodí a zopakuje ešte pred vykreslením, takže žiadny medzisnímok
  // nevznikne. Kľúč je ZÁMERNE zhodný so závislosťami efektu nižšie
  // (`open`, `action`, `locale`) — reset sa tak spustí presne v tých
  // situáciách ako predtým, vrátane prípadu, keď sa počas otvorenej brány
  // zmení akcia alebo jazyk a widget sa stavia nanovo.
  const resetKey = `${open}|${action}|${locale}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (open) setPhase('loading');
  }

  const cleanup = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Widget už mohol zmiznúť aj s DOM uzlom — nie je čo riešiť.
      }
    }
    widgetIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      cleanup();
      return;
    }

    let cancelled = false;
    // Fázu tu už nenastavujeme — reset rieši vzor pri zmene propu vyššie,
    // ešte pred vykreslením.

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !hostRef.current) return;
        setPhase('widget');
        widgetIdRef.current = turnstile.render(hostRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: 'light',
          language: locale,
          callback: (token: string) => {
            setPhase('verifying');
            verifyTurnstileToken(token, action).then((ok) => {
              if (cancelled) return;
              if (ok) {
                onVerifiedRef.current();
              } else {
                // Token je jednorazový — po neúspechu treba vyrobiť nový,
                // inak by ďalší pokus Cloudflare odmietol ako duplicitný.
                setPhase('error');
              }
            });
          },
          'error-callback': () => !cancelled && setPhase('error'),
          'expired-callback': () => !cancelled && setPhase('error'),
          'timeout-callback': () => !cancelled && setPhase('error'),
        });
      })
      .catch(() => !cancelled && setPhase('error'));

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open, action, locale, cleanup]);

  // Escape zatvára — modál blokuje hlavnú akciu stránky, musí sa dať opustiť.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const retry = () => {
    cleanup();
    setPhase('loading');
    loadTurnstile()
      .then((turnstile) => {
        if (!hostRef.current) return;
        setPhase('widget');
        widgetIdRef.current = turnstile.render(hostRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: 'light',
          language: locale,
          callback: (token: string) => {
            setPhase('verifying');
            verifyTurnstileToken(token, action).then((ok) =>
              ok ? onVerifiedRef.current() : setPhase('error'),
            );
          },
          'error-callback': () => setPhase('error'),
          'expired-callback': () => setPhase('error'),
        });
      })
      .catch(() => setPhase('error'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-black/10">
        <h2 className="text-lg font-semibold text-[#1d1d1f]">{t('title')}</h2>
        <p className="mt-2 text-sm text-[#6e6e73]">{t('description')}</p>

        {/* Hostiteľ widgetu musí zostať v DOM aj počas 'loading', inak by
            turnstile.render() nemal kam kresliť. */}
        <div ref={hostRef} className="mt-5 flex min-h-[70px] items-center justify-center" />

        {phase === 'loading' && (
          <p className="text-center text-sm text-[#86868b]">{t('loading')}</p>
        )}
        {phase === 'verifying' && (
          <p className="text-center text-sm text-[#86868b]" aria-live="polite">
            {t('loading')}
          </p>
        )}
        {phase === 'error' && (
          <div className="text-center" aria-live="assertive">
            <p className="text-sm text-[#c0392b]">{t('error')}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 min-h-11 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white hover:bg-black transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 block w-full min-h-11 rounded-full text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
