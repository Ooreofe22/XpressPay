'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import {
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Banknote,
  Copy,
  ChevronRight,
  ArrowLeft,
  ReceiptText,
  Plus,
  TrendingUp,
  TrendingDown,
  Wifi,
} from 'lucide-react'
import { SendMoneyScreen } from '@/components/screens/SendMoneyScreen'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'motion/react'

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/**
 * Animated balance with count-up on change. Respects prefers-reduced-motion by
 * snapping straight to the final value instead of interpolating.
 */
function AnimatedBalance({ value, show }: { value: number; show: boolean }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!show) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      prevRef.current = value
      setDisplay(value)
      return
    }

    const start = prevRef.current
    const end = value
    if (start === end) {
      setDisplay(end)
      return
    }

    const duration = 600
    let startTime: number | null = null

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = end
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, show])

  if (!show) return <>₦ ••••••</>
  return <>{formatCurrency(display)}</>
}

export function HomeScreen() {
  const { user, transactions, setCurrentTab, bankContacts, setBillsActiveTab } = useApp()
  const [showBalance, setShowBalance] = useState(true)
  const [showSendMoney, setShowSendMoney] = useState(false)

  if (!user) return null

  if (showSendMoney) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowSendMoney(false)}
            aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center text-foreground bg-secondary hover:bg-secondary/70 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Send Money</h2>
        </div>
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden elevation-1">
          <SendMoneyScreen />
        </div>
      </div>
    )
  }

  const groupedTransactions = transactions.reduce(
    (acc, tx) => {
      const dateKey = new Date(tx.timestamp).toDateString()
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(tx)
      return acc
    },
    {} as Record<string, typeof transactions>
  )

  const moneyIn = transactions
    .filter((t) => t.type === 'received' || t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0)
  const moneyOut = transactions
    .filter((t) => t.type === 'sent' || t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0)

  const goToBills = () => {
    setBillsActiveTab('bills')
    setCurrentTab('pay')
  }

  const goToBillHistory = () => {
    setBillsActiveTab('transactions')
    setCurrentTab('pay')
  }

  const quickActions = [
    { id: 'send', icon: ArrowUpRight, title: 'Send', onClick: () => setShowSendMoney(true) },
    { id: 'receive', icon: ArrowDownLeft, title: 'Receive', onClick: () => {} },
    { id: 'bills', icon: Smartphone, title: 'Airtime & Bills', onClick: goToBills },
    { id: 'withdraw', icon: Banknote, title: 'Withdraw', onClick: () => {} },
  ]

  const txIcon = (type: string) => {
    if (type === 'received' || type === 'deposit')
      return <ArrowDownLeft size={18} className="text-credit" strokeWidth={2} />
    if (type === 'sent') return <ArrowUpRight size={18} className="text-foreground" strokeWidth={2} />
    return <ReceiptText size={18} className="text-foreground" strokeWidth={2} />
  }

  const recentContacts = bankContacts.slice(0, 4)

  return (
    <div className="ambient-mesh">
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6 items-start">
        {/* ── Main column ────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5 lg:space-y-6">
          {/* Signature moment: the balance card */}
          <motion.section
            key={user.accountBalance}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="balance-gradient rounded-2xl p-5 sm:p-6 lg:p-7 elevation-3 relative overflow-hidden shimmer-sweep"
          >
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"
            />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 relative z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs text-white/70 font-medium">Available Balance</p>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    {showBalance ? (
                      <Eye size={15} className="text-white/70" />
                    ) : (
                      <EyeOff size={15} className="text-white/70" />
                    )}
                  </button>
                </div>
                <p className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4 tabular-nums">
                  <AnimatedBalance value={user.accountBalance} show={showBalance} />
                </p>
                <button className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full px-3 py-1.5">
                  <span className="text-xs text-white/80">Acct No</span>
                  <span className="text-xs font-mono font-semibold text-white">
                    {user.accountNumber}
                  </span>
                  <Copy size={12} className="text-white/70" />
                </button>
              </div>

              <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSendMoney(true)}
                  className="inline-flex items-center gap-2 bg-white text-primary-dark font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-white/90 transition-colors"
                >
                  <ArrowUpRight size={17} strokeWidth={2.25} />
                  Send money
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={goToBills}
                  className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-white/20 transition-colors"
                >
                  <Plus size={17} strokeWidth={2.25} />
                  Pay a bill
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* Stat cards */}
          <section className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="glass rounded-2xl p-4 lg:p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-9 h-9 rounded-full bg-primary-tint flex items-center justify-center">
                  <TrendingUp size={17} className="text-primary" strokeWidth={2} />
                </span>
                <p className="text-xs font-medium text-muted-foreground">Money In</p>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
                {showBalance ? formatCurrency(moneyIn) : '₦ ••••'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass rounded-2xl p-4 lg:p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <TrendingDown size={17} className="text-foreground" strokeWidth={2} />
                </span>
                <p className="text-xs font-medium text-muted-foreground">Money Out</p>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">
                {showBalance ? formatCurrency(moneyOut) : '₦ ••••'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </motion.div>
          </section>

          {/* Quick actions */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-sm font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={action.onClick}
                    className="flex flex-col items-center gap-2.5 py-4 rounded-2xl glass hover:border-primary/30 transition-colors group"
                  >
                    <span className="w-11 h-11 rounded-full bg-primary-tint flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Icon
                        size={20}
                        strokeWidth={2}
                        className="text-primary group-hover:text-white transition-colors"
                      />
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center leading-tight px-1">
                      {action.title}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.section>

          {/* Recent transactions */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">Recent Transactions</h2>
              <button
                onClick={goToBillHistory}
                className="text-xs font-semibold text-primary hover:underline"
              >
                See all
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <ReceiptText size={22} className="text-muted-foreground" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No transactions yet</p>
                <p className="text-xs text-muted-foreground">Your recent activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedTransactions).map(([dateKey, txs]) => (
                  <div key={dateKey}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {formatDateGroup(dateKey)}
                    </p>
                    <div className="glass rounded-2xl divide-y divide-card-border overflow-hidden">
                      {txs.map((tx) => {
                        const isCredit = tx.type === 'received' || tx.type === 'deposit'
                        const amountColor = isCredit ? 'text-credit' : 'text-foreground'
                        const amountPrefix = isCredit ? '+' : '-'

                        return (
                          <div
                            key={tx.id}
                            className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCredit ? 'bg-primary-tint' : 'bg-secondary'
                              }`}
                            >
                              {txIcon(tx.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {tx.description}
                              </p>
                              <p className="text-xs text-muted-foreground">{tx.reference}</p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                              <p className={`text-sm font-bold ${amountColor}`}>
                                {amountPrefix}
                                {formatCurrency(tx.amount)}
                              </p>
                              <span className="text-[11px] font-medium text-credit capitalize">
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* ── Side column ───────────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-5 lg:space-y-6"
        >
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-semibold text-foreground">Account Setup</p>
              <p className="text-xs font-semibold text-accent">20%</p>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '20%' }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="h-full bg-accent rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Complete your profile to unlock higher limits and full features.
            </p>
            <button
              onClick={() => setCurrentTab('profile')}
              className="w-full inline-flex items-center justify-between rounded-xl bg-secondary hover:bg-secondary/70 transition-colors px-3.5 py-2.5"
            >
              <span className="text-xs font-semibold text-foreground">Continue setup</span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">My Card</h2>
              <button
                onClick={() => setCurrentTab('cards')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="bank-card-gradient rounded-2xl p-5 text-white elevation-3">
              <div className="flex items-start justify-between mb-6">
                <span className="text-xs font-semibold tracking-wide opacity-70">PAYXPRESS</span>
                <Wifi size={20} className="opacity-60" />
              </div>
              <p className="text-lg font-mono font-bold tracking-wider">**** **** **** 0123</p>
              <div className="flex items-center justify-between mt-6">
                <div>
                  <p className="text-[10px] opacity-60 uppercase">Card Holder</p>
                  <p className="text-xs font-semibold tracking-wider">
                    {user.name.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60 uppercase">Expires</p>
                  <p className="text-xs font-semibold">12/26</p>
                </div>
              </div>
            </div>
          </section>

          {recentContacts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">Saved Contacts</h2>
                <button
                  onClick={() => setShowSendMoney(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {recentContacts.map((contact) => (
                  <motion.button
                    key={contact.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowSendMoney(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:border-primary/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {initialsOf(contact.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contact.bankName} • {contact.accountNumber}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          )}
        </motion.aside>
      </div>
    </div>
  )
}
