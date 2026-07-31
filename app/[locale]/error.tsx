'use client';

import { useTranslations } from 'next-intl';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    // In production you would forward this to Sentry / OpenTelemetry.
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center animate-fade-in-up">
        <div
          className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-600"
          aria-hidden="true"
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">{t('error.title')}</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          {t('error.text')}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-6 font-mono">
            ID chyby: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => reset()}
            className="btn-apple-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>{t('error.retry')}</button>
          {/* Zámerne <a> namiesto <Link> — po chybe chceme plný reload a čistý stav,
              nie client-side navigáciu, ktorá by mohla zdediť rozbitý router stav. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-[#0068d6]/30 hover:bg-[#0068d6]/5 transition-all duration-200"
          >{t('common.backHome')}</a>
        </div>
      </div>
    </div>
  );
}
