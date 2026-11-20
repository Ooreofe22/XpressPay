'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import {
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  CreditCard,
  Copy,
  Check,
  ArrowLeft,
  ReceiptText,
  Wifi,
} from 'lucide-react'
import { SendMoneyScreen } from '@/components/screens/SendMoneyScreen'
import { formatCurrency } from '@/lib/utils'
import { Status } from '@/components/ui/Status'
import { txStatus } from '@/lib/txStatus'
import { Button, EmptyState, IconTile, ListRow, Panel, SectionTitle } from '@/components/app/kit'

function dateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Earlier'
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function initialsOf(name: string) {
  return name
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/** Circular progress ring for account setup. */
function Ring({ value }: { value: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--secondary)" strokeWidth="6" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
      />
    </svg>
  )
}

export function HomeScreen() {
  const { user, transactions, setCurrentTab, bankContacts, setBillsActiveTab } = useApp()
  const reduce = useReducedMotion()
  const [showBalance, setShowBalance] = useState(true)
  const [showSendMoney, setShowSendMoney] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!user) return null

  if (showSendMoney) {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => setShowSendMoney(false)}
          className="mb-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary transition-colors hover:text-primary-dark"
        >
          <ArrowLeft size={17} />
          Home
        </button>
        <h1 className="type-title-2 mb-6 text-foreground">Send money</h1>
        <Panel className="overflow-hidden">
          <SendMoneyScreen />
        </Panel>
      </div>
    )
  }

  const firstName = user.name.split(/[\s._]+/)[0]
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  const grouped = transactions.reduce(
    (acc, tx) => {
      const key = dateGroup(String(tx.timestamp))
      ;(acc[key] ??= []).push(tx)
      return acc
    },
    {} as Record<string, typeof transactions>,
  )

  const moneyIn = transactions
    .filter((t) => t.type === 'received' || t.type === 'deposit')
    .reduce((s, t) => s + t.amount, 0)
  const moneyOut = transactions
    .filter((t) => t.type === 'sent' || t.type === 'payment')
    .reduce((s, t) => s + t.amount, 0)
  const flowTotal = moneyIn + moneyOut
  const inPct = flowTotal ? Math.max(4, Math.round((moneyIn / flowTotal) * 100)) : 50

  const goToBills = () => {
    setBillsActiveTab('bills')
    setCurrentTab('pay')
  }
  const goToHistory = () => {
    setBillsActiveTab('transactions')
    setCurrentTab('pay')
  }
  const copyAccount = () => {
    navigator.clipboard?.writeText(user.accountNumber).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const actions = [
    { label: 'Send', icon: ArrowUpRight, onClick: () => setShowSendMoney(true) },
    { label: copied ? 'Copied' : 'Receive', icon: copied ? Check : ArrowDownLeft, onClick: copyAccount },
    { label: 'Airtime & bills', icon: Smartphone, onClick: goToBills },
    { label: 'Cards', icon: CreditCard, onClick: () => setCurrentTab('cards') },
  ]

  const hidden = '••••••'
  const recentContacts = bankContacts.slice(0, 4)
  const setup = 20

  return (
    <div className="animate-fade-up">
      {/* Greeting */}
      <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[15px] text-muted-foreground">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="type-title-1 mt-1 text-foreground">
            {greeting()}, {displayName}.
          </h1>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button variant="secondary" icon={<ReceiptText />} onClick={goToBills}>
            Pay a bill
          </Button>
          <Button icon={<ArrowUpRight />} onClick={() => setShowSendMoney(true)}>
            Send money
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Main column ─────────────────────────────── */}
        <div className="space-y-5 lg:space-y-6">
          {/* Balance */}
          <section className="balance-gradient relative overflow-hidden rounded-[28px] p-6 text-white elevation-3 sm:p-8">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-medium text-white/80">Available balance</p>
              <button
                onClick={() => setShowBalance((v) => !v)}
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            <p className="mt-2 text-[clamp(2.6rem,1.8rem+3.4vw,4.25rem)] font-bold leading-none tracking-[-0.04em] tabular-nums">
              {showBalance ? formatCurrency(user.accountBalance) : `₦${hidden}`}
            </p>

            <button
              onClick={copyAccount}
              className="mt-5 inline-flex items-center gap-2 text-[14px] text-white/85 transition-colors hover:text-white"
              aria-label="Copy account number"
            >
              <span>Account</span>
              <span className="font-mono font-semibold text-white">{user.accountNumber}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? 'ok' : 'copy'}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex"
                >
                  {copied ? <Check size={15} className="text-accent" strokeWidth={3} /> : <Copy size={14} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-3">
              {actions.map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label === 'Copied' ? 'Receive' : label}
                  onClick={onClick}
                  className="group flex flex-col items-center gap-2 rounded-[18px] py-3 transition-colors hover:bg-white/[0.07] active:scale-[0.97]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-white/12 ring-1 ring-inset ring-white/15 transition-colors group-hover:bg-white/20">
                    <Icon size={20} strokeWidth={2.1} />
                  </span>
                  <span className="text-center text-[12px] font-medium leading-tight text-white/90 sm:text-[13px]">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Money flow */}
          <Panel className="p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">This month</h2>
              <p className="text-[13px] text-muted-foreground">
                {transactions.length} {transactions.length === 1 ? 'payment' : 'payments'}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-6">
              <div>
                <p className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Money in
                </p>
                <p className="mt-1.5 text-[1.75rem] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
                  {showBalance ? formatCurrency(moneyIn) : `₦${hidden}`}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Money out
                </p>
                <p className="mt-1.5 text-[1.75rem] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
                  {showBalance ? formatCurrency(moneyOut) : `₦${hidden}`}
                </p>
              </div>
            </div>
            <div className="mt-5 flex h-2.5 gap-1 overflow-hidden rounded-full" aria-hidden>
              <motion.span
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${inPct}%` }}
                transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className="h-full flex-1 rounded-full bg-accent" />
            </div>
          </Panel>

          {/* Activity */}
          <section>
            <SectionTitle title="Recent activity" action={{ label: 'See all', onClick: goToHistory }} />
            {transactions.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={<ReceiptText size={22} strokeWidth={1.75} />}
                  title="No activity yet"
                  body="Your transfers and bill payments will show up here."
                  action={
                    <Button size="sm" icon={<ArrowUpRight />} onClick={() => setShowSendMoney(true)}>
                      Make a transfer
                    </Button>
                  }
                />
              </Panel>
            ) : (
              <Panel className="overflow-hidden">
                {Object.entries(grouped).map(([group, txs], gi) => (
                  <div key={group} className={gi ? 'border-t border-card-border' : ''}>
                    <p className="px-5 pb-1 pt-4 text-[13px] font-medium text-muted-foreground">{group}</p>
                    <div className="divide-y divide-card-border/70">
                      {txs.map((tx) => {
                        const credit = tx.type === 'received' || tx.type === 'deposit'
                        const s = txStatus(tx.status)
                        return (
                          <ListRow
                            key={tx.id}
                            leading={
                              <IconTile
                                tone={credit ? 'green' : tx.type === 'sent' ? 'neutral' : 'orange'}
                                icon={
                                  credit ? (
                                    <ArrowDownLeft size={18} strokeWidth={2} />
                                  ) : tx.type === 'sent' ? (
                                    <ArrowUpRight size={18} strokeWidth={2} />
                                  ) : (
                                    <ReceiptText size={18} strokeWidth={2} />
                                  )
                                }
                              />
                            }
                            title={tx.description}
                            detail={<span className="font-mono">{tx.reference}</span>}
                            trailing={
                              <span className="flex flex-col items-end gap-1">
                                <span
                                  className={`text-[15px] font-semibold tabular-nums ${credit ? 'text-credit' : 'text-foreground'}`}
                                >
                                  {credit ? '+' : '−'}
                                  {formatCurrency(tx.amount)}
                                </span>
                                <Status tone={s.tone} size="sm" dot>
                                  {s.label}
                                </Status>
                              </span>
                            }
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </Panel>
            )}
          </section>
        </div>

        {/* ── Side column ─────────────────────────────── */}
        <aside className="space-y-5 lg:space-y-6">
          <section>
            <SectionTitle title="Your card" action={{ label: 'Manage', onClick: () => setCurrentTab('cards') }} />
            <div className="bank-card-gradient relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-[22px] p-5 text-white elevation-2">
              <div className="flex items-start justify-between">
                <span className="text-[15px] font-semibold tracking-[-0.01em]">PayXpress</span>
                <Wifi size={18} className="rotate-90 text-white/80" />
              </div>
              <p className="font-mono text-[16px] tracking-[0.14em]">•••• •••• •••• 0123</p>
              <div className="flex items-end justify-between text-[12px]">
                <span className="font-medium text-white/90">{user.name}</span>
                <span className="text-[14px] font-bold italic tracking-tight">VERVE</span>
              </div>
            </div>
          </section>

          <Panel className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Ring value={setup} />
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-foreground tabular-nums">
                  {setup}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-foreground">Finish setting up</p>
                <p className="mt-0.5 text-[13px] leading-[1.4] text-muted-foreground">
                  Verify your details to raise your limits.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setCurrentTab('profile')}>
              Continue setup
            </Button>
          </Panel>

          {recentContacts.length > 0 && (
            <section>
              <SectionTitle title="Send again" action={{ label: 'New', onClick: () => setShowSendMoney(true) }} />
              <Panel className="overflow-hidden">
                <div className="divide-y divide-card-border/70">
                  {recentContacts.map((c) => (
                    <ListRow
                      key={c.id}
                      onClick={() => setShowSendMoney(true)}
                      leading={
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[13px] font-semibold text-primary">
                          {initialsOf(c.name)}
                        </span>
                      }
                      title={c.name}
                      detail={c.bankName}
                      trailing={<span className="text-muted-foreground">›</span>}
                    />
                  ))}
                </div>
              </Panel>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
