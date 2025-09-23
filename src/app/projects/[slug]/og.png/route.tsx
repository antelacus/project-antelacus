import { ImageResponse } from 'next/og';
import { getProjectBySlug } from '../../../../lib/projects';

export const runtime = 'nodejs';
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/projects\/([^/]+)\/og\.png$/);
  const slug = match ? decodeURIComponent(match[1]) : '';
  const project = await getProjectBySlug(slug);
  const title = project?.name ?? 'AnteLacus';
  const subtitle = project?.description ?? 'Ante Lacus, Pax Mentis';

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
          padding: '80px',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: '50px', border: '2px solid rgba(30,30,29,0.1)' }} />
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
        <div style={{ marginTop: 16, fontSize: 30, opacity: 0.8 }}>{subtitle}</div>
        <div style={{ position: 'absolute', bottom: 50, fontSize: 24, opacity: 0.5 }}>antelacus.com</div>
      </div>
    ),
    { width: OG_WIDTH, height: OG_HEIGHT }
  );
}


