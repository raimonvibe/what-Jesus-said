import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #faf8f7 0%, #e8e4ec 50%, #c6b8f5 100%)',
          color: '#c23b2e',
          fontSize: 110,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        “
      </div>
    ),
    { ...size },
  )
}
