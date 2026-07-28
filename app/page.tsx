import React from 'react'
import { LandingNav } from '@/components/marketing/LandingNav'
import { LandingHero } from '@/components/marketing/LandingHero'
import { LandingFeatures } from '@/components/marketing/LandingFeatures'
import { LandingSecurity } from '@/components/marketing/LandingSecurity'
import { LandingFooter } from '@/components/marketing/LandingFooter'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingSecurity />
      </main>
      <LandingFooter />
    </div>
  )
}
