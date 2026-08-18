import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Reveal } from './Reveal'

export function LandingCTA() {
  return (
    <section className="border-t border-border bg-white">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border bg-background px-7 py-14 sm:px-14 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-[2.1rem] font-bold leading-[1.06] tracking-[-0.02em] text-foreground sm:text-[3rem]">
                Open an account in minutes
              </h2>
              <p className="mx-auto mt-5 max-w-md text-pretty text-[16px] leading-[1.6] text-muted-foreground">
                No paperwork, no branch visit, no hidden fees. Just your email to get started.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/app?screen=signup-email"
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-[14.5px] font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-dark active:translate-y-px sm:w-auto"
                >
                  Get started
                  <ArrowUpRight
                    size={16}
                    strokeWidth={2.75}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
                <Link
                  href="/app?screen=login-email"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-white px-7 text-[14.5px] font-semibold text-foreground transition-colors duration-200 hover:border-primary/35 hover:bg-secondary sm:w-auto"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
