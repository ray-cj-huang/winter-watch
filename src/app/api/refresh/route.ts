import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

/**
 * Invalidates the `noaa` tag, covering both the CPC ENSO feed and the GFS
 * forecasts.
 *
 * @remarks
 * - Stale-while-revalidate: a request mid-refresh gets the previous payload.
 * - Called by Vercel Cron, and safe to call by hand when CPC publishes.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET

  // Vercel Cron signs its requests with CRON_SECRET as a bearer token. When no
  // secret is configured (local dev) the route stays open.
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  revalidateTag('noaa', 'max')

  return Response.json({
    revalidated: ['noaa'],
    at: new Date().toISOString(),
  })
}
