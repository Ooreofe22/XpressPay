import React from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Home,
  CreditCard,
  Receipt,
  BarChart3,
  Send,
  Smartphone,
} from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Send, label: 'Transfers' },
  { icon: CreditCard, label: 'Cards' },
  { icon: Receipt, label: 'Bills' },
  { icon: BarChart3, label: 'Insights' },
]

const rows = [
  { name: 'Amara Nwosu', ref: 'Transfer', amount: '-₦5,000', credit: false },
  { name: 'Blessing Okoro', ref: 'Payment received', amount: '+₦15,000', credit: true },
  { name: 'MTN Airtime', ref: 'Airtime', amount: '-₦2,500', credit: false },
]

export function HeroVisual() {
  return (
    <div className="relative">
      {/* Browser-style dashboard card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card elevation-3">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <div className="ml-3 hidden h-6 flex-1 items-center rounded-md border border-border bg-card px-3 sm:flex">
            <span className="text-[11px] font-medium text-muted-foreground">app.payxpress.ng/dashboard</span>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-40 flex-col gap-1 border-r border-border bg-card p-3 sm:flex">
            <div className="mb-3 flex items-center gap-2 px-2">
              <span className="balance-gradient flex h-7 w-7 items-center justify-center rounded-lg">
                <ArrowUpRight size={15} className="text-white" strokeWidth={2.75} />
              </span>
              <span className="text-sm font-bold tracking-tight text-foreground">PayXpress</span>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium ${
                    item.active
                      ? 'bg-primary-tint text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon size={15} strokeWidth={2} />
                  {item.label}
                </div>
              )
            })}
          </div>

          {/* Main */}
          <div className="flex-1 space-y-4 p-4 sm:p-5">
            {/* Balance card */}
            <div className="balance-gradient relative overflow-hidden rounded-xl p-4 sm:p-5">
              <p className="text-[11px] font-medium text-white/70">Total balance</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">₦450,000</p>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white">
                  <ArrowUpRight size={12} /> Send
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white">
                  <Smartphone size={12} /> Airtime
                </span>
              </div>
            </div>

            {/* Transactions */}
            <div className="space-y-1">
              <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recent activity
              </p>
              {rows.map((row) => (
                <div key={row.name} className="flex items-center gap-3 rounded-lg px-1 py-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      row.credit ? 'bg-primary-tint' : 'bg-secondary'
                    }`}
                  >
                    {row.credit ? (
                      <ArrowDownLeft size={15} className="text-credit" strokeWidth={2} />
                    ) : (
                      <ArrowUpRight size={15} className="text-foreground" strokeWidth={2} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{row.name}</p>
                    <p className="text-[11px] text-muted-foreground">{row.ref}</p>
                  </div>
                  <p
                    className={`text-[13px] font-bold ${
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

      {/* Floating stat chip */}
      <div className="absolute -bottom-4 -left-4 hidden items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 elevation-2 sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint">
          <ArrowUpRight size={17} className="text-primary" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">₦2.4M+</p>
          <p className="text-[11px] text-muted-foreground">Moved this month</p>
        </div>
      </div>
    </div>
  )
}
