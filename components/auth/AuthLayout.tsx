'use client'

import React, { useEffect, useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ArrowLeft, ShieldCheck, Zap, ReceiptText, CreditCard } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

interface AuthLayoutProps {
  children: React.ReactNode
  /** When provided, shows a back button in the form column header. */
  onBack?: () => void
  /** Small label above the form, e.g. "Log in" or "Create account". */
  eyebrow?: string
  /** 1-based step in a multi-step flow. With totalSteps, renders an animated progress rail. */
  step?: number
  totalSteps?: number
}

const highlights = [
  {
    icon: Zap,
    title: 'Instant transfers',
    desc: 'Money lands in seconds at any Nigerian bank, any time of day.',
  },
  {
    icon: ReceiptText,
    title: 'Every bill, one app',
    desc: 'Airtime, data, electricity and TV, paid in two taps with a receipt every time.',
  },
  {
    icon: CreditCard,
    title: 'Cards you control',
    desc: 'Create a virtual card in seconds. Freeze it or cap it instantly.',
  },
]

const ROTATE_MS = 4200

/**
 * Split-screen shell for every auth screen.
 * Left: the brand green panel with a self-rotating highlight card. Right: a clean white form column with an
 * animated step rail for multi-step flows.
 * All looping motion is disabled under prefers-reduced-motion.
 */
export function AuthLayout({ children, onBack, eyebrow, step, totalSteps }: AuthLayoutProps) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setActive((i) => (i + 1) % highlights.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [reduce])

  const ActiveIcon = highlights[active].icon
  const hasSteps = Boolean(step && totalSteps)

  return (
    <div className="min-h-screen flex bg-card">
      {/* ── Brand panel (desktop) ─────────────────────────────── */}
      <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[50%] splash-gradient flex-col justify-between p-10 xl:p-14 overflow-hidden">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex items-center gap-2.5"
        >
          <Logo size="sm" variant="inverse" />
          <span className="text-white font-bold text-lg tracking-tight">PayXpress</span>
        </motion.div>

        <div className="relative z-10 max-w-md">
          <motion.h2
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-white font-bold text-4xl xl:text-5xl leading-[1.05] tracking-tight text-balance"
          >
            Pay any bank, any bill, any time.
          </motion.h2>

          {/* Self-rotating highlight card */}
          <div className="mt-10 min-h-[116px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-inset ring-white/20">
                  <ActiveIcon size={20} className="text-white" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white">{highlights[active].title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/80">
                    {highlights[active].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="mt-5 flex gap-1.5">
            {highlights.map((h, i) => (
              <button
                key={h.title}
                onClick={() => setActive(i)}
                aria-label={`Show highlight ${i + 1}`}
                className="p-1"
              >
                <motion.span
                  layout
                  className={`block h-1.5 rounded-full ${
                    i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
                  }`}
                  transition={{ duration: reduce ? 0 : 0.3 }}
                />
              </button>
            ))}
          </div>
        </div>

        <p className="relative z-10 flex items-center gap-1.5 text-xs text-white/80">
          <ShieldCheck size={14} />
          Licensed by the CBN. Deposits insured by the NDIC.
        </p>
      </aside>

      {/* ── Form column ───────────────────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col bg-card">
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-5 sm:px-8">
          {onBack ? (
            <motion.button
              onClick={onBack}
              aria-label="Go back"
              whileHover={reduce ? undefined : { scale: 1.06 }}
              whileTap={reduce ? undefined : { scale: 0.92 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/70"
            >
              <ArrowLeft size={20} />
            </motion.button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            {/* Brand shown on mobile where the panel is hidden */}
            <div className="flex items-center gap-2 lg:hidden">
              <Logo size="sm" variant="brand" />
              <span className="text-base font-bold tracking-tight text-foreground">PayXpress</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-5 pb-10 sm:px-8">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-md"
          >
            {hasSteps ? (
              <div className="mb-7">
                <div className="mb-2.5 flex items-center justify-between">
                  {eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {eyebrow}
                    </p>
                  )}
                  <p className="text-xs font-medium tabular-nums text-muted-foreground">
                    Step {step} of {totalSteps}
                  </p>
                </div>
                <div className="flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps}>
                  {Array.from({ length: totalSteps! }).map((_, i) => (
                    <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: i < step! ? '100%' : '0%' }}
                        transition={{
                          duration: reduce ? 0 : 0.6,
                          ease: [0.16, 1, 0.3, 1],
                          delay: reduce ? 0 : 0.25 + i * 0.1,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              eyebrow && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  {eyebrow}
                </p>
              )
            )}
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
