'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { formatCurrency } from '@/lib/utils'

interface AnimatedBalanceProps {
  value: number
  /** When false, renders the masked placeholder instead of the number. */
  visible?: boolean
  className?: string
}

const DURATION_MS = 600

/**
 * Counts from the previously rendered balance up (or down) to the new one
 * whenever `value` changes — e.g. after a wallet debit. Snaps straight to the
 * final value when the user prefers reduced motion, and on first paint so the
 * dashboard never animates from zero on load.
 */
export function AnimatedBalance({ value, visible = true, className }: AnimatedBalanceProps) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const firstPaintRef = useRef(true)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (firstPaintRef.current) {
      firstPaintRef.current = false
      fromRef.current = value
      setDisplay(value)
      return
    }

    if (reduceMotion) {
      fromRef.current = value
      setDisplay(value)
      return
    }

    const from = fromRef.current
    const to = value
    if (from === to) return

    let start: number | null = null

    const tick = (now: number) => {
      if (start === null) start = now
      const progress = Math.min((now - start) / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, reduceMotion])

  if (!visible) {
    return <span className={className}>₦ ••••••</span>
  }

  return (
    <motion.span
      key={value}
      initial={reduceMotion ? undefined : { opacity: 0.85 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`tabular-nums ${className ?? ''}`}
    >
      {formatCurrency(display)}
    </motion.span>
  )
}
