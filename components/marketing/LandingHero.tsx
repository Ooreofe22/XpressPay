import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { HeroVisual } from './HeroVisual'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* Copy */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Licensed by the CBN · Insured by the NDIC
          </span>

          <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Banking that moves at the speed of your business
          </h1>

          <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Send money, pay bills, and manage cards from one secure account. PayXpress gives
            Nigerians a faster, cleaner way to handle money — on the web and on the go.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-dark active:translate-y-px elevation-1"
            >
              Get Started
              <ArrowUpRight size={17} strokeWidth={2.5} />
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Explore features
            </a>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={15} className="text-primary" />
            Bank-grade encryption · No hidden fees · Free to open
          </div>
        </div>

        {/* Visual */}
        <div className="animate-fade-up lg:pl-4">
          <HeroVisual />
        </div>
      </div>
    </section>
  )
}
