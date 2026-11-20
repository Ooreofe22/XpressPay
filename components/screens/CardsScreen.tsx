'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Wifi, Snowflake, SlidersHorizontal, FileText, Link2 } from 'lucide-react'
import { Status } from '@/components/ui/Status'
import { Button, IconTile, ListRow, PageHeader, Panel, SectionTitle } from '@/components/app/kit'

function BankCard({ masked, holder, expiry, muted }: { masked: string; holder: string; expiry: string; muted?: boolean }) {
  return (
    <div
      className={`bank-card-gradient relative flex aspect-[1.586] w-full max-w-[400px] flex-col justify-between overflow-hidden rounded-[24px] p-6 text-white shadow-[0_40px_80px_-24px_rgba(0,0,0,0.55)] sm:p-7 ${
        muted ? 'opacity-80 saturate-50' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_15%_0%,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="relative flex items-start justify-between">
        <span className="text-[16px] font-semibold tracking-[-0.01em]">PayXpress</span>
        <Wifi size={20} className="rotate-90 text-white/80" />
      </div>
      <div className="relative h-9 w-12 rounded-[7px] bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 p-1">
        <div className="grid h-full w-full grid-cols-2 gap-px">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="rounded-[2px] border border-amber-600/30" />
          ))}
        </div>
      </div>
      <p className="relative font-mono text-[18px] tracking-[0.14em] sm:text-[20px]">{masked}</p>
      <div className="relative flex items-end justify-between text-[13px]">
        <span className="font-medium text-white/90">{holder}</span>
        <span className="flex items-end gap-5">
          <span className="font-medium text-white/90 tabular-nums">{expiry}</span>
          <span className="text-[16px] font-bold italic tracking-tight">VERVE</span>
        </span>
      </div>
    </div>
  )
}

const controls = [
  { id: 'freeze', label: 'Freeze card', detail: 'Pause every payment instantly', icon: Snowflake },
  { id: 'limits', label: 'Spending limits', detail: 'Daily and monthly caps', icon: SlidersHorizontal },
  { id: 'statement', label: 'Card statement', detail: 'Download as PDF', icon: FileText },
]

export function CardsScreen() {
  const { user, transactions } = useApp()
  const reduce = useReducedMotion()
  const [kind, setKind] = useState<'physical' | 'virtual'>('physical')

  if (!user) return null

  const isVirtual = kind === 'virtual'
  const limit = 500000
  const spent = transactions
    .filter((t) => t.type === 'sent' || t.type === 'payment')
    .reduce((s, t) => s + t.amount, 0)
  const usedPct = Math.min(100, Math.round((spent / limit) * 100))

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Cards"
        subtitle="Your Verve card, linked to your PayXpress balance."
        actions={
          <div role="tablist" className="inline-grid grid-cols-2 rounded-[12px] bg-secondary p-1">
            {(['physical', 'virtual'] as const).map((k) => {
              const sel = kind === k
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={sel}
                  onClick={() => setKind(k)}
                  className={`relative h-9 rounded-[9px] px-5 text-[14px] font-medium capitalize transition-colors ${
                    sel ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sel && (
                    <motion.span
                      layoutId="cards-seg"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                      className="absolute inset-0 rounded-[9px] bg-card elevation-1"
                      aria-hidden
                    />
                  )}
                  <span className="relative">{k}</span>
                </button>
              )
            })}
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Stage */}
        <section className="relative overflow-hidden rounded-[28px] bg-primary-deep px-6 py-12 text-white sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-light/25 blur-3xl" />

          <div className="relative flex justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={kind}
                initial={reduce ? { opacity: 0 } : { opacity: 0, rotateY: -25, y: 12 }}
                animate={{ opacity: 1, rotateY: 0, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: 25, y: -12 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full [perspective:1200px]"
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <BankCard
                  masked={isVirtual ? '•••• •••• •••• 4567' : '•••• •••• •••• 0123'}
                  holder={user.name}
                  expiry={isVirtual ? '12/28' : '12/26'}
                  muted={isVirtual}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative mx-auto mt-10 max-w-md text-center">
            <h2 className="text-[24px] font-semibold tracking-[-0.025em]">
              {isVirtual ? 'A card made for online shopping.' : 'Spend straight from your balance.'}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.5] text-white/80">
              {isVirtual
                ? 'Virtual cards for subscriptions and online stores are on the way.'
                : 'Link the Verve card in your wallet and every purchase comes out of PayXpress.'}
            </p>
            <div className="mt-7 flex justify-center">
              {isVirtual ? (
                <Button variant="onBrand" disabled>
                  Coming soon
                </Button>
              ) : (
                <Button variant="onBrandSolid" icon={<Link2 />}>
                  Link your bank card
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Details */}
        <aside className="space-y-6">
          <Panel className="p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-[14px] text-muted-foreground">Available to spend</p>
              <Status tone={isVirtual ? 'neutral' : 'positive'} size="sm" dot>
                {isVirtual ? 'Not issued' : 'Active'}
              </Status>
            </div>
            <p className="mt-1.5 text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
              {formatCurrency(user.accountBalance)}
            </p>

            <div className="mt-6">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Spent this month</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatCurrency(spent)} of {formatCurrency(limit)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className={`h-full rounded-full ${usedPct > 80 ? 'bg-accent' : 'bg-primary'}`}
                  initial={false}
                  animate={{ width: `${Math.max(usedPct, 2)}%` }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </Panel>

          <section>
            <SectionTitle title="Card controls" />
            <Panel className="overflow-hidden">
              <div className="divide-y divide-card-border/70">
                {controls.map(({ id, label, detail, icon: Icon }) => (
                  <ListRow
                    key={id}
                    className="opacity-80"
                    leading={<IconTile tone={id === 'freeze' ? 'green' : 'orange'} icon={<Icon size={18} strokeWidth={2} />} />}
                    title={label}
                    detail={detail}
                    trailing={<span className="text-[13px] text-muted-foreground">Soon</span>}
                  />
                ))}
              </div>
            </Panel>
          </section>
        </aside>
      </div>
    </div>
  )
}
