import React from 'react'
import { Container, CtaLink, TextLink } from './primitives'

export function LandingCTA() {
  return (
    <section className="bg-card py-24 sm:py-32">
      <Container className="text-center">
        <h2 className="type-title-1 mx-auto max-w-[14ch] text-foreground">
          Your account is an email and a BVN away.
        </h2>
        <p className="type-lead mx-auto mt-5 max-w-[30rem] text-muted-foreground">
          No paperwork and no branch visit. Make your first transfer as soon as you finish.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
          <CtaLink href="/app?screen=signup-email" size="lg">
            Open a free account
          </CtaLink>
          <TextLink href="/app?screen=login-email" className="text-[17px]">
            Log in
          </TextLink>
        </div>
      </Container>
    </section>
  )
}
