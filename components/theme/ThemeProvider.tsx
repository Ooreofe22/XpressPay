'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'payxpress-theme'

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the
 * wrong theme. A saved choice wins; otherwise the OS preference is used.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var d=document.documentElement;d.classList.toggle('dark',t==='dark');d.style.colorScheme=t}catch(e){}})()`

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function apply(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]:not([media])')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#f5f5f7')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The init script already set the class; read it back so state matches.
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light')

    // Follow the OS only while the user hasn't made an explicit choice.
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null
      try {
        saved = localStorage.getItem(STORAGE_KEY)
      } catch {}
      if (saved) return
      const next: Theme = e.matches ? 'dark' : 'light'
      apply(next)
      setThemeState(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    apply(next)
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
  }, [setTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
