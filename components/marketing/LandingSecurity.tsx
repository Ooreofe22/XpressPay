import React from 'react'
import { Landmark, ShieldCheck, Lock, BadgeCheck } from 'lucide-react'

const pillars = [
  {
    icon: Landmark,
    title: 'CBN regulated',
    description: 'Operating under Central Bank of Nigeria licensing and oversight.',
  },
  {
    icon: ShieldCheck,
    title: 'NDIC insured',
    description: 'Eligible deposits are insured by the Nigeria Deposit Insurance Corporation.',
  },
  {
    icon: Lock,
    title: 'Bank-grade encryption',
    description: 'Your data is protected in transit and at rest with 256-bit encryption.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified KYC',
    description: 'BVN and government-ID verification keep every account secure and compliant.',
  },
]

export function LandingSecurity() {
  return (
    <section id="security" className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          {/* Left — copy + premium trust panel */}
          <div className="lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="h-px w-6 bg-primary/40" aria-hidden="true" />
              Security &amp; trust
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl">
              Your money is protected at every layer
            </h2>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
              We built PayXpress on the same standards trusted by regulated financial institutions,
              so you can move money with confidence.
            </p>

            {/* Confident deep-green trust panel */}
            <div className="balance-gradient mt-8 overflow-hidden rounded-2xl p-6 text-white elevation-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
                  <Lock size={18} strokeWidth={2.25} className="text-white" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Regulated &amp; insured</p>
                  <p className="text-xs text-white/70">CBN licensed · NDIC deposit insurance</p>
                </div>
              </div>

              <div className="mt-6 h-px w-full bg-white/10" />

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">99.99%</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  uptime with 24/7 fraud monitoring on every transaction.
                </p>
              </div>
            </div>
          </div>

          {/* Right — pillar grid with crisp dividers */}
          <div className="overflow-hidden rounded-2xl border border-border bg-border">
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {pillars.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <div
                    key={pillar.title}
                    className="group bg-card p-7 transition-colors duration-200 hover:bg-primary-tint/40"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background transition-colors duration-200 group-hover:border-primary/30">
                      <Icon size={20} strokeWidth={2} className="text-primary" />
                    </span>
                    <h3 className="mt-5 text-base font-bold text-foreground">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
