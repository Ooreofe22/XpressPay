import React from 'react'
import {
  Send,
  Smartphone,
  CreditCard,
  BarChart3,
  Clock,
  Users,
} from 'lucide-react'

const features = [
  {
    icon: Send,
    title: 'Instant transfers',
    description:
      'Move money to any Nigerian bank in seconds. Save beneficiaries and repeat transfers with a single tap.',
  },
  {
    icon: Smartphone,
    title: 'Airtime & bills',
    description:
      'Top up airtime and data, and pay electricity, TV, and internet bills without leaving the app.',
  },
  {
    icon: CreditCard,
    title: 'Virtual & physical cards',
    description:
      'Create cards instantly, freeze them anytime, and control spending with granular limits.',
  },
  {
    icon: BarChart3,
    title: 'Spending insights',
    description:
      'See where your money goes with clear categories, monthly trends, and exportable statements.',
  },
  {
    icon: Clock,
    title: 'Scheduled payments',
    description:
      'Automate recurring transfers and bill payments so nothing slips through the cracks.',
  },
  {
    icon: Users,
    title: 'Shared & business',
    description:
      'Manage personal and business money side by side with roles, approvals, and audit trails.',
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="h-px w-6 bg-primary/40" aria-hidden="true" />
            Everything in one place
            <span className="h-px w-6 bg-primary/40" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-4xl">
            One account for every kind of payment
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            From daily transfers to running a business, PayXpress brings your money together in a
            single, secure dashboard built for the web and mobile.
          </p>
        </div>

        {/* Divided grid — flat cells sharing crisp 1px dividers, Stripe/Linear style */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-border">
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative bg-card p-8 transition-colors duration-200 hover:bg-primary-tint/40"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary">
                    <Icon
                      size={20}
                      strokeWidth={2}
                      className="text-primary transition-colors duration-200 group-hover:text-white"
                    />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
