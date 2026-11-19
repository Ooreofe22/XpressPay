import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { Container, CtaLink, TextLink } from './primitives'
import { TransferDemo } from './TransferDemo'

export function LandingHero() {
  return (
    <section className="pb-20 pt-16 sm:pt-24 lg:pb-28">
      <Container>
        <h1 className="type-display mx-auto max-w-[13ch] text-center text-foreground">
          Send money to any Nigerian bank{' '}
          <span className="text-primary">in seconds.</span>
        </h1>

        <p className="type-lead mx-auto mt-6 max-w-[34rem] text-center text-muted-foreground">
          Transfers, bills and virtual cards from one PayXpress balance. Sign up with your email and
          BVN, no branch visit.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
          <CtaLink href="/app?screen=signup-email" size="lg">
            Open a free account
          </CtaLink>
          <TextLink href="#transfers" className="text-[17px]">
            Try a transfer
          </TextLink>
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[13px] text-muted-foreground">
          <ShieldCheck size={15} strokeWidth={2} className="shrink-0 text-primary" />
          Licensed by the CBN. Deposits insured by the NDIC.
        </p>
      </Container>

      {/* The main feature, at full width */}
      <Container className="mt-16 sm:mt-20">
        <div id="transfers" className="scroll-mt-24">
          <TransferDemo />
        </div>
      </Container>
    </section>
  )
}
