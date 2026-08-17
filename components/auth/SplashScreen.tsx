'use client'

import React from 'react'
import { useApp } from '@/context/AppContext'
import { Logo } from '@/components/ui/Logo'
import { ShieldCheck, Zap, ReceiptText, CreditCard } from 'lucide-react'

const features = [
  { icon: Zap, label: 'Instant transfers' },
  { icon: ReceiptText, label: 'Pay every bill' },
  { icon: CreditCard, label: 'Virtual cards' },
]

export function SplashScreen() {
  const { setAuthScreen } = useApp()

  return (
    <div className="min-h-screen splash-gradient relative overflow-hidden">
      {/* Faint orbital accents */}
      <div
        aria-hidden
        className="absolute -right-40 -top-40 w-[32rem] h-[32rem] rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="absolute -left-32 bottom-0 w-[28rem] h-[28rem] rounded-full border border-white/10"
      />

      

      {/* Hero */}
      <main className="relative max-w-6xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center pt-10 sm:pt-16 pb-16">
        <div className="animate-fade-up flex flex-col items-center">
          <Logo size="lg" variant="inverse" showOrbital animated />

          <p className="text-white/80 text-sm font-semibold tracking-[0.2em] uppercase mt-10">
            PayXpress
          </p>
          <h1 className="text-white font-bold text-4xl sm:text-6xl leading-[1.05] tracking-tight text-balance mt-3 max-w-3xl">
            Pay Anywhere. Anytime.
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mt-5 text-pretty">
            Send money, pay bills, and manage your finances fast, secure, and built for the way
            Nigeria moves money.
          </p>

          {/* Feature chips */}
          <ul className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
            {features.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm text-white/90 font-medium"
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-10 w-full max-w-md">
            <button
              onClick={() => setAuthScreen('signup-email')}
              className="w-full sm:flex-1 h-13 rounded-xl bg-accent text-accent-foreground font-semibold text-base transition-all duration-200 hover:bg-accent/90 active:scale-[0.98] elevation-2"
            >
              Create an account
            </button>
            <button
              onClick={() => setAuthScreen('login-email')}
              className="w-full sm:flex-1 h-13 rounded-xl border border-white/40 bg-white/5 text-white font-semibold text-base transition-all duration-200 hover:bg-white/15 active:scale-[0.98]"
            >
              Log in
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-white/55 text-xs mt-8">
            <ShieldCheck size={13} />
            Licensed by the CBN. Deposits insured by the NDIC.
          </p>
        </div>
      </main>
    </div>
  )
}
