import { ImageResponse } from 'next/og';

/**
 * PNG ikona pre PWA manifest a prehliadače, generovaná v builde — v /public
 * žiadny bitmapový asset nie je a samotný favicon.ico nespĺňa minimá
 * inštalovateľnej PWA. Dizajn zámerne jednoduchý (monogram „d" na aurora
 * gradiente zhodnom s OG obrázkom): pri 48 px v tabe musí zostať čitateľný.
 *
 * Sedí na app roote (URL /icon) — na rozdiel od OG obrázka ikony nepotrebujú
 * metadataBase (odkazujú sa relatívne), takže tu localhost warning nehrozí.
 * proxy.ts matcher má /icon vo výnimkách, inak by ho middleware presmeroval
 * na /sk/icon.
 */
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%)',
          // Maskable safe zone: obsah drží v strede ~80 % plochy.
          borderRadius: 96,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 320,
            fontWeight: 900,
            fontFamily: 'sans-serif',
            display: 'flex',
            lineHeight: 1,
            marginTop: -24,
          }}
        >
          d
        </div>
      </div>
    ),
    { ...size },
  );
}
