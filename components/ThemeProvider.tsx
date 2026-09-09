'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Light and dark reading themes, both sitting on the pastel-rainbow waves.
 * Older pine/ocean storage keys map onto light/dark so an existing choice
 * is not thrown away.
 */
type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'jesus-said-theme'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'ocean') return 'dark'
    if (stored === 'light' || stored === 'pine') return 'light'
  } catch {
    /* private mode */
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(readStoredTheme())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.toggle('theme-dark', theme === 'dark')
    root.classList.remove('theme-ocean')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, mounted])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
