import { ImageResponse } from 'next/og';
import { SHARE_IMAGE_CACHE_CONTROL } from '@/lib/seo';

export const runtime = 'nodejs';
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: `${OG_WIDTH}px`,
          height: `${OG_HEIGHT}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9F8F6',
          color: '#1E1E1D',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '50px',
            border: '2px solid rgba(30,30,29,0.1)',
          }}
        />
        <div style={{ fontSize: 72, fontWeight: 700 }}>AnteLacus</div>
        <div style={{ marginTop: 12, fontSize: 32, opacity: 0.8 }}>Ante Lacus, Pax Mentis</div>
        {/* The seal is drawn, not typed: the bundled font has no ■ glyph, and a missing glyph makes every
            render try to download a font. */}
        <div style={{ marginTop: 48, width: 24, height: 24, backgroundColor: '#B42A1E' }} />
        <div style={{ position: 'absolute', bottom: 50, fontSize: 24, opacity: 0.5 }}>antelacus.com</div>
      </div>
    ),
    { width: OG_WIDTH, height: OG_HEIGHT, headers: { 'Cache-Control': SHARE_IMAGE_CACHE_CONTROL } }
  );
}


