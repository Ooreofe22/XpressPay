'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import {
  Search,
  ReceiptText,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Bookmark,
  X,
} from 'lucide-react'
import type { Biller, BillBeneficiary, Transaction } from '@/types'
import { fetchAllBillers } from '@/lib/api'
import { BillPaymentFlow } from '@/components/bills/BillPaymentFlow'
import { useApp } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Status } from '@/components/ui/Status'
import { txStatus } from '@/lib/txStatus'
import {
  Button,
  EmptyState,
  IconTile,
  ListRow,
  PageHeader,
  Panel,
  SectionTitle,
  Skeleton,
  type TileTone,
} from '@/components/app/kit'

const CATEGORY_META: Record<string, { title: string; hint: string; icon: typeof Zap; tone: TileTone }> = {
  airtime: { title: 'Airtime', hint: 'Every network', icon: Smartphone, tone: 'green' },
  data: { title: 'Data', hint: 'Internet bundles', icon: Wifi, tone: 'orange' },
  electricity: { title: 'Electricity', hint: 'Prepaid and postpaid', icon: Zap, tone: 'orange' },
  cable: { title: 'Cable TV', hint: 'DStv, GOtv and more', icon: Tv, tone: 'green' },
}
const CATEGORY_ORDER = ['airtime', 'data', 'electricity', 'cable'] as const
const MAX_PER_CATEGORY = 5

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

/** Real logo when the catalogue has one, otherwise a coloured monogram. */
function BillerMark({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const [failed, setFailed] = useState(false)
  if (imageUrl && !failed) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white ring-1 ring-inset ring-card-border">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      </span>
    )
  }
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[12px] font-semibold text-white"
      style={{ background: providerColor(name) }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  )
}

