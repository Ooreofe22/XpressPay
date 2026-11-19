import React from 'react'
import { Container } from './primitives'
import { BillsMockup, CardMockup, InsightsMockup } from './ProductMockups'

function Panel({
  title,
  body,
  children,
  className = '',
}: {
  title: string
  body: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col justify-between gap-10 rounded-[28px] bg-background p-7 sm:p-10 ${className}`}
    >
      <div className="max-w-[26rem]">
        <h3 className="type-title-2 text-foreground">{title}</h3>
        <p className="type-body mt-3 text-muted-foreground">{body}</p>
      </div>
      {children}
    </div>
  )
}

export function LandingShowcase() {
  return (
    <section id="product" className="scroll-mt-14 bg-card py-24 sm:py-32">
      <Container>
        <h2 className="type-title-1 max-w-[16ch] text-foreground">
          Bills, cards and spending, all from one balance.
        </h2>
        <p className="type-lead mt-5 max-w-[34rem] text-muted-foreground">
          No second app to top up a line, pay for light or check what went where.
        </p>

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <Panel
            className="lg:col-span-7"
            title="Bills that pay on schedule"
            body="Electricity, TV, internet and data. Set each one up once and get a receipt every time it runs."
          >
            <BillsMockup />
          </Panel>

          <Panel
            className="lg:col-span-5"
            title="A card in seconds"
            body="Create a virtual card for online spending. Freeze it or set a limit from the app."
          >
            <CardMockup />
          </Panel>

          <Panel
            className="lg:col-span-12 lg:flex-row lg:items-center"
            title="See where every naira went"
            body="Spending grouped by category each month, with statements you can export when you need them."
          >
            <div className="w-full lg:max-w-[420px]">
              <InsightsMockup />
            </div>
          </Panel>
        </div>
      </Container>
    </section>
  )
}
