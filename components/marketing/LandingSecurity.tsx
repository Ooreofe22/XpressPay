import React from 'react'
import { Reveal } from './Reveal'
import { Lock, Landmark, BadgeCheck, Eye } from 'lucide-react'

const pillars = [
  {
    icon: Landmark,
    title: 'CBN regulated',
    description: 'Operating under Central Bank of Nigeria licensing and oversight.',
  },
  {
    icon: BadgeCheck,
    title: 'NDIC insured',
    description: 'Eligible deposits are insured by the Nigeria Deposit Insurance Corporation.',
  },
  {
    icon: Lock,
    title: '256-bit encryption',
    description: 'Your data is protected in transit and at rest, on every request.',
  },
  {
    icon: Eye,
    title: 'Verified accounts',
    description: 'BVN and identity checks on every account before it can move money.',
  },
]

export function LandingSecurity() {
  return (
    <section id="security" className="relative overflow-hidden bg-primary-deep">
      <div className="relative mx-auto w-full max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Security
          </p>
          <h2 className="mt-4 text-balance text-[2rem] font-bold leading-[1.08] tracking-[-0.015em] text-white sm:text-[2.6rem]">
            Regulated, insured, and built to stay that way
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-[16px] leading-[1.6] text-white/60">
            PayXpress runs on the same standards required of licensed financial institutions in
            Nigeria.
          </p>
        </Reveal>

        {/* Divided row — thin rules, no card stack */}
        <div className="mt-16 grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="h-full bg-primary-deep px-0 pb-2 sm:px-7 sm:pt-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] ring-1 ring-inset ring-white/12">
                  <Icon size={18} strokeWidth={2} className="text-white" />
                </span>
                <h3 className="mt-5 text-[15.5px] font-bold tracking-tight text-white">{title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
