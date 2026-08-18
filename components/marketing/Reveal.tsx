'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface RevealProps {
  children: React.ReactNode
  /** Stagger offset in seconds. */
  delay?: number
  /** Vertical travel distance in px. */
  y?: number
  className?: string
}

/**
 * Scroll-triggered reveal for landing-page sections.
 *
 * Fires once when the element enters the viewport. Under
 * `prefers-reduced-motion` it collapses to a short opacity fade with no
 * translation, so nothing moves on screen for motion-sensitive users.
 */
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: reduce ? 0.2 : 0.6,
        delay: reduce ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
