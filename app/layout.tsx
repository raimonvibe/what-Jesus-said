import type { Metadata, Viewport } from 'next'
import './globals.css'
import './wavy-rainbow.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import ViewportInsetsProvider from '@/components/ViewportInsetsProvider'
import ReadAloudToolbar from '@/components/ReadAloudToolbar'
import { SITE_NAME, SITE_URL } from '@/lib/site'

// Stored light/dark choice, applied before first paint. Older pine/ocean
// values still map so a previous visit does not flash the wrong theme.
const themeInitScript = `(function(){try{var t=localStorage.getItem('jesus-said-theme');document.documentElement.classList.toggle('theme-dark',t==='dark'||t==='ocean');document.documentElement.classList.remove('theme-ocean');}catch(e){}})();`

/**
 * Structured data describing what this page actually is: a free reading
 * application for the New Testament World English Bible, plus the public-domain work itself.
 */
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description:
        'Read the New Testament from the World English Bible, and every saying the WEB marks as the words of Jesus, with search and read-aloud.',
      inLanguage: 'en',
      isFamilyFriendly: true,
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      url: SITE_URL,
      name: SITE_NAME,
      applicationCategory: 'ReferenceApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Read all 27 New Testament books',
        'Every saying marked as the words of Jesus',
        'Search across the New Testament',
        'Listen with browser text-to-speech',
        'Light and dark themes on pastel rainbow waves',
        'Guided tour of fourteen well-known sayings',
      ],
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
    {
      '@type': 'Book',
      '@id': `${SITE_URL}/#book`,
      name: 'World English Bible',
      alternateName: 'WEB',
      bookEdition: 'World English Bible',
      inLanguage: 'en',
      isAccessibleForFree: true,
      license: 'https://creativecommons.org/publicdomain/zero/1.0/',
      genre: 'Religious text',
      about: 'New Testament scripture and the words of Jesus',
      mainEntityOfPage: { '@id': `${SITE_URL}/#website` },
    },
  ],
}
// import PrayerChatWidget from '../components/PrayerChatWidget'

export const metadata: Metadata = {
  title: 'What Jesus Said — the New Testament, His words in red',
  description:
    'Read the New Testament from the World English Bible, and every saying the WEB marks as the words of Jesus, with the passage open beside you.',
  keywords: ['Bible', 'Jesus', 'New Testament', 'words of Jesus', 'red letter', 'Scripture', 'World English Bible', 'Gospel'],
  authors: [{ name: 'raimonvibe' }],
  creator: 'raimonvibe',
  publisher: 'raimonvibe',
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  category: 'reference',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'What Jesus Said — the New Testament, His words in red',
    description:
      'Read the New Testament from the World English Bible, and every saying the WEB marks as the words of Jesus, with the passage open beside you.',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'What Jesus Said — the New Testament with the words of Jesus marked',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Jesus Said — the New Testament, His words in red',
    description:
      'Read the New Testament from the World English Bible, and every saying the WEB marks as the words of Jesus, with the passage open beside you.',
    images: ['/opengraph-image'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'What Jesus Said',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Lets the page extend under the iPhone notch / home-indicator safe areas
  // instead of the browser reserving that strip and showing its own chrome
  // color (typically white) there. The CSS already reads env(safe-area-inset-*)
  // for the tour panel and listen button, but those resolve to 0 without this.
  viewportFit: 'cover',
  themeColor: '#faf8f7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="u-waves u-waves--masked u-waves--animated">
        <ViewportInsetsProvider />
        <main id="main-content" className="tour-safe-inset">
          <ThemeProvider>{children}</ThemeProvider>
        </main>
        <ReadAloudToolbar />
        {/* <PrayerChatWidget /> */}
      </body>
    </html>
  )
}
