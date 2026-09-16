import type { VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [
    // NOAA GFS runs at 00/06/12/18Z; CPC publishes the new ENSO week each
    // Monday. Re-pulling every six hours keeps both current. The cached
    // fetches also self-revalidate hourly, so this is a floor, not the only
    // refresh path.
    { path: '/api/refresh', schedule: '0 */6 * * *' },
  ],
}

export default config
