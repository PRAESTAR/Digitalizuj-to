'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0">
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
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Váš permanentný odkaz
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Naskenujte QR kód alebo zdieľajte odkaz — výsledok je dostupný len cez tento hash.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-[auto,1fr] gap-6 items-center">
        <div className="flex justify-center">
          {dataUrl ? (
            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt={`QR kód pre výsledok ${hash}`}
                width={224}
                height={224}
                className="block"
              />
            </div>
          ) : (
            <div className="w-[224px] h-[224px] bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 text-xs">
              Generujem QR…
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Hash výsledku
            </p>
            <p className="font-mono text-sm bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-800 select-all">
              {hash}
            </p>
          </div>

          {showUrl && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                URL
              </p>
              <p className="font-mono text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-700 break-all select-all">
                {url}
              </p>
            </div>
          )}

          <button
            onClick={copyLink}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200"
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
