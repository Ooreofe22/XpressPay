'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { ArrowUpRight, ShieldCheck, Zap, ReceiptText, CreditCard } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/app/kit'
import { OrbitHero } from '@/components/auth/OrbitHero'

const features = [
  { icon: Zap, label: 'Transfers in seconds' },
  { icon: ReceiptText, label: 'Every bill in one place' },
  { icon: CreditCard, label: 'Cards you control' },
]

export function SplashScreen() {
  const { setAuthScreen } = useApp()
  const reduce = useReducedMotion()

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: reduce ? 0 : delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    <div className="splash-gradient relative flex min-h-screen flex-col overflow-hidden text-white">
      <div aria-hidden className="absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full border border-white/10" />

      <header className="relative z-10 flex h-[72px] items-center justify-between px-6 sm:px-10">
        <span className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-primary-deep">
            <ArrowUpRight size={20} strokeWidth={2.75} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-[#0b6e4f]" />
          </span>
          <span className="text-[18px] font-semibold tracking-[-0.02em]">PayXpress</span>
        </span>
        <ThemeToggle className="text-white hover:bg-white/10" />
      </header>

      <main className="relative mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-6 px-6 pb-14 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        {/* Orbit: first on phones, right column on desktop */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:order-2 lg:max-w-[540px]"
        >
          <OrbitHero />
        </motion.div>

        <div className="text-center lg:order-1 lg:text-left">
          <motion.h1
            {...rise(0.1)}
            className="mx-auto max-w-[13ch] text-[clamp(2.5rem,1.4rem+4.4vw,4.75rem)] lg:max-w-[14ch] font-bold leading-[1.02] tracking-[-0.038em] lg:mx-0"
          >
            Send money to any Nigerian bank <span className="text-accent">in seconds.</span>
          </motion.h1>
          <motion.p
            {...rise(0.2)}
            className="mx-auto mt-6 max-w-[30rem] text-[clamp(1.0625rem,1rem+0.4vw,1.25rem)] leading-[1.5] text-white/85 lg:mx-0"
          >
            Transfers, bills and cards from one PayXpress balance. Sign up with your email and BVN.
          </motion.p>

          <motion.ul
            {...rise(0.28)}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start"
          >
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[15px] text-white/90">
                <Icon size={17} strokeWidth={2} className="text-accent" />
                {label}
              </li>
            ))}
          </motion.ul>

          <motion.div {...rise(0.36)} className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row lg:mx-0">
            <Button size="lg" variant="accent" className="w-full sm:flex-1" onClick={() => setAuthScreen('signup-email')}>
              Open a free account
            </Button>
            <Button size="lg" variant="onBrand" className="w-full sm:flex-1" onClick={() => setAuthScreen('login-email')}>
              Log in
            </Button>
          </motion.div>

          <motion.p
            {...rise(0.44)}
            className="mt-8 flex items-center justify-center gap-1.5 text-[13px] text-white/80 lg:justify-start"
          >
            <ShieldCheck size={14} />
            Licensed by the CBN. Deposits insured by the NDIC.
          </motion.p>
        </div>
      </main>
    </div>
  )
}
