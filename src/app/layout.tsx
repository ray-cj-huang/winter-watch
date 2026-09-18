import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE_DEK, SITE_NAME, SITE_URL, ogImage } from '@/lib/site'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  weight: ['400', '600'],
  style: ['normal', 'italic'],
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-plex-sans',
  weight: ['400', '500', '600'],
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
})

const BOARD_CARD = ogImage(
  '/api/og?card=board',
  'Pass destinations ranked against the current ENSO state',
)

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DEK,
  applicationName: SITE_NAME,
  authors: [{ name: 'Ray Huang' }],
  creator: 'Ray Huang',
  keywords: [
    'ENSO',
    'El Niño',
    'NOAA',
    'GFS',
    'snow forecast',
    'seasonal outlook',
    'skiing',
    'Ikon Pass',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: '/',
    title: SITE_NAME,
    description: SITE_DEK,
    images: [BOARD_CARD],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DEK,
    images: [BOARD_CARD],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
