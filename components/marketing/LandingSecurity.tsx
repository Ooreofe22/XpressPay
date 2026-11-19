import React from 'react'
import { BadgeCheck, Fingerprint, Landmark, Lock } from 'lucide-react'
import { Container } from './primitives'

const pillars = [
  {
    icon: Landmark,
    title: 'CBN licensed',
    description: 'Operating under Central Bank of Nigeria licensing and oversight.',
  },
  {
    icon: BadgeCheck,
    title: 'NDIC insured',
    description: 'Eligible deposits are insured by the Nigeria Deposit Insurance Corporation.',
  },
  {
    icon: Lock,
    title: 'Always encrypted',
    description: 'Your data is encrypted on every request, in transit and at rest.',
  },
  {
    icon: Fingerprint,
    title: 'Verified with BVN',
    description: 'Every account passes a BVN and identity check before it can move money.',
  },
]

export function LandingSecurity() {
  return (
    <section id="security" className="scroll-mt-14 py-24 sm:py-32">
      <Container>
        <h2 className="type-title-1 max-w-[15ch] text-foreground">
          Licensed by the CBN. Insured by the NDIC.
        </h2>
        <p className="type-lead mt-5 max-w-[34rem] text-muted-foreground">
          PayXpress meets the same standards Nigeria sets for every licensed financial
          institution.
        </p>

        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div key={title} className="border-t border-border pt-6">
              <Icon size={22} strokeWidth={1.75} className="text-primary" />
              <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.5] text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
