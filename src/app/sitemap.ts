import type { MetadataRoute } from 'next'
import { RESORTS } from '@/lib/resorts'
import { SITE_URL } from '@/lib/site'

/**
 * The board's query strings are deliberately absent.
 *
 * @remarks
 * Search engines fold `?pass=…` back into `/`, so listing them adds nothing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...RESORTS.map((r) => ({
      url: `${SITE_URL}/resort/${r.id}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]
}
