import type { Metadata, Viewport } from 'next'

/** Canonical origin and name, shared by metadata, robots.txt and the sitemap. */
/** No trailing slash: this is concatenated (`${SITE_URL}/sitemap.xml`). */
export const SITE_URL = 'https://what-jesus-said.vercel.app'

export const SITE_NAME = 'What Jesus Said'
export const SITE_SHORT_NAME = 'Jesus Said'
export const SITE_TAGLINE = 'the New Testament, His words in red'
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`

/** Search snippets and social cards. Matches the copy on /og-image.png. */
export const SITE_DESCRIPTION =
  'The New Testament from the World English Bible, with the passage open beside every saying. 540 sayings of Jesus, His words marked in the reader.'

export const SITE_KEYWORDS = [
  'Bible',
  'Jesus',
  'New Testament',
  'words of Jesus',
  'red letter Bible',
  'Scripture',
  'World English Bible',
  'WEB Bible',
  'Gospel',
  'sayings of Jesus',
  'read the Bible online',
  'Bible read aloud',
] as const

export const SITE_AUTHOR = 'raimonvibe'
export const SITE_AUTHOR_URL = 'https://www.raimonvibe.eu/'
export const SITE_TWITTER = '@raimonvibe'
export const SITE_LANGUAGE = 'en'
export const SITE_LOCALE = 'en_US'
export const THEME_COLOR_LIGHT = '#faf8f7'
export const THEME_COLOR_DARK = '#0c0b12'

export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1376,
  height: 768,
  alt: 'What Jesus Said — a Bible with a cross, and 540 sayings from the New Testament World English Bible',
} as const

export const FAVICON = {
  url: '/favicon.ico',
  type: 'image/x-icon',
  sizes: '16x16 32x32 48x48 64x64 128x128 256x256',
} as const

export const HOME_SCREEN_ICON = {
  url: '/phone-homescreen.png',
  type: 'image/png',
  sizes: '1024x1024',
} as const

export const siteViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Lets the page extend under the iPhone notch / home-indicator safe areas
  // instead of the browser reserving that strip and showing its own chrome
  // color (typically white) there. The CSS already reads env(safe-area-inset-*)
  // for the tour panel and listen button, but those resolve to 0 without this.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR_DARK },
  ],
  colorScheme: 'light dark',
}

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: SITE_AUTHOR_URL }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  category: 'reference',
  keywords: [...SITE_KEYWORDS],
  referrer: 'origin-when-cross-origin',
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
  icons: {
    icon: [{ url: FAVICON.url, type: FAVICON.type, sizes: FAVICON.sizes }],
    shortcut: FAVICON.url,
    apple: [
      {
        url: HOME_SCREEN_ICON.url,
        sizes: HOME_SCREEN_ICON.sizes,
        type: HOME_SCREEN_ICON.type,
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: {
      url: OG_IMAGE.url,
      alt: OG_IMAGE.alt,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  },
}

/**
 * Structured data describing what this page actually is: a free reading
 * application for the New Testament World English Bible, plus the public-domain work itself.
 */
export const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#publisher`,
      name: SITE_AUTHOR,
      url: SITE_AUTHOR_URL,
      logo: `${SITE_URL}${HOME_SCREEN_ICON.url}`,
      sameAs: [
        SITE_AUTHOR_URL,
        'https://github.com/raimonvibe/',
        'https://x.com/raimonvibe/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: SITE_SHORT_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: SITE_LANGUAGE,
      isFamilyFriendly: true,
      image: `${SITE_URL}${OG_IMAGE.url}`,
      publisher: { '@id': `${SITE_URL}/#publisher` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      applicationCategory: 'ReferenceApplication',
      image: `${SITE_URL}${OG_IMAGE.url}`,
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      inLanguage: SITE_LANGUAGE,
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
      publisher: { '@id': `${SITE_URL}/#publisher` },
    },
    {
      '@type': 'Book',
      '@id': `${SITE_URL}/#book`,
      name: 'World English Bible',
      alternateName: 'WEB',
      bookEdition: 'World English Bible',
      inLanguage: SITE_LANGUAGE,
      isAccessibleForFree: true,
      license: 'https://creativecommons.org/publicdomain/zero/1.0/',
      genre: 'Religious text',
      about: 'New Testament scripture and the words of Jesus',
      mainEntityOfPage: { '@id': `${SITE_URL}/#website` },
    },
  ],
}
