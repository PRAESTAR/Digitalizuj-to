'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatHashGroups } from '@/lib/resultHash';

interface QRCodeCardProps {
  url: string;
  hash: string;
  /** Show the URL underneath the QR. Defaults to true. */
  showUrl?: boolean;
}

export default function QRCodeCard({ url, hash, showUrl = true }: QRCodeCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((d) => {
        if (!cancelled) setDataUrl(d);
      })
      .catch(() => {
        // best-effort: leave dataUrl null and the UI will show the link only
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    // p-4 na mobile: pri 320 px displeji zjedol pôvodný p-6 z každej strany
    // 24 px, takže na QR rámček (224 px + padding + rámik) neostalo miesto.
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[#1d1d1f]/8 flex items-center justify-center text-[#1d1d1f] flex-shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] break-words">
            Váš permanentný odkaz
          </h3>
          <p className="text-sm text-[#6e6e73] mt-1 leading-relaxed break-words">
            Naskenujte QR kód alebo zdieľajte odkaz — výsledok je dostupný len cez tento hash.
          </p>
        </div>
      </div>

      {/* POZOR: Tailwind v arbitrary hodnotách prevádza na medzeru iba
          podtržník, nie čiarku. S čiarkou vznikne neplatné
          grid-template-columns a dvojstĺpcový layout ticho nefunguje.
          (Zámerne tu neuvádzam ten chybný zápis doslovne — Tailwind skenuje
          aj komentáre a vygeneroval by z neho mŕtvu triedu.) */}
      <div className="grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-center">
        <div className="flex justify-center">
          {/* QR má na mobile 168 px namiesto 224 px: s rámčekom a paddingom
              karty by sa 224 px na 320 px displeji zmestilo len tesne a pri
              zväčšenom texte (padding v rem) už vôbec. Naskenovateľnosť to
              neohrozí — 168 px stále vychádza cez 4 px na modul. */}
          {dataUrl ? (
            <div className="p-2 sm:p-3 bg-white border-2 border-black/5 rounded-2xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt={`QR kód pre výsledok ${hash}`}
                width={224}
                height={224}
                className="block h-auto w-[168px] sm:w-[224px]"
              />
            </div>
          ) : (
            <div className="w-[168px] h-[168px] sm:w-[224px] sm:h-[224px] bg-[#1d1d1f]/[0.04] rounded-2xl border-2 border-black/5 flex items-center justify-center text-[#86868b] text-xs">
              Generujem QR…
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wide mb-1.5">
              Hash výsledku
            </p>
            {/* Štyri políčka po 4 znakoch. Kopírovateľný je aj tak celý hash
                naraz — skrytý <span> nesie súvislý reťazec bez medzier, takže
                označením myšou nevznikne text s medzerami, ktorý by v URL
                nefungoval. */}
            {/* flex-wrap + menšie písmo/tracking na mobile: štyri políčka po
                4 znakoch pri 150 % škálovaní potrebujú viac než je vnútorná
                šírka karty. Zalomenie je horšie ako jeden riadok, ale lepšie
                ako pretečenie mimo obrazovku. */}
            <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
              {formatHashGroups(hash).map((group, i) => (
                <span
                  key={i}
                  className="flex-1 text-center font-mono text-xs sm:text-sm tracking-[0.08em] sm:tracking-[0.12em] bg-[#1d1d1f]/[0.04] border border-black/5 rounded-lg px-1 sm:px-1.5 py-2 text-[#1d1d1f]"
                >
                  {group}
                </span>
              ))}
            </div>
            <span className="sr-only select-all">{hash}</span>
          </div>

          {showUrl && (
            <div>
              <p className="text-xs font-bold text-[#86868b] uppercase tracking-wide mb-1.5">
                URL
              </p>
              <p className="font-mono text-xs bg-[#1d1d1f]/[0.04] border border-black/5 rounded-xl px-3 py-2 text-[#6e6e73] break-all select-all">
                {url}
              </p>
            </div>
          )}

          <button
            onClick={copyLink}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1d1d1f]/[0.04] border border-black/10 text-[#1d1d1f] rounded-full font-semibold text-sm hover:bg-[#1d1d1f]/[0.08] hover:-translate-y-0.5 transition-all duration-200"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Skopírované
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Skopírovať odkaz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
