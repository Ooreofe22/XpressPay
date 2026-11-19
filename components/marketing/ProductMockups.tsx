import React from 'react'
import { Snowflake, Tv, Wifi, Zap } from 'lucide-react'

/*
 * Static product surfaces for the landing page. Presentation only: no state,
 * no requests. All colours come from design tokens so they follow the theme.
 */

const billers = [
  { icon: Zap, name: 'Ikeja Electric', meta: 'Prepaid meter, every 1st', amount: '₦18,500' },
  { icon: Tv, name: 'DStv Compact+', meta: 'Renews 24 Aug', amount: '₦25,000' },
  { icon: Wifi, name: 'Spectranet', meta: '100GB monthly', amount: '₦22,500' },
]

export function BillsMockup() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card elevation-2">
      <div className="flex items-baseline justify-between px-5 pb-2 pt-4">
        <p className="text-[15px] font-semibold text-foreground">Scheduled</p>
        <p className="text-[13px] text-muted-foreground">Next 30 days</p>
      </div>
      <ul className="divide-y divide-border">
        {billers.map(({ icon: Icon, name, meta, amount }) => (
          <li key={name} className="flex items-center gap-3 px-5 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Icon size={16} className="text-foreground" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-foreground">{name}</span>
              <span className="block truncate text-[13px] text-muted-foreground">{meta}</span>
            </span>
            <span className="shrink-0 text-[15px] font-semibold text-foreground tabular-nums">
              {amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Virtual card face. The card number is the one place mono earns its keep. */
export function CardMockup() {
  return (
    <div className="space-y-3">
      <div className="bank-card-gradient relative aspect-[1.586] w-full overflow-hidden rounded-2xl p-5 text-white sm:p-6">
        <div className="flex items-start justify-between">
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-white/90">
            PayXpress
          </span>
          <span className="text-[12px] font-medium text-white/80">Virtual</span>
        </div>
        <p className="absolute bottom-14 left-5 font-mono text-[15px] tracking-[0.12em] sm:left-6 sm:text-[17px]">
          5061 •••• •••• 4417
        </p>
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-[12px] sm:left-6 sm:right-6">
          <span className="font-medium text-white/90">Chidi Okonkwo</span>
          <span className="font-medium text-white/90 tabular-nums">09/29</span>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 elevation-1">
        <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
          <Snowflake size={15} strokeWidth={2} className="text-primary" />
          Freeze card
        </span>
        <span className="relative h-[26px] w-11 rounded-full bg-secondary" aria-hidden>
          <span className="absolute left-0.5 top-0.5 h-[22px] w-[22px] rounded-full bg-card elevation-1" />
        </span>
      </div>
    </div>
  )
}

const spend = [
  { label: 'Bills and utilities', value: '₦61,000', pct: 46 },
  { label: 'Transfers', value: '₦45,000', pct: 34 },
  { label: 'Airtime and data', value: '₦26,500', pct: 20 },
]

export function InsightsMockup() {
  return (
    <div className="rounded-2xl bg-card p-5 elevation-2 sm:p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-[15px] font-semibold text-foreground">August spending</p>
        <p className="text-[13px] text-muted-foreground">14 payments</p>
      </div>
      <p className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
        ₦132,500
      </p>

      <div className="mt-5 flex h-2.5 w-full gap-1 overflow-hidden rounded-full">
        {spend.map((row, i) => (
          <span
            key={row.label}
            className="h-full rounded-full bg-primary"
            style={{ width: `${row.pct}%`, opacity: 1 - i * 0.3 }}
          />
        ))}
      </div>

      <ul className="mt-5 space-y-2.5">
        {spend.map((row, i) => (
          <li key={row.label} className="flex items-center justify-between text-[14px]">
            <span className="flex items-center gap-2 text-foreground">
              <span
                className="h-2 w-2 rounded-full bg-primary"
                style={{ opacity: 1 - i * 0.3 }}
                aria-hidden
              />
              {row.label}
            </span>
            <span className="font-medium text-muted-foreground tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
