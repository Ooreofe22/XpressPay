'use client'

import React from 'react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ArrowLeft, ArrowUpRight, ShieldCheck, Zap, ReceiptText, CreditCard } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

interface AuthLayoutProps {
  children: React.ReactNode
  /** When provided, shows a back button in the form column header. */
  onBack?: () => void
  /** Short context above the form, e.g. "Log in" or "Create account". */
  eyebrow?: string
  /** 1-based step in a multi-step flow. With totalSteps, renders a progress rail. */
  step?: number
  totalSteps?: number
}

const highlights = [
  { icon: Zap, title: 'Transfers in seconds', desc: 'Any Nigerian bank, any time of day.' },
  { icon: ReceiptText, title: 'Every bill in one place', desc: 'Airtime, data, power and TV with a receipt each time.' },
  { icon: CreditCard, title: 'Cards you control', desc: 'Spend straight from your balance.' },
]

function Mark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center bg-white text-primary-deep"
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
    >
      <ArrowUpRight size={size * 0.55} strokeWidth={2.75} />
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-[#0b6e4f]" />
    </span>
  )
}

/**
 * Split screen shell for every auth screen.
 * Left: the brand panel with the product promise. Right: the form column with
 * a progress rail for multi-step flows. Looping motion stops under reduced motion.
 */
export function AuthLayout({ children, onBack, eyebrow, step, totalSteps }: AuthLayoutProps) {
  const reduce = useReducedMotion()
  const hasSteps = Boolean(step && totalSteps)

  return (
    <div className="flex min-h-screen bg-card">
      {/* Brand panel */}
      <aside className="splash-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex lg:w-[46%] xl:w-1/2 xl:p-16">
        <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div aria-hidden className="absolute -right-10 top-16 h-72 w-72 rounded-full border border-white/10" />
        {!reduce && (
          <>
            <motion.div
              aria-hidden
              className="absolute -left-24 bottom-24 h-80 w-80 rounded-full bg-white/[0.06] blur-3xl"
              animate={{ y: [0, -24, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden
              className="absolute right-10 top-1/3 h-64 w-64 rounded-full bg-accent/25 blur-3xl"
              animate={{ y: [0, 18, 0], scale: [1, 1.12, 1] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
            />
          </>
        )}

        <div className="relative flex items-center gap-3">
          <Mark />
          <span className="text-[19px] font-semibold tracking-[-0.02em]">PayXpress</span>
        </div>

        <div className="relative max-w-[30rem]">
          <h2 className="text-[clamp(2.5rem,1.5rem+2.6vw,3.75rem)] font-bold leading-[1.04] tracking-[-0.035em]">
            Send money to any Nigerian bank <span className="text-accent">in seconds.</span>
          </h2>
          <ul className="mt-12 space-y-6">
            {highlights.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/12 ring-1 ring-inset ring-white/15">
                  <Icon size={19} strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold">{title}</span>
                  <span className="mt-0.5 block text-[15px] text-white/80">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[13px] text-white/80">
          <ShieldCheck size={15} />
          Licensed by the CBN. Deposits insured by the NDIC.
        </p>
      </aside>

      {/* Form column */}
      <div className="flex min-h-screen flex-1 flex-col bg-card">
        <div className="flex h-[72px] shrink-0 items-center justify-between px-5 sm:px-8">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-card-border active:scale-95"
            >
              <ArrowLeft size={19} />
            </button>
          ) : (
            <span className="flex items-center gap-2.5 lg:invisible">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-deep">
                <ArrowUpRight size={19} className="text-white" strokeWidth={2.75} />
              </span>
              <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">PayXpress</span>
            </span>
          )}
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center px-5 pb-12 sm:px-8">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-[420px]"
          >
            {(hasSteps || eyebrow) && (
              <div className="mb-8">
                <div className="flex items-baseline justify-between text-[14px]">
                  {eyebrow && <p className="font-medium text-primary">{eyebrow}</p>}
                  {hasSteps && (
                    <p className="text-muted-foreground tabular-nums">
                      Step {step} of {totalSteps}
                    </p>
                  )}
                </div>
                {hasSteps && (
                  <div
                    className="mt-3 flex gap-1.5"
                    role="progressbar"
                    aria-valuenow={step}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                  >
                    {Array.from({ length: totalSteps! }).map((_, i) => (
                      <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: i < step! ? '100%' : '0%' }}
                          transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : 0.2 + i * 0.1 }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
