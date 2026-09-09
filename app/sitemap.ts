import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * The reader is a single-URL application: books and chapters are selected in
 * client state rather than routed, so there is exactly one indexable page.
 * If per-chapter routes are ever added (e.g. /matthew/3), this is where they
 * should be enumerated from the Bible data.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
