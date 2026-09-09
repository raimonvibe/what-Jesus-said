import type { MetadataRoute } from 'next'
import {
  HOME_SCREEN_ICON,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_NAME,
  SITE_SHORT_NAME,
  THEME_COLOR_LIGHT,
} from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: THEME_COLOR_LIGHT,
    theme_color: THEME_COLOR_LIGHT,
    orientation: 'portrait-primary',
    lang: SITE_LANGUAGE,
    categories: ['education', 'books', 'lifestyle', 'reference'],
    icons: [
      {
        src: HOME_SCREEN_ICON.url,
        sizes: '192x192',
        type: HOME_SCREEN_ICON.type,
        purpose: 'any',
      },
      {
        src: HOME_SCREEN_ICON.url,
        sizes: '512x512',
        type: HOME_SCREEN_ICON.type,
        purpose: 'any',
      },
      {
        src: HOME_SCREEN_ICON.url,
        sizes: HOME_SCREEN_ICON.sizes,
        type: HOME_SCREEN_ICON.type,
        purpose: 'any',
      },
      {
        src: HOME_SCREEN_ICON.url,
        sizes: HOME_SCREEN_ICON.sizes,
        type: HOME_SCREEN_ICON.type,
        purpose: 'maskable',
      },
    ],
  }
}
