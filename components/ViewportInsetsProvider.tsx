'use client'

import { useFixedViewportInsets } from '@/hooks/useFixedViewportInsets'

export default function ViewportInsetsProvider() {
  useFixedViewportInsets()
  return null
}
