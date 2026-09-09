import type { Metadata, Viewport } from 'next'
import './globals.css'
import './wavy-rainbow.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import ViewportInsetsProvider from '@/components/ViewportInsetsProvider'
import ReadAloudToolbar from '@/components/ReadAloudToolbar'
import {
  SITE_LANGUAGE,
  siteMetadata,
  siteViewport,
  structuredData,
} from '@/lib/site'

export const metadata: Metadata = siteMetadata
export const viewport: Viewport = siteViewport

// Stored light/dark choice, applied before first paint. Older pine/ocean
// values still map so a previous visit does not flash the wrong theme.
const themeInitScript = `(function(){try{var t=localStorage.getItem('jesus-said-theme');document.documentElement.classList.toggle('theme-dark',t==='dark'||t==='ocean');document.documentElement.classList.remove('theme-ocean');}catch(e){}})();`

// import PrayerChatWidget from '../components/PrayerChatWidget'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={SITE_LANGUAGE} suppressHydrationWarning>
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
