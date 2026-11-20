'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
    Eye,
    EyeOff,
    ArrowUpRight,
    ArrowDownLeft,
    Smartphone,
    Banknote,
    Copy,
    Check,
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
import { Status } from '@/components/ui/Status'
import { txStatus } from '@/lib/txStatus'

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

export function HomeScreen() {
    const { user, transactions, currentTab, setCurrentTab, bankContacts, setBillsActiveTab } = useApp()
    const [showBalance, setShowBalance] = useState(true)
    const [showSendMoney, setShowSendMoney] = useState(false)
    const [copiedAccount, setCopiedAccount] = useState(false)

    if (!user) return null

    // Send Money sub-screen (reachable from quick action)
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

    // Group transactions by date
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
        <div className="animate-fade-up">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6 items-start">
                {/* ── Main column ─────────────────────────────────────────── */}
                <div className="xl:col-span-2 space-y-5 lg:space-y-6">
                    {/* Balance card */}
                    <section className="balance-gradient rounded-2xl p-5 sm:p-6 lg:p-7 elevation-3 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
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
                                <p className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
                                    {showBalance ? formatCurrency(user.accountBalance) : '₦ ••••••'}
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.accountNumber)
                                        setCopiedAccount(true)
                                        setTimeout(() => setCopiedAccount(false), 1500)
                                    }}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-2.5 ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/25 active:scale-[0.97]"
                                >
                                    <span className="text-xs text-white/80">Acct No</span>
                                    <span className="text-xs font-mono font-semibold text-white">
                    {user.accountNumber}
                  </span>
                                    {copiedAccount ? (
                                        <Check size={12} className="text-white" />
                                    ) : (
                                        <Copy size={12} className="text-white/70" />
                                    )}
                                </button>
                                {copiedAccount && (
                                    <p className="text-[11px] text-white/70 mt-1">Copied to clipboard</p>
                                )}
                            </div>

                            {/* Desktop quick pay buttons */}
                            <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                                <button
                                    onClick={() => setShowSendMoney(true)}
                                    className="inline-flex items-center gap-2 bg-white text-primary-dark font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-white/90 transition-colors active:scale-[0.98]"
                                >
                                    <ArrowUpRight size={17} strokeWidth={2.25} />
                                    Send money
                                </button>
                                <button
                                    onClick={goToBills}
                                    className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-white/20 transition-colors active:scale-[0.98]"
                                >
                                    <Plus size={17} strokeWidth={2.25} />
                                    Pay a bill
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Stat cards */}
                    <section className="grid grid-cols-2 gap-4">
                        <div className="bg-card border border-card-border rounded-2xl p-4 lg:p-5 elevation-1">
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
                        </div>
                        <div className="bg-card border border-card-border rounded-2xl p-4 lg:p-5 elevation-1">
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
                        </div>
                    </section>

                    {/* Quick actions */}
                    <section>
                        <h2 className="text-sm font-bold text-foreground mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {quickActions.map((action) => {
                                const Icon = action.icon
                                return (
                                    <button
                                        key={action.id}
                                        onClick={action.onClick}
                                        className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-card border border-card-border elevation-1 hover:border-primary/30 transition-all active:scale-95 group"
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
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* Recent transactions */}
                    <section>
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
                            <div className="bg-card border border-card-border rounded-2xl p-8 text-center elevation-1">
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
                                        <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border elevation-1 overflow-hidden">
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
                                                            <Status tone={txStatus(tx.status).tone} size="sm" dot>
                                                                {txStatus(tx.status).label}
                                                            </Status>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Side column ─────────────────────────────────────────── */}
                <aside className="space-y-5 lg:space-y-6">
                    {/* Account setup */}
                    <section className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
                        <div className="flex items-center justify-between mb-2.5">
                            <p className="text-sm font-semibold text-foreground">Account Setup</p>
                            <p className="text-xs font-semibold text-accent">20%</p>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                            <div className="h-full w-1/5 bg-accent rounded-full" />
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

                    {/* Card preview */}
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
                        <div className="relative w-full aspect-[1.586] rounded-2xl bank-card-gradient elevation-2 p-5 flex flex-col justify-between overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
                            <div className="flex items-start justify-between relative">
                                <div>
                                    <p className="text-white font-bold text-sm tracking-tight">PayXpress</p>
                                    <p className="text-white/50 text-[10px]">Digital Banking</p>
                                </div>
                                <Wifi size={18} className="text-white/70 rotate-90" />
                            </div>
                            <p className="text-white font-mono text-base tracking-[0.16em] relative">
                                **** **** **** 0123
                            </p>
                            <div className="flex items-end justify-between relative">
                                <div>
                                    <p className="text-white/50 text-[9px] uppercase tracking-wider mb-0.5">
                                        Card Holder
                                    </p>
                                    <p className="text-white text-xs font-semibold tracking-wide">
                                        {user.name.toUpperCase()}
                                    </p>
                                </div>
                                <p className="text-white font-bold text-sm italic tracking-tight">VERVE</p>
                            </div>
                        </div>
                    </section>

                    {/* Send again */}
                    {recentContacts.length > 0 && (
                        <section className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-foreground">Send Again</p>
                                <button
                                    onClick={() => setShowSendMoney(true)}
                                    className="text-xs font-semibold text-primary hover:underline"
                                >
                                    New
                                </button>
                            </div>
                            <div className="space-y-1">
                                {recentContacts.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setShowSendMoney(true)}
                                        className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/50 transition-colors"
                                    >
                    <span className="w-9 h-9 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-[11px]">
                        {initialsOf(c.name)}
                      </span>
                    </span>
                                        <div className="text-left min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{c.bankName}</p>
                                        </div>
                                        <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    )
}