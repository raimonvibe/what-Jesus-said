import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Note: /api/bible-data is deliberately left crawlable. The reader loads
      // its text from there at runtime, so blocking it would leave crawlers
      // rendering an empty page.
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
