'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, CreditCard, ReceiptText, Zap } from 'lucide-react'

type Rider = { icon: React.ReactNode; angle: number; tone?: 'glass' | 'accent' }

/** Upright chip that rides a ring: counter-rotates so the icon never tilts. */
function Chip({ icon, tone = 'glass', duration, reverse, reduce }: {
  icon: React.ReactNode
  tone?: 'glass' | 'accent'
  duration: number
  reverse: boolean
  reduce: boolean | null
}) {
  return (
    <motion.span
      animate={reduce ? undefined : { rotate: reverse ? 360 : -360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      className={`flex h-11 w-11 items-center justify-center rounded-[13px] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] sm:h-12 sm:w-12 ${
        tone === 'accent'
          ? 'bg-accent text-accent-foreground'
          : 'bg-white/14 text-white ring-1 ring-inset ring-white/25 backdrop-blur-md'
      }`}
    >
      {icon}
    </motion.span>
  )
}

function Ring({
  size,
  duration,
  reverse = false,
  riders = [],
  dot,
  border,
  reduce,
}: {
  size: string
  duration: number
  reverse?: boolean
  riders?: Rider[]
  dot?: boolean
  border: string
  reduce: boolean | null
}) {
  return (
    <motion.div
      aria-hidden
      className={`absolute left-1/2 top-1/2 rounded-full border ${border}`}
      style={{ width: size, height: size, x: '-50%', y: '-50%' }}
      animate={reduce ? undefined : { rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {dot && (
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_16px_4px_rgba(249,115,22,0.55)]" />
      )}
      {riders.map((r, i) => {
        const rad = ((r.angle - 90) * Math.PI) / 180
        return (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${50 + 50 * Math.cos(rad)}%`, top: `${50 + 50 * Math.sin(rad)}%` }}
          >
            <Chip icon={r.icon} tone={r.tone} duration={duration} reverse={reverse} reduce={reduce} />
          </span>
        )
      })}
    </motion.div>
  )
}

/**
 * The PayXpress mark at the centre of three slowly turning orbits, with the
 * product's three jobs (transfers, bills, cards) riding the rings.
 * Everything holds still under prefers-reduced-motion.
 */
export function OrbitHero({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()
  const icon = 'size-5 sm:size-[22px]'

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {/* Warm glow behind the mark */}
      <div aria-hidden className="absolute inset-[22%] rounded-full bg-accent/30 blur-3xl" />
      <div aria-hidden className="absolute inset-[30%] rounded-full bg-white/10 blur-2xl" />

      <Ring size="100%" duration={60} border="border-white/[0.09]" reduce={reduce}
        riders={[{ icon: <CreditCard className={icon} strokeWidth={2} />, angle: 110 }]} />
      <Ring size="74%" duration={38} reverse border="border-white/[0.14]" reduce={reduce}
        riders={[
          { icon: <Zap className={icon} strokeWidth={2.2} />, angle: 60, tone: 'accent' },
          { icon: <ReceiptText className={icon} strokeWidth={2} />, angle: 250 },
        ]} />
      <Ring size="48%" duration={22} dot border="border-white/20" reduce={reduce} />

      {/* Radar pulse from the mark */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40"
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      {/* The mark */}
      <motion.div
        initial={reduce ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        className="absolute left-1/2 top-1/2 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28%] bg-white text-primary-deep shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)]"
      >
        <ArrowUpRight className="h-[55%] w-[55%]" strokeWidth={2.75} />
        <span className="absolute bottom-[16%] right-[16%] h-[16%] w-[16%] rounded-full bg-accent" />
      </motion.div>
    </div>
  )
}
