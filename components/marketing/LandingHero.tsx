'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { HeroVisual } from '@/components/marketing/HeroVisual'

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        },
        { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible] as const
}

function Reveal({
                  children,
                  delay = 0,
                  className = '',
                }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [ref, visible] = useReveal<HTMLDivElement>()
  return (
      <div
          ref={ref}
          className={className}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
          }}
      >
        {children}
      </div>
  )
}

export function LandingHero() {
  // @ts-ignore
  return (
      <section className="relative overflow-hidden">
        {/* Ambient gradient blooms - brand colors, unchanged tokens */}
        <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-[0.16] blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />
        <div
            aria-hidden
            className="pointer-events-none absolute top-40 -left-32 h-[400px] w-[400px] rounded-full opacity-[0.12] blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
          {/* Copy */}
          <div>
            {/*<Reveal>*/}
            {/*<span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">*/}
            {/*  <span className="h-1.5 w-1.5 rounded-full bg-primary" />*/}
            {/*  Licensed by the CBN · Insured by the NDIC*/}
            {/*</span>*/}
            {/*</Reveal>*/}

            <Reveal delay={100}>
              <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Money that moves
                <br />
                like <span className="text-primary">you</span> do.
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Pay bills, send cash, and manage your wallet in one calm, fast app
                built for the way Nigerians actually move money.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                    href="/app"
                    className="inline-flex h-13 items-center justify-center gap-1.5 rounded-2xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)] transition-all duration-200 hover:bg-primary-dark active:translate-y-px"
                >
                  Get started free
                  <ArrowRight size={17} strokeWidth={2.5} />
                </Link>
                <a
                    href="#features"
                    className="inline-flex h-13 items-center justify-center rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-7 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  See how it works
                </a>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={15} className="text-primary" />
                Bank-grade encryption · No hidden fees · Free to open
              </div>
            </Reveal>
          </div>

          {/* Visual - dashboard mockup (app.payxpress.ng/dashboard style) */}
          <Reveal delay={200}>
            <div className="relative lg:pl-4">
              <HeroVisual />
            </div>
          </Reveal>
        </div>
      </section>
  )
}