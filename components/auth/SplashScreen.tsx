'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { ArrowUpRight, ShieldCheck, Zap, ReceiptText, CreditCard } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/app/kit'

const features = [
  { icon: Zap, label: 'Transfers in seconds' },
  { icon: ReceiptText, label: 'Every bill in one place' },
  { icon: CreditCard, label: 'Cards you control' },
]

export function SplashScreen() {
  const { setAuthScreen } = useApp()
  const reduce = useReducedMotion()

  return (
    <div className="splash-gradient relative flex min-h-screen flex-col overflow-hidden text-white">
      <div aria-hidden className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full border border-white/10" />
      <div aria-hidden className="absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full border border-white/10" />
      <div aria-hidden className="absolute right-[10%] top-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <header className="relative flex h-[72px] items-center justify-between px-6 sm:px-10">
        <span className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-primary-deep">
            <ArrowUpRight size={20} strokeWidth={2.75} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-[#0b6e4f]" />
          </span>
          <span className="text-[18px] font-semibold tracking-[-0.02em]">PayXpress</span>
        </span>
        <ThemeToggle className="text-white hover:bg-white/10" />
      </header>

      <motion.main
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-20 text-center"
      >
        <h1 className="max-w-[13ch] text-[clamp(2.75rem,1.6rem+5vw,5rem)] font-bold leading-[1.02] tracking-[-0.038em]">
          Send money to any Nigerian bank <span className="text-accent">in seconds.</span>
        </h1>
        <p className="mt-6 max-w-[32rem] text-[clamp(1.0625rem,1rem+0.4vw,1.25rem)] leading-[1.5] text-white/85">
          Transfers, bills and cards from one PayXpress balance. Sign up with your email and BVN.
        </p>

        <ul className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[15px] text-white/90">
              <Icon size={17} strokeWidth={2} className="text-accent" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-11 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            variant="accent"
            className="w-full sm:flex-1"
            onClick={() => setAuthScreen('signup-email')}
          >
            Open a free account
          </Button>
          <Button size="lg" variant="onBrand" className="w-full sm:flex-1" onClick={() => setAuthScreen('login-email')}>
            Log in
          </Button>
        </div>

        <p className="mt-9 flex items-center gap-1.5 text-[13px] text-white/80">
          <ShieldCheck size={14} />
          Licensed by the CBN. Deposits insured by the NDIC.
        </p>
      </motion.main>
    </div>
  )
}
