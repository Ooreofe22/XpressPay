'use client'

import React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { DashboardMockup, TransferMockup } from './ProductMockups'

export function LandingHero() {
  const reduce = useReducedMotion()

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 20 },
    animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? 0.25 : 0.7,
      delay: reduce ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  })

  return (
      <section className="relative overflow-hidden">
        {/* Single restrained tint anchored top-left — not a full-bleed gradient wash */}
        <div
            aria-hidden
            className="pointer-events-none absolute -left-1/4 -top-1/3 h-[560px] w-[720px] rounded-full bg-primary/[0.07] blur-[120px]"
        />
        {/* Orange accent bloom — brings back the warmth from the original */}
        <div
            aria-hidden
            className="pointer-events-none absolute top-1/4 -right-1/4 h-[480px] w-[600px] rounded-full bg-accent/[0.08] blur-[120px]"
        />

        <div className="relative mx-auto w-full max-w-[1180px] px-5 pb-20 pt-14 sm:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-12">
            {/* ── Copy ─────────────────────────────────────────────── */}
            <div className="max-w-xl">
              <motion.p
                  {...rise(0)}
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
              >
                Payments built for Nigeria
              </motion.p>

              <motion.h1
                  {...rise(0.08)}
                  className="mt-5 text-balance text-[2.6rem] font-bold leading-[1.02] tracking-[-0.02em] text-foreground sm:text-[3.4rem] lg:text-[4rem]"
              >
                Send, pay and spend
                <br className="hidden sm:block" />{' '}
                <span className="text-primary">without the wait.</span>
              </motion.h1>

              <motion.p
                  {...rise(0.16)}
                  className="mt-6 max-w-md text-pretty text-[16.5px] leading-[1.6] text-muted-foreground"
              >
                One account for transfers to any Nigerian bank, every bill you owe, and cards you
                control down to the last naira.
              </motion.p>

              <motion.div {...rise(0.24)} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                    href="/app?screen=signup-email"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-[14.5px] font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-dark active:translate-y-px"
                >
                  Open a free account
                  <ArrowUpRight
                      size={16}
                      strokeWidth={2.75}
                      className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
                <a
                    href="#product"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-7 text-[14.5px] font-semibold text-foreground transition-colors duration-200 hover:border-primary/35 hover:bg-secondary"
                >
                  See the product
                </a>
              </motion.div>

              <motion.div
                  {...rise(0.32)}
                  className="mt-10 flex items-center gap-2.5 border-t border-border pt-6"
              >
                <ShieldCheck size={15} className="shrink-0 text-primary" strokeWidth={2.25} />
                <p className="text-[12.5px] text-muted-foreground">
                  Licensed by the CBN · Deposits insured by the NDIC
                </p>
              </motion.div>
            </div>

            {/* ── Product visual ───────────────────────────────────── */}
            <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.985 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: reduce ? 0.25 : 0.85,
                  delay: reduce ? 0 : 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative"
            >
              <DashboardMockup />

              {/* One offset surface for depth — hidden on small screens to avoid clipping */}
              <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, x: 12 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 }}
                  transition={{
                    duration: reduce ? 0.25 : 0.7,
                    delay: reduce ? 0 : 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute -bottom-8 -left-10 hidden xl:block"
              >
                <TransferMockup />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
  )
}