'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'light' ? 'Switch to the dark reading theme' : 'Switch to the light reading theme'
      }
      title={theme === 'light' ? 'Light theme' : 'Dark theme'}
      className="btn-surface p-2.5 rounded-xl duration-200 hover:scale-105 shadow-md"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Sun className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  )
}
