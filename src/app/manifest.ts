import type { MetadataRoute } from 'next'
import { SITE_DEK, SITE_NAME } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Winter Watch',
    description: SITE_DEK,
    start_url: '/',
    display: 'minimal-ui',
    background_color: '#e9eef0',
    theme_color: '#0c1b24',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
