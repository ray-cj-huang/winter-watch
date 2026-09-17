import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** iOS will not render an SVG touch icon, so the mark is rasterised here. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#e9eef0' }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <path d="M1 27 L10 10 L15 18 L20 12 L31 27 Z" fill="#1d4e89" />
          <circle cx="25" cy="7" r="4.5" fill="#c03d26" />
        </svg>
      </div>
    ),
    size,
  )
}
