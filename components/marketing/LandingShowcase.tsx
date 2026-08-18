import React from 'react'
import { Reveal } from './Reveal'
import { BillsMockup, CardMockup, InsightsMockup } from './ProductMockups'

export function LandingShowcase() {
  return (
    <section id="product" className="border-t border-border bg-white">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        {/* Section intro — left-aligned, not centred, so the page has an axis */}
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            The product
          </p>
          <h2 className="mt-4 text-balance text-[2rem] font-bold leading-[1.08] tracking-[-0.015em] text-foreground sm:text-[2.6rem]">
            Every naira you move, in one place
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-[16px] leading-[1.6] text-muted-foreground">
            No switching between apps to settle a bill, top up a line, or check what you spent.
          </p>
        </Reveal>

        {/* Row 1 — asymmetric 7/5 */}
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-7 sm:p-9">
              <div className="max-w-sm">
                <h3 className="text-[1.375rem] font-bold leading-snug tracking-tight text-foreground">
                  Bills that pay themselves
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
                  Electricity, TV, internet and data — schedule each one once and PayXpress handles
                  the rest, with a receipt every time.
                </p>
              </div>
              <div className="mt-9">
                <BillsMockup />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-primary-deep p-7 sm:p-9">
              <div>
                <h3 className="text-[1.375rem] font-bold leading-snug tracking-tight text-white">
                  Cards you control
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-white/65">
                  Create a virtual card in seconds. Freeze it, set a limit, or delete it — instantly.
                </p>
              </div>
              <div className="mt-9">
                <CardMockup />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Row 2 — mirrored 5/7 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-7 sm:p-9">
              <div>
                <h3 className="text-[1.375rem] font-bold leading-snug tracking-tight text-foreground">
                  Know where it went
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
                  Clean categories and monthly totals, with statements you can export whenever you
                  need them.
                </p>
              </div>
              <div className="mt-9">
                <InsightsMockup />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-7 sm:p-9">
              <div className="max-w-sm">
                <h3 className="text-[1.375rem] font-bold leading-snug tracking-tight text-foreground">
                  Transfers that land in seconds
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
                  Any Nigerian bank, any time of day. Save a beneficiary once and repeat the payment
                  in two taps.
                </p>
              </div>

              {/* Bank rail — plain type, no logo claims */}
              <div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
                {['GTBank', 'Zenith', 'Opay', 'Kuda'].map((bank) => (
                  <div
                    key={bank}
                    className="flex h-16 items-center justify-center bg-white text-[12.5px] font-semibold text-muted-foreground"
                  >
                    {bank}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Plus every other bank and wallet on the NIBSS network.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
