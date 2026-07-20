import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'UptimeWatch — Monitor your sites 24/7'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Dynamically rendered social share image (Open Graph + Twitter).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#020617',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
          <div
            style={{
              width: 84,
              height: 84,
              background: '#22c55e',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 32, height: 32, background: 'white', borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 52, fontWeight: 700 }}>UptimeWatch</div>
        </div>
        <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.1, maxWidth: 960 }}>
          Know when your site goes down before your customers do.
        </div>
        <div style={{ fontSize: 30, color: '#94a3b8', marginTop: 36 }}>
          Uptime monitoring · instant email alerts · public status pages
        </div>
      </div>
    ),
    { ...size }
  )
}