function Chevron() {
  return <span className="text-[18px] leading-none text-muted-foreground/70">›</span>
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  const reduce = useReducedMotion()
  return (
    <div role="tablist" className="inline-grid auto-cols-fr grid-flow-col rounded-[12px] bg-secondary p-1">
      {options.map((o) => {
        const selected = o.id === value
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.id)}
            className={`relative h-9 rounded-[9px] px-5 text-[14px] font-medium transition-colors ${
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {selected && (
              <motion.span
                layoutId="bills-seg"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-[9px] bg-card elevation-1"
                aria-hidden
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function BillsScreen() {
  const { billsActiveTab, setBillsActiveTab, transactions, billerBeneficiaries, refreshTransactionHistory } =
    useApp()
  const router = useRouter()

  const [billers, setBillers] = useState<Biller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  const [prefillAccountNumber, setPrefillAccountNumber] = useState('')
  const [prefillAccountType, setPrefillAccountType] = useState<'prepaid' | 'postpaid' | undefined>(undefined)
  const [category, setCategory] = useState<string | null>(null)
  const [refreshingHistory, setRefreshingHistory] = useState(false)

  useEffect(() => {
    fetchAllBillers()
      .then(setBillers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load billers'))
      .finally(() => setLoading(false))
  }, [])

  // Refetch history whenever the History tab opens, so payments made earlier
  // in the session (or completed via the gateway redirect) show up.
  useEffect(() => {
    if (billsActiveTab === 'transactions') refreshTransactionHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billsActiveTab])

  const query = searchQuery.trim().toLowerCase()
  const filtered = query ? billers.filter((b) => b.name.toLowerCase().includes(query)) : billers
  const byCategory = (path: string) => filtered.filter((b) => b.categoryPath === path)

  const handleSelectBiller = (biller: Biller) => {
    setPrefillAccountNumber('')
    setPrefillAccountType(undefined)
    setSelectedBiller(biller)
  }

  const handleSelectBeneficiary = (beneficiary: BillBeneficiary) => {
    const biller = billers.find((b) => b.uniqueCode === beneficiary.billerUniqueCode)
    if (!biller) return
    setPrefillAccountNumber(beneficiary.accountNumber ?? '')
    setPrefillAccountType(beneficiary.accountType as 'prepaid' | 'postpaid' | undefined)
    setSelectedBiller(biller)
  }

  const handleRefreshHistory = async () => {
    setRefreshingHistory(true)
    await refreshTransactionHistory()
    setRefreshingHistory(false)
  }

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = dateGroup(String(tx.timestamp))
    ;(acc[key] ??= []).push(tx)
    return acc
  }, {})

  const billerRow = (b: Biller, detail?: string) => (
    <ListRow
      key={b.uniqueCode}
      onClick={() => handleSelectBiller(b)}
      leading={<BillerMark name={b.name} imageUrl={b.imageUrl} />}
      title={b.name}
      detail={detail}
      trailing={<Chevron />}
    />
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Pay a bill"
        subtitle="Airtime, data, electricity and TV, paid from your balance."
        actions={
          <Segmented
            value={billsActiveTab}
            onChange={setBillsActiveTab}
            options={[
              { id: 'bills', label: 'Bills' },
              { id: 'transactions', label: 'History' },
            ]}
          />
        }
      />

      {billsActiveTab === 'bills' ? (
        <>
          {/* Categories: the main way in */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {CATEGORY_ORDER.map((path) => {
              const meta = CATEGORY_META[path]
              const Icon = meta.icon
              const count = billers.filter((b) => b.categoryPath === path).length
              const active = category === path
              return (
                <button
                  key={path}
                  onClick={() => {
                    setCategory(active ? null : path)
                    setSearchQuery('')
                  }}
                  aria-pressed={active}
                  className={`group flex flex-col items-start gap-6 rounded-[22px] border bg-card p-5 text-left transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.98] ${
                    active
                      ? 'border-primary ring-1 ring-primary elevation-2'
                      : 'border-card-border/80 elevation-1 hover:border-muted-foreground/30'
                  }`}
                >
                  <IconTile tone={active ? 'solid' : meta.tone} size={44} icon={<Icon size={20} strokeWidth={2} />} />
                  <span>
                    <span className="block text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                      {meta.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {loading ? meta.hint : `${count} ${count === 1 ? 'biller' : 'billers'}`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="group relative">
                <Search
                  size={18}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                />
                <input
                  type="search"
                  placeholder="Search MTN, DStv, Ikeja Electric"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCategory(null)
                  }}
                  className="h-14 w-full rounded-[16px] border border-card-border bg-card pl-12 pr-12 text-[16px] text-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {loading && (
                <Panel className="overflow-hidden py-2" as="div">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
                      <Skeleton className="h-10 w-10 rounded-[12px]" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </Panel>
              )}

              {!loading && error && (
                <Panel>
                  <EmptyState
                    icon={<AlertCircle size={22} className="text-destructive" />}
                    title="Couldn't load billers"
                    body={error}
                    action={
                      <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                        Try again
                      </Button>
                    }
                  />
                </Panel>
              )}

              {!loading && !error && filtered.length === 0 && (
                <Panel>
                  <EmptyState
                    icon={<Search size={22} />}
                    title={query ? `No match for "${searchQuery.trim()}"` : 'No billers yet'}
                    body={query ? 'Check the spelling or try the provider name.' : 'Run the biller catalogue sync on the backend first.'}
                  />
                </Panel>
              )}

              {!loading && !error && filtered.length > 0 && query && (
                <section>
                  <SectionTitle title={`${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`} />
                  <Panel className="overflow-hidden">
                    <div className="divide-y divide-card-border/70">
                      {filtered.map((b) => billerRow(b, CATEGORY_META[b.categoryPath]?.title ?? b.categoryPath))}
                    </div>
                  </Panel>
                </section>
              )}

              {!loading && !error && filtered.length > 0 && !query && category && (
                <section>
                  <SectionTitle
                    title={CATEGORY_META[category]?.title ?? category}
                    action={{ label: 'All categories', onClick: () => setCategory(null) }}
                  />
                  <Panel className="overflow-hidden">
                    <div className="divide-y divide-card-border/70">{byCategory(category).map((b) => billerRow(b))}</div>
                  </Panel>
                </section>
              )}

              {!loading && !error && filtered.length > 0 && !query && !category && (
                <div className="space-y-6">
                  {CATEGORY_ORDER.map((path) => {
                    const list = byCategory(path)
                    if (!list.length) return null
                    return (
                      <section key={path}>
                        <SectionTitle
                          title={CATEGORY_META[path].title}
                          action={
                            list.length > MAX_PER_CATEGORY
                              ? { label: `All ${list.length}`, onClick: () => setCategory(path) }
                              : undefined
                          }
                        />
                        <Panel className="overflow-hidden">
                          <div className="divide-y divide-card-border/70">
                            {list.slice(0, MAX_PER_CATEGORY).map((b) => billerRow(b))}
                          </div>
                        </Panel>
                      </section>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Saved billers */}
            <aside className="lg:sticky lg:top-24">
              <SectionTitle title="Saved" />
              {billerBeneficiaries.length > 0 ? (
                <Panel className="overflow-hidden">
                  <div className="divide-y divide-card-border/70">
                    {billerBeneficiaries.map((b) => {
                      const name = b.billerName || b.label || b.billerUniqueCode
                      const masked = maskIdentifier(b.accountNumber ?? b.phoneNumber)
                      return (
                        <ListRow
                          key={b.id}
                          onClick={() => handleSelectBeneficiary(b)}
                          leading={<BillerMark name={name} />}
                          title={b.label || name}
                          detail={
                            <>
                              {name}
                              {masked && <span className="font-mono"> · {masked}</span>}
                            </>
                          }
                          trailing={<Chevron />}
                        />
                      )
                    })}
                  </div>
                </Panel>
              ) : (
                <div className="rounded-[22px] bg-accent-tint p-5">
                  <IconTile tone="orange" size={40} icon={<Bookmark size={18} strokeWidth={2} />} className="bg-card" />
                  <p className="mt-4 text-[15px] font-semibold text-foreground">Pay again in one tap</p>
                  <p className="mt-1 text-[14px] leading-[1.45] text-muted-foreground">
                    Tick &quot;Save as beneficiary&quot; when you pay a bill and it will wait for you here.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </>
      ) : (
        <section className="max-w-3xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">Payment history</h2>
            <Button
              variant="ghost"
              size="sm"
              loading={refreshingHistory}
              icon={<RefreshCw />}
              onClick={handleRefreshHistory}
            >
              {refreshingHistory ? 'Refreshing' : 'Refresh'}
            </Button>
          </div>

          {transactions.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<ReceiptText size={22} strokeWidth={1.75} />}
                title="No bill payments yet"
                body="Every bill you pay shows up here with its receipt."
                action={
                  <Button size="sm" onClick={() => setBillsActiveTab('bills')}>
                    Pay a bill
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
                      const s = txStatus(tx.status)
                      return (
                        <ListRow
                          key={tx.id}
                          onClick={() => router.push(`/receipt/${tx.id}`)}
                          leading={<BillerMark name={tx.billerName || tx.description} />}
                          title={tx.description}
                          detail={<span className="font-mono">{tx.reference}</span>}
                          trailing={
                            <span className="flex items-center gap-3">
                              <span className="flex flex-col items-end gap-1">
                                <span className="text-[15px] font-semibold text-foreground tabular-nums">
                                  {formatCurrency(tx.amount)}
                                </span>
                                <Status tone={s.tone} size="sm" dot>
                                  {s.label}
                                </Status>
                              </span>
                              <Chevron />
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
