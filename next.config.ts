import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components: data is dynamic by default and we opt specific
  // NOAA fetches into the cache with `use cache` + cacheLife + cacheTag.
  // This also turns on Partial Prerendering, so the page shell is static
  // while the forecast panels stream in.
  cacheComponents: true,
}

export default nextConfig
