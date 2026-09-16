import type { VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [
    { path: '/api/refresh', schedule: '0 18 * * *' }, // Daily at 18:00 UTC
  ],
}

export default config
