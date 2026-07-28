'use client'

import React from 'react'
import { Logo } from '@/components/ui/Logo'
import { ArrowLeft, ShieldCheck, Zap, ReceiptText, CreditCard } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  /** When provided, shows a back button in the form column header. */
  onBack?: () => void
  /** Optional step indicator, e.g. "Step 1 of 2". */
  eyebrow?: string
}

const highlights = [
  { icon: Zap, label: 'Instant transfers', desc: 'Send money in seconds, any bank.' },
  { icon: ReceiptText, label: 'Pay every bill', desc: 'Airtime, data, electricity and more.' },
  { icon: CreditCard, label: 'Virtual cards', desc: 'Spend safely online, anywhere.' },
]

/**
 * Web-first split-screen shell for all auth screens.
 * Left: persistent brand panel (desktop only). Right: the form content, centered.
 */
export function AuthLayout({ children, onBack, eyebrow }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Brand panel (desktop) ─────────────────────────────── */}
      <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[52%] splash-gradient flex-col justify-between p-10 xl:p-14 overflow-hidden">
        {/* subtle orbital accent, kept faint and purposeful */}
        <div
          aria-hidden
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -right-10 top-16 w-72 h-72 rounded-full border border-white/10"
        />

        <div className="relative flex items-center gap-2.5">
          <Logo size="sm" variant="inverse" />
          <span className="text-white font-bold text-lg tracking-tight">PayXpress</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-white font-bold text-4xl xl:text-5xl leading-tight tracking-tight text-balance">
            Pay Anywhere.
            <br />
            Anytime.
          </h2>
          <p className="text-white/70 text-base leading-relaxed mt-4 text-pretty">
            The modern way to move money in Nigeria — send, pay, and manage everything in one
            secure place.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, label, desc }) => (
              <li key={label} className="flex items-start gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-white" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-1.5 text-white/55 text-xs">
          <ShieldCheck size={14} />
          Licensed by the CBN. Deposits insured by the NDIC.
        </p>
      </aside>

      {/* ── Form column ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header row: back + mobile brand */}
        <div className="flex items-center justify-between px-5 sm:px-8 h-16 flex-shrink-0">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="w-10 h-10 flex items-center justify-center text-foreground bg-secondary hover:bg-secondary/70 rounded-full transition-colors active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <span />
          )}

          {/* Brand shown on mobile where the panel is hidden */}
          <div className="flex items-center gap-2 lg:invisible">
            <Logo size="sm" variant="brand" />
            <span className="text-foreground font-bold text-base tracking-tight">PayXpress</span>
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 pb-10">
          <div className="w-full max-w-md mx-auto animate-fade-up">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                {eyebrow}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
