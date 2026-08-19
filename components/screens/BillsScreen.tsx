'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  Search,
  BellRing,
  ReceiptText,
  Loader2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  BookmarkCheck,
} from 'lucide-react'
import type { Biller, BillBeneficiary, Transaction } from '@/types'
import { fetchAllBillers } from '@/lib/api'
import { BillPaymentFlow } from '@/components/bills/BillPaymentFlow'
import { useApp } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'

const CATEGORY_META: Record<
    string,
    { title: string; hint: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }
> = {
  airtime: { title: 'Airtime', hint: 'All networks', icon: Smartphone },
  data: { title: 'Data', hint: 'Internet bundles', icon: Wifi },
  electricity: { title: 'Electricity', hint: 'Prepaid & postpaid', icon: Zap },
  cable: { title: 'Cable TV', hint: 'DStv, GOtv & more', icon: Tv },
}

const CATEGORY_ORDER = ['airtime', 'data', 'electricity', 'cable'] as const
const MAX_PER_CATEGORY = 5

// Deterministic color per provider name so the same biller always renders the same mark color
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

function maskIdentifier(value?: string): string {
  if (!value) return ''
  const digits = value.replace(/\s/g, '')
  return digits.length <= 4 ? digits : `•••• ${digits.slice(-4)}`
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

/** Brand mark for a biller — real logo when XpressPay supplies one, otherwise a gradient monogram. */
const BillerMark: React.FC<{ name: string; imageUrl?: string | null; size?: 'sm' | 'md' }> = ({
  name,
  imageUrl,
  size = 'md',
}) => {
  const c = providerColor(name)
  const [imgFailed, setImgFailed] = useState(false)
  const dimensions = size === 'md' ? 'h-10 w-10' : 'h-9 w-9'

  if (imageUrl && !imgFailed) {
    return (
        <span
            className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white ring-1 ring-inset ring-card-border ${dimensions}`}
        >
        <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-contain p-1"
            onError={() => setImgFailed(true)}
            loading="lazy"
        />
      </span>
    )
  }

  return (
      <span
          className={`flex flex-shrink-0 items-center justify-center rounded-[10px] font-bold text-white ring-1 ring-inset ring-white/20 ${
              size === 'md' ? 'text-[11px]' : 'text-[10px]'
          } ${dimensions}`}
          style={{
            backgroundImage: `linear-gradient(140deg, ${c} 0%, ${c} 45%, rgba(0,0,0,0.32) 165%)`,
            boxShadow: `0 2px 8px -2px ${c}55`,
          }}
      >
      {initialsOf(name)}
    </span>
  )
}

/** One biller row — name + mark + reveal-on-hover chevron. */
const BillerRow: React.FC<{
  biller: Biller
  onSelect: (b: Biller) => void
  secondary?: string
}> = ({ biller, onSelect, secondary }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(biller)}
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary-tint/50"
    >
      <BillerMark name={biller.name} imageUrl={biller.imageUrl} />
      <span className="min-w-0 flex-1">
      <span className="block truncate text-[13px] font-semibold text-foreground">
        {biller.name}
      </span>
        {secondary && (
            <span className="block truncate text-[11px] text-muted-foreground">{secondary}</span>
        )}
    </span>
      <ChevronRight
          size={15}
          className="flex-shrink-0 -translate-x-1 text-transparent transition-all duration-200 group-hover:translate-x-0 group-hover:text-primary"
      />
    </motion.button>
)

const BillerSection: React.FC<{
  categoryPath: string
  billers: Biller[]
  onSelect: (b: Biller) => void
  onSeeMore: (categoryPath: string) => void
}> = ({ categoryPath, billers, onSelect, onSeeMore }) => {
  const meta = CATEGORY_META[categoryPath]
  if (!meta || billers.length === 0) return null
  const Icon = meta.icon
  const visible = billers.slice(0, MAX_PER_CATEGORY)
  const hasMore = billers.length > MAX_PER_CATEGORY

  return (
      <section className="overflow-hidden rounded-2xl border border-card-border bg-card elevation-1">
        <header className="flex items-center justify-between border-b border-card-border/70 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
            <Icon size={15} strokeWidth={2.25} />
          </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{meta.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{meta.hint}</p>
            </div>
          </div>
          {hasMore && (
              <button
                  onClick={() => onSeeMore(categoryPath)}
                  className="inline-flex flex-shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
              >
                All {billers.length}
                <ChevronRight size={13} />
              </button>
          )}
        </header>
        <div className="p-1.5">
          {visible.map((biller) => (
              <BillerRow key={biller.uniqueCode} biller={biller} onSelect={onSelect} />
          ))}
        </div>
      </section>
  )
}

const CategoryFullList: React.FC<{
  categoryPath: string
  billers: Biller[]
  onBack: () => void
  onSelect: (b: Biller) => void
}> = ({ categoryPath, billers, onBack, onSelect }) => {
  const meta = CATEGORY_META[categoryPath]
  return (
      <section className="overflow-hidden rounded-2xl border border-card-border bg-card elevation-1">
        <header className="flex items-center gap-3 border-b border-card-border/70 px-4 py-3.5">
          <button
              onClick={onBack}
              aria-label="Back to categories"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="text-sm font-bold text-foreground">
            {meta?.title ?? categoryPath}
            <span className="ml-2 font-medium text-muted-foreground">
            {billers.length} billers
          </span>
          </p>
        </header>
        <div className="grid gap-1 p-1.5 sm:grid-cols-2">
          {billers.map((biller) => (
              <BillerRow key={biller.uniqueCode} biller={biller} onSelect={onSelect} />
          ))}
        </div>
      </section>
  )
}

const BeneficiariesCard: React.FC<{
  beneficiaries: BillBeneficiary[]
  onSelect: (b: BillBeneficiary) => void
}> = ({ beneficiaries, onSelect }) => {
  if (beneficiaries.length === 0) return null
  return (
      <section className="overflow-hidden rounded-2xl border border-card-border bg-card elevation-1">
        <header className="flex items-center justify-between border-b border-card-border/70 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-tint text-accent">
            <BookmarkCheck size={15} strokeWidth={2.25} />
          </span>
            <p className="text-sm font-bold text-foreground">Beneficiaries</p>
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {beneficiaries.length}
        </span>
        </header>
        <div className="p-1.5">
          {beneficiaries.map((b) => {
            const displayName = b.billerName || b.label || b.billerUniqueCode
            const masked = maskIdentifier(b.accountNumber ?? b.phoneNumber)
            return (
                <motion.button
                    key={b.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(b)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary-tint/50"
                >
                  <BillerMark name={displayName} size="sm" />
                  <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-foreground">
                  {b.label || displayName}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {displayName}
                  {masked && <span className="font-mono"> · {masked}</span>}
                </span>
              </span>
                  <ChevronRight
                      size={15}
                      className="flex-shrink-0 -translate-x-1 text-transparent transition-all duration-200 group-hover:translate-x-0 group-hover:text-primary"
                  />
                </motion.button>
            )
          })}
        </div>
      </section>
  )
}

export function BillsScreen() {
  const { billsActiveTab, setBillsActiveTab, transactions, billerBeneficiaries, refreshTransactionHistory } = useApp()
  const router = useRouter()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="grid items-start gap-6 lg:grid-cols-3">
              {/* Left rail: search + beneficiaries */}
              <div className="space-y-5 lg:sticky lg:top-24 lg:col-span-1">
                <div className="group relative">
                  <Search
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                  />
                  <input
                      type="text"
                      placeholder="Search billers — MTN, DStv, Ikeja…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 w-full rounded-xl border border-card-border bg-card pl-11 pr-4 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                {billerBeneficiaries.length > 0 ? (
                    <BeneficiariesCard beneficiaries={billerBeneficiaries} onSelect={handleSelectBeneficiary} />
                ) : (
                    <div className="rounded-2xl border border-primary/15 bg-primary-tint p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-card elevation-1">
                          <BellRing className="text-primary" size={17} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-0.5 text-sm font-bold text-foreground">Save your billers</h3>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Pay a bill and check &quot;Save as beneficiary&quot; to have it show up here
                            next time
                          </p>
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Right: biller categories */}
              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
                {loading && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-card-border bg-card p-8 text-muted-foreground elevation-1 sm:col-span-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Loading billers…</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-card-border bg-card p-8 text-center elevation-1 sm:col-span-2">
                      <AlertCircle size={22} className="text-destructive" />
                      <p className="text-sm font-semibold text-foreground">Could not load billers</p>
                      <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="rounded-2xl border border-card-border bg-card p-8 text-center elevation-1 sm:col-span-2">
                      <p className="mb-1 text-sm font-semibold text-foreground">No billers found</p>
                      <p className="text-xs text-muted-foreground">
                        {query ? 'Try a different search term' : 'Run the biller catalog sync on the backend first'}
                      </p>
                    </div>
                )}

                {/* Active search — one flat result list beats four filtered cards */}
                {!loading && !error && filtered.length > 0 && query && (
                    <section className="overflow-hidden rounded-2xl border border-card-border bg-card elevation-1 sm:col-span-2">
                      <header className="border-b border-card-border/70 px-4 py-3.5">
                        <p className="text-sm font-bold text-foreground">
                          Results
                          <span className="ml-2 font-medium text-muted-foreground">
                      {filtered.length} for &quot;{searchQuery.trim()}&quot;
                    </span>
                        </p>
                      </header>
                      <div className="grid gap-1 p-1.5 sm:grid-cols-2">
                        {filtered.map((biller) => (
                            <BillerRow
                                key={biller.uniqueCode}
                                biller={biller}
                                onSelect={handleSelectBiller}
                                secondary={CATEGORY_META[biller.categoryPath]?.title ?? biller.categoryPath}
                            />
                        ))}
                      </div>
                    </section>
                )}

                {!loading && !error && filtered.length > 0 && !query && expandedCategory && (
                    <div className="sm:col-span-2">
                      <CategoryFullList
                          categoryPath={expandedCategory}
                          billers={byCategory(expandedCategory)}
                          onBack={() => setExpandedCategory(null)}
                          onSelect={handleSelectBiller}
                      />
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && !query && !expandedCategory && (
                    <>
                      {CATEGORY_ORDER.map((categoryPath) => (
                          <BillerSection
                              key={categoryPath}
                              categoryPath={categoryPath}
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
                                <button
                                    key={tx.id}
                                    onClick={() => router.push(`/receipt/${tx.id}`)}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left"
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
                                  <ChevronRight size={16} className="text-muted-foreground/50 flex-shrink-0" />
                                </button>
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
