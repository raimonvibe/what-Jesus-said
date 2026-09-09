'use client'

import { useEffect } from 'react'

/**
 * Syncs CSS custom properties with the visual viewport for fixed overlays on mobile.
 *
 * Below this, an offset is treated as animation jitter rather than a real
 * keyboard: iOS fires visualViewport resize/scroll continuously while its
 * toolbar animates in and out on scroll — a keyboard-avoidance feature this
 * reacts to, not a scroll one — and window.innerHeight (layout viewport)
 * versus visualViewport's own numbers aren't guaranteed to update in the same
 * tick during that animation, so a single frame can read a few stray pixels
 * of gap that aren't really there. A real on-screen keyboard is always much
 * taller than this, so the threshold can sit well below any genuine keyboard
 * height while still catching the toolbar's momentary mismatch.
 */
const MEANINGFUL_OFFSET_PX = 60

export function useFixedViewportInsets() {
  useEffect(() => {
    const root = document.documentElement
    let rafId = 0

    const measure = () => {
      rafId = 0
      const vv = window.visualViewport
      if (!vv) {
        root.style.setProperty('--vv-height', '100dvh')
        root.style.setProperty('--vv-offset-top', '0px')
        root.style.setProperty('--vv-offset-bottom', '0px')
        return
      }

      const offsetTop = Math.max(0, vv.offsetTop)
      const rawOffsetBottom = Math.max(
        0,
        window.innerHeight - vv.offsetTop - vv.height,
      )
      const offsetBottom =
        rawOffsetBottom < MEANINGFUL_OFFSET_PX ? 0 : rawOffsetBottom

      root.style.setProperty('--vv-height', `${vv.height}px`)
      root.style.setProperty('--vv-offset-top', `${offsetTop}px`)
      root.style.setProperty('--vv-offset-bottom', `${offsetBottom}px`)
    }

    // Coalesce the rapid-fire events below into one measurement per frame,
    // taken once layout has settled for that frame rather than mid-event.
    const sync = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(measure)
    }

    sync()
    window.visualViewport?.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.visualViewport?.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      root.style.removeProperty('--vv-height')
      root.style.removeProperty('--vv-offset-top')
      root.style.removeProperty('--vv-offset-bottom')
    }
  }, [])
}
