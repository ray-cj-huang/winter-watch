import type { VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [
    // Daily, because Hobby plans reject anything more frequent. That is fine:
    // the NOAA fetches carry cacheLife('hours') and self-revalidate hourly on
    // their own, so this cron is a guaranteed floor rather than the actual
    // refresh path. 18:00 UTC lands after CPC posts the Monday ENSO update.
    // On Pro, '0 */6 * * *' would track the 00/06/12/18Z GFS runs more closely.
    { path: '/api/refresh', schedule: '0 18 * * *' },
  ],
}

export default config
