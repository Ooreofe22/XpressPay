'use client'

import React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

/**
 * Light / dark switch. The icon shows the mode you will switch TO, and
 * rotates in on change so the click has visible confirmation.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const reduce = useReducedMotion()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex"
        >
          {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
