import { ImageResponse } from 'next/og'

export const alt =
  'What Jesus Said — the New Testament with the words of Jesus marked'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background:
            'linear-gradient(160deg, #faf8f7 0%, #e8e4ec 50%, #c6b8f5 100%)',
          color: '#2c2838',
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#6b6578',
          }}
        >
          World English Bible
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginTop: 16,
            lineHeight: 1.1,
          }}
        >
          What Jesus Said
        </div>
        <div
          style={{
            fontSize: 30,
            marginTop: 24,
            color: '#4a4458',
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          The New Testament, and every saying marked as His words.
        </div>
      </div>
    ),
    { ...size },
  )
}
