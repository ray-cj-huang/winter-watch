import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

/**
 * Pulls fresh NOAA data.
 *
 * Invalidates the `noaa` tag, which covers both the CPC ENSO feed and the GFS
 * forecasts. Uses stale-while-revalidate, so a request landing mid-refresh
 * still gets the previous payload instead of blocking.
 *
 * Vercel Cron calls this on a schedule (see vercel.ts). It is also safe to
 * call by hand when CPC publishes a new week.
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
