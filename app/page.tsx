import React from 'react'
import { LandingNav } from '@/components/marketing/LandingNav'
import { LandingHero } from '@/components/marketing/LandingHero'
import { LandingShowcase } from '@/components/marketing/LandingShowcase'
import { LandingSecurity } from '@/components/marketing/LandingSecurity'
import { LandingCTA } from '@/components/marketing/LandingCTA'
import { LandingFooter } from '@/components/marketing/LandingFooter'

export default function Page() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingShowcase />
        <LandingSecurity />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
