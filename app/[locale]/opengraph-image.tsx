import { ImageResponse } from 'next/og';

/**
 * OG obrázok MUSÍ sedieť v segmente [locale], nie na app roote.
 *
 * Metadata sa skladajú od koreňa k listu a metadataBase je deklarovaný až
 * v app/[locale]/layout.tsx — na koreni je teda null a Next pri resolvovaní
 * file-konvencie padal na localhost fallback (build warning na každej z 227
 * stránok). Tu sa obrázok resolvuje v segmente, kde metadataBase existuje.
 * URL je /{locale}/opengraph-image; obsah je zámerne rovnaký pre všetky
 * jazyky, kým nie sú preložené podstránky.
 */
export const alt = 'digitalizuj.to — bezplatný test digitálnej zrelosti firmy';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar with brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '42px',
              fontWeight: 900,
            }}
          >
            d
          </div>
          <div style={{ display: 'flex', fontSize: '36px', fontWeight: 700, color: 'white' }}>
            digitalizuj<span style={{ color: 'rgba(255,255,255,0.7)' }}>.to</span>
          </div>
        </div>

        {/* Main heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Test digitálnej zrelosti firmy
          </div>
          <div
            style={{
              fontSize: '32px',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            Zadarmo, za 5 minút, bez registrácie — skóre, riziká
            a odhad úspor podľa Eurostat DII
          </div>
        </div>

        {/* Footer badges */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            DII (Eurostat)
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            ODRM Model
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            Adaptívny model DAP
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
