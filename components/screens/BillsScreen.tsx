'use client'

import React, { useEffect, useState } from 'react'
import {
  Search,
  BellRing,
  ReceiptText,
  Loader2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'
import type { Biller, BillBeneficiary, Transaction } from '@/types'
import { fetchAllBillers } from '@/lib/api'
import { BillPaymentFlow } from '@/components/bills/BillPaymentFlow'
import { useApp } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'

const CATEGORY_META: Record<string, { title: string }> = {
  airtime: { title: 'Airtime' },
  data: { title: 'Data' },
  electricity: { title: 'Electricity' },
  cable: { title: 'Cable TV' },
}

const CATEGORY_ORDER = ['airtime', 'data', 'electricity', 'cable'] as const
const MAX_PER_CATEGORY = 5

// Deterministic color per provider name so the same biller always renders the same circle color
function providerColor(name: string): string {
  const palette = ['#0b5cad', '#c2560c', '#0a8f3c', '#1f2933', '#b5121b', '#e5322d']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function initialsOf(name: string): string {
  return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })
}

const BillerCircleItem: React.FC<{ biller: Biller; onSelect: (b: Biller) => void }> = ({ biller, onSelect }) => (
    <button
        onClick={() => onSelect(biller)}
        className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
    >
      <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 elevation-1 ring-1 ring-black/5 group-hover:ring-primary/30 transition-shadow"
          style={{ backgroundColor: providerColor(biller.name) }}
      >
        {initialsOf(biller.name)}
      </div>
      <p className="text-xs font-medium text-foreground text-center leading-tight max-w-16 truncate">
        {biller.name}
      </p>
    </button>
)

