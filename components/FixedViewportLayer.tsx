'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState, type ReactNode } from 'react'

type FixedViewportLayerProps = {
  children: ReactNode
  className?: string
  zIndex?: number
}

export default function FixedViewportLayer({
  children,
  className = '',
  zIndex = 50,
}: FixedViewportLayerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className={`fixed-viewport-anchor pointer-events-none ${className}`.trim()}
      style={{ zIndex }}
    >
      {children}
    </div>,
    document.body,
  )
}
