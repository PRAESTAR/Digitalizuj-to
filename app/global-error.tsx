'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="sk">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 1rem' }}>
            Kritická chyba
          </h1>
          <p style={{ color: '#475569', lineHeight: 1.5, margin: '0 0 2rem' }}>
            Aplikácia sa nepodarila načítať. Obnovte prosím stránku.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(90deg, #4f46e5, #2563eb)',
              color: 'white',
              border: 0,
              borderRadius: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Obnoviť
          </button>
        </div>
      </body>
    </html>
  );
}
