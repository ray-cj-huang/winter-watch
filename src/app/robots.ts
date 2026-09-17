import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** `/api/og` stays crawlable: blocking it would break every link preview. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/refresh' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
