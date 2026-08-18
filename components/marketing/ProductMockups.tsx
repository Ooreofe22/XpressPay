import React from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  House,
  CreditCard,
  ReceiptText,
  ChartNoAxesColumn,
  Send,
  Zap,
  Tv,
  Wifi,
  Check,
} from 'lucide-react'

/*
 * Polished, static representations of the real PayXpress product surfaces.
 * These are presentation-only components for the marketing page — they hold no
 * state, make no requests, and import nothing from the application.
 *
 * Figures use realistic Nigerian amounts, banks and billers.
 */

const navItems = [
  { icon: House, label: 'Home', active: true },
  { icon: Send, label: 'Transfers' },
  { icon: ReceiptText, label: 'Bills' },
  { icon: CreditCard, label: 'Cards' },
  { icon: ChartNoAxesColumn, label: 'Insights' },
]

const activity = [
  { name: 'Amara Nwosu', meta: 'GTBank · Transfer', amount: '−₦45,000', credit: false },
  { name: 'Chidi Okonkwo', meta: 'Opay · Received', amount: '+₦120,000', credit: true },
  { name: 'MTN', meta: 'Airtime · 0803•••4417', amount: '−₦5,000', credit: false },
  { name: 'Ikeja Electric', meta: 'Prepaid · 0101•••3181', amount: '−₦18,500', credit: false },
]

/** Wide dashboard surface — the hero's focal point. */
export function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white elevation-3">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <div className="ml-3 hidden h-6 flex-1 items-center rounded-md border border-border bg-white px-3 sm:flex">
          <span className="text-[11px] font-medium text-muted-foreground">
            app.payxpress.ng/dashboard
          </span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-[148px] shrink-0 flex-col gap-0.5 border-r border-border p-3 lg:flex">
          {navItems.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium ${
                active ? 'bg-primary-tint text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </div>
          ))}
        </aside>

        {/* Body */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          {/* Balance — the single loudest element on the page */}
          <div className="balance-gradient relative overflow-hidden rounded-xl p-5 sm:p-6">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
              Available balance
            </p>
            <p className="mt-1.5 text-[2.25rem] font-bold leading-none tracking-tight text-white tabular-nums sm:text-[2.75rem]">
              ₦1,284,500
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-primary-deep">
                <ArrowUpRight size={12} strokeWidth={2.5} /> Send money
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/20">
                <ReceiptText size={12} strokeWidth={2.5} /> Pay a bill
              </span>
            </div>
          </div>

          {/* Activity */}
          <p className="mt-6 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </p>
          <div className="mt-2 divide-y divide-border">
            {activity.map((row) => (
              <div key={row.name} className="flex items-center gap-3 py-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    row.credit ? 'bg-primary-tint' : 'bg-secondary'
                  }`}
                >
                  {row.credit ? (
                    <ArrowDownLeft size={14} className="text-credit" strokeWidth={2.25} />
                  ) : (
                    <ArrowUpRight size={14} className="text-foreground" strokeWidth={2.25} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-foreground">{row.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{row.meta}</p>
                </div>
                <p
                  className={`shrink-0 text-[13px] font-bold tabular-nums ${
                    row.credit ? 'text-credit' : 'text-foreground'
                  }`}
                >
                  {row.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Narrow transfer confirmation sheet — offset against the dashboard in the hero. */
export function TransferMockup() {
  return (
    <div className="w-[248px] overflow-hidden rounded-2xl border border-border bg-white elevation-3">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Confirm transfer
        </p>
      </div>
      <div className="px-4 py-4">
        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">₦45,000</p>
        <div className="mt-4 space-y-2.5 text-[12px]">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">To</span>
            <span className="truncate font-semibold text-foreground">Amara Nwosu</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Bank</span>
            <span className="font-semibold text-foreground">GTBank</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Fee</span>
            <span className="font-semibold text-foreground">₦0.00</span>
          </div>
        </div>
        <div className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-[12px] font-semibold text-primary-foreground">
          <Check size={13} strokeWidth={3} />
          Send now
        </div>
      </div>
    </div>
  )
}

const billers = [
  { icon: Zap, name: 'Ikeja Electric', meta: 'Prepaid meter', amount: '₦18,500' },
  { icon: Tv, name: 'DStv Compact+', meta: 'Renews 24 Aug', amount: '₦25,000' },
  { icon: Wifi, name: 'Spectranet', meta: '100GB monthly', amount: '₦22,500' },
]

/** Bills list surface. */
export function BillsMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-[12px] font-bold text-foreground">Scheduled bills</p>
        <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-semibold text-primary">
          3 upcoming
        </span>
      </div>
      <div className="divide-y divide-border">
        {billers.map(({ icon: Icon, name, meta, amount }) => (
          <div key={name} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
              <Icon size={14} className="text-primary" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-foreground">{name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{meta}</p>
            </div>
            <p className="shrink-0 text-[12px] font-bold text-foreground tabular-nums">{amount}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Virtual card face. */
export function CardMockup() {
  return (
    <div className="bank-card-gradient relative overflow-hidden rounded-xl p-5 text-white">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          PayXpress · Verve
        </span>
        <Wifi size={16} className="text-white/50" />
      </div>
      <p className="mt-8 font-mono text-[15px] font-semibold tracking-[0.14em]">
        5061 •••• •••• 4417
      </p>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/50">Card holder</p>
          <p className="text-[11px] font-semibold tracking-wide">CHIDI OKONKWO</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-white/50">Expires</p>
          <p className="text-[11px] font-semibold">09/29</p>
        </div>
      </div>
    </div>
  )
}

const spend = [
  { label: 'Bills & utilities', value: '₦61,000', pct: 46 },
  { label: 'Transfers', value: '₦45,000', pct: 34 },
  { label: 'Airtime & data', value: '₦26,500', pct: 20 },
]

/** Spending breakdown surface. */
export function InsightsMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-bold text-foreground">This month</p>
        <p className="text-[11px] text-muted-foreground">August</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">
        ₦132,500
      </p>
      <p className="text-[10px] text-muted-foreground">Total outgoing across 14 payments</p>

      <div className="mt-4 space-y-3">
        {spend.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-foreground">{row.label}</span>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                {row.value}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
