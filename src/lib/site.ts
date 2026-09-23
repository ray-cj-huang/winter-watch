/**
 * Absolute origin for canonical URLs and share-card references.
 *
 * @remarks
 * - Open Graph values cannot be relative, so there is no usable default.
 * - Previews resolve to their own origin, so a branch's cards show itself.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  if (process.env.VERCEL_ENV === 'production') return 'https://winter-watch.vercel.app'
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3111'
}

export const SITE_URL = resolveSiteUrl()

export function absolute(path: string): string {
  return new URL(path, SITE_URL).toString()
}

export const SITE_NAME = 'El Niño Winter Watch'

export const SITE_DEK =
  'Live NOAA data on this winter\u2019s El Niño, and which resorts on your pass are best placed for it.'

/**
 * The Open Graph fields every page has to restate.
 *
 * @remarks
 * A page-level `openGraph` replaces the parent's outright rather than merging,
 * so anything set only in the layout silently never ships.
 */
export const OG_BASE = {
  type: 'website',
  siteName: SITE_NAME,
  locale: 'en_US',
} as const

export const CARD_SIZE = { width: 1200, height: 630 }

/**
 * A share card as Open Graph wants it.
 *
 * @remarks
 * - The dimensions are required: without them Slack crops to a thumbnail.
 * - Returned for both `openGraph` and `twitter`, so the two cannot drift.
 */
export function ogImage(path: string, alt: string) {
  return { url: absolute(path), ...CARD_SIZE, alt, type: 'image/png' }
}