const BillerSection: React.FC<{
  categoryPath: string
  title: string
  billers: Biller[]
  onSelect: (b: Biller) => void
  onSeeMore: (categoryPath: string) => void
}> = ({ categoryPath, title, billers, onSelect, onSeeMore }) => {
  if (billers.length === 0) return null
  const visible = billers.slice(0, MAX_PER_CATEGORY)
  const hasMore = billers.length > MAX_PER_CATEGORY

  return (
      <div className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-foreground text-sm">{title}</p>
          {hasMore && (
              <button
                  onClick={() => onSeeMore(categoryPath)}
                  className="text-xs font-semibold text-primary hover:underline"
              >
                See more
              </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {visible.map((biller) => (
              <BillerCircleItem key={biller.uniqueCode} biller={biller} onSelect={onSelect} />
          ))}
        </div>
      </div>
  )
}

const CategoryFullList: React.FC<{
  title: string
  billers: Biller[]
  onBack: () => void
  onSelect: (b: Biller) => void
}> = ({ title, billers, onBack, onSelect }) => (
    <div className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
      <div className="flex items-center gap-3 mb-5">
        <button
            onClick={onBack}
            aria-label="Back to categories"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <p className="font-bold text-foreground text-sm">{title} · All billers</p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
        {billers.map((biller) => (
            <BillerCircleItem key={biller.uniqueCode} biller={biller} onSelect={onSelect} />
        ))}
      </div>
    </div>
)

const BeneficiariesCard: React.FC<{
  beneficiaries: BillBeneficiary[]
  onSelect: (b: BillBeneficiary) => void
}> = ({ beneficiaries, onSelect }) => {
  if (beneficiaries.length === 0) return null
  return (
      <div className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
        <p className="font-bold text-foreground text-sm mb-4">Beneficiaries</p>
        <div className="space-y-1">
          {beneficiaries.map((b) => {
            const displayName = b.billerName || b.label || b.billerUniqueCode
            return (
                <button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/50 transition-colors"
                >
            <span
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[11px]"
                style={{ backgroundColor: providerColor(displayName) }}
            >
              {initialsOf(displayName)}
            </span>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {b.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{displayName}</p>
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
                </button>
            )
          })}
        </div>
      </div>
  )
}

export function BillsScreen() {
  const { billsActiveTab, setBillsActiveTab, transactions, billerBeneficiaries, refreshTransactionHistory } = useApp()

  const [billers, setBillers] = useState<Biller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  const [prefillAccountNumber, setPrefillAccountNumber] = useState('')
  const [prefillAccountType, setPrefillAccountType] = useState<
      'prepaid' | 'postpaid' | undefined
  >(undefined)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [refreshingHistory, setRefreshingHistory] = useState(false)

  useEffect(() => {
    fetchAllBillers()
        .then(setBillers)
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not load billers'))
        .finally(() => setLoading(false))
  }, [])

  // Refetch bill payment history every time the Transactions tab becomes
  // active — without this, a payment made earlier in the session (or
  // completed via redirect back from Paystack) never shows up here until
  // the user hits the manual Refresh button, even though it's already
  // saved on the backend.
  useEffect(() => {
    if (billsActiveTab === 'transactions') {
      refreshTransactionHistory()
    }
  }, [billsActiveTab])

  const query = searchQuery.trim().toLowerCase()
  const filtered = query ? billers.filter((b) => b.name.toLowerCase().includes(query)) : billers

  const byCategory = (categoryPath: string) => filtered.filter((b) => b.categoryPath === categoryPath)

  const handleSelectBiller = (biller: Biller) => {
    setPrefillAccountNumber('')
    setPrefillAccountType(undefined)
    setSelectedBiller(biller)
  }

  const handleSelectBeneficiary = (beneficiary: BillBeneficiary) => {
    const biller = billers.find(
        (b) => b.uniqueCode === beneficiary.billerUniqueCode
    )
    if (!biller) return
    setPrefillAccountNumber(beneficiary.accountNumber ?? '')
    setPrefillAccountType(
        beneficiary.accountType as 'prepaid' | 'postpaid' | undefined
    )
    setSelectedBiller(biller)
  }

  const handleRefreshHistory = async () => {
    setRefreshingHistory(true)
    await refreshTransactionHistory()
    setRefreshingHistory(false)
  }

  const groupedTransactions = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const dateKey = new Date(tx.timestamp).toDateString()
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(tx)
    return acc
  }, {})

  return (
      <div className="animate-fade-up space-y-6">
        {/* Section header: title + segmented control */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Pay a bill</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Top up airtime, data, TV, electricity and more
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-secondary p-1" role="tablist">
            {(
                [
                  { id: 'bills', label: 'Pay Bills' },
                  { id: 'transactions', label: 'Transactions' },
                ] as const
            ).map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={billsActiveTab === tab.id}
                    onClick={() => setBillsActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        billsActiveTab === tab.id
                            ? 'bg-card text-primary elevation-1'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab.label}
                </button>
            ))}
          </div>
        </div>

        {billsActiveTab === 'bills' ? (
            <div className="grid gap-6 lg:grid-cols-3 items-start">
              {/* Left rail: search + beneficiaries */}
              <div className="space-y-5 lg:col-span-1">
                <div className="relative">
                  <Search
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                      type="text"
                      placeholder="Find a biller"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-card border border-card-border rounded-xl text-sm placeholder:text-muted-foreground/70 text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                  />
                </div>

                {billerBeneficiaries.length > 0 ? (
                    <BeneficiariesCard beneficiaries={billerBeneficiaries} onSelect={handleSelectBeneficiary} />
                ) : (
                    <div className="p-5 bg-primary-tint border border-primary/15 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0 elevation-1">
                          <BellRing className="text-primary" size={17} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-foreground mb-0.5">Update on Bills</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Pay a bill and check "Save as beneficiary" to have it show up here next time
                          </p>
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Biller categories grid */}
              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
                {loading && (
                    <div className="sm:col-span-2 bg-card border border-card-border rounded-2xl p-8 flex items-center justify-center gap-2 text-muted-foreground elevation-1">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Loading billers…</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="sm:col-span-2 bg-card border border-card-border rounded-2xl p-8 flex flex-col items-center text-center gap-2 elevation-1">
                      <AlertCircle size={22} className="text-destructive" />
                      <p className="text-sm font-semibold text-foreground">Could not load billers</p>
                      <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="sm:col-span-2 bg-card border border-card-border rounded-2xl p-8 text-center elevation-1">
                      <p className="text-sm font-semibold text-foreground mb-1">No billers found</p>
                      <p className="text-xs text-muted-foreground">
                        {query ? 'Try a different search term' : 'Run the biller catalog sync on the backend first'}
                      </p>
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && expandedCategory && (
                    <div className="sm:col-span-2">
                      <CategoryFullList
                          title={CATEGORY_META[expandedCategory]?.title ?? expandedCategory}
                          billers={byCategory(expandedCategory)}
                          onBack={() => setExpandedCategory(null)}
                          onSelect={handleSelectBiller}
                      />
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && !expandedCategory && (
                    <>
                      {CATEGORY_ORDER.map((categoryPath) => (
                          <BillerSection
                              key={categoryPath}
                              categoryPath={categoryPath}
                              title={CATEGORY_META[categoryPath].title}
                              billers={byCategory(categoryPath)}
                              onSelect={handleSelectBiller}
                              onSeeMore={setExpandedCategory}
                          />
                      ))}
                    </>
                )}
              </div>
            </div>
        ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Bill payment history</p>
                <button
                    onClick={handleRefreshHistory}
                    disabled={refreshingHistory}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  <RefreshCw size={13} className={refreshingHistory ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {transactions.length === 0 ? (
                  <div className="bg-card border border-card-border rounded-2xl elevation-1 flex items-center justify-center min-h-96 px-8">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <ReceiptText size={26} className="text-muted-foreground" strokeWidth={1.75} />
                      </div>
                      <p className="text-foreground font-bold mb-1">No bill payments yet</p>
                      <p className="text-sm text-muted-foreground text-pretty">
                        Your bill payment history will appear here
                      </p>
                    </div>
                  </div>
              ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedTransactions).map(([dateKey, txs]) => (
                        <div key={dateKey}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            {formatDateGroup(dateKey)}
                          </p>
                          <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border elevation-1 overflow-hidden">
                            {txs.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors"
                                >
                                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                    <ReceiptText size={18} className="text-foreground" strokeWidth={2} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                                    <p className="text-xs text-muted-foreground">{tx.reference}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(tx.amount)}</p>
                                    <span
                                        className={`text-[11px] font-medium capitalize ${
                                            tx.status === 'completed'
                                                ? 'text-credit'
                                                : tx.status === 'failed'
                                                    ? 'text-destructive'
                                                    : 'text-muted-foreground'
                                        }`}
                                    >
                            {tx.status}
                          </span>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
        )}

        {selectedBiller && (
            <BillPaymentFlow
                biller={selectedBiller}
                initialAccountNumber={prefillAccountNumber}
                initialAccountType={prefillAccountType}
                onClose={() => {
                  setSelectedBiller(null)
                  setPrefillAccountNumber('')
                  setPrefillAccountType(undefined)
                }}
            />
        )}
      </div>
  )
}