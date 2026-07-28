'use client'

import React, { useEffect, useState } from 'react'
import { Search, BellRing, ReceiptText, Loader2, AlertCircle } from 'lucide-react'
import type { Biller } from '@/types'
import { fetchAllBillers } from '@/lib/api'
import { BillPaymentFlow } from '@/components/bills/BillPaymentFlow'

const CATEGORY_META: Record<string, { title: string }> = {
  airtime: { title: 'Airtime' },
  data: { title: 'Data' },
  electricity: { title: 'Electricity' },
  cable: { title: 'Cable TV' },
}

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
  title: string
  billers: Biller[]
  onSelect: (b: Biller) => void
}> = ({ title, billers, onSelect }) => {
  if (billers.length === 0) return null
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
      <div className="flex items-center justify-between mb-5">
        <p className="font-bold text-foreground text-sm">{title}</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {billers.map((biller) => (
          <BillerCircleItem key={biller.uniqueCode} biller={biller} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

export function BillsScreen() {
  const [activeTab, setActiveTab] = useState<'bills' | 'transactions'>('bills')
  const [billers, setBillers] = useState<Biller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)

  useEffect(() => {
    fetchAllBillers()
      .then(setBillers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load billers'))
      .finally(() => setLoading(false))
  }, [])

  const query = searchQuery.trim().toLowerCase()
  const filtered = query ? billers.filter((b) => b.name.toLowerCase().includes(query)) : billers

  const byCategory = (categoryPath: string) => filtered.filter((b) => b.categoryPath === categoryPath)

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
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-primary elevation-1'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bills' ? (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* Left rail: search + promo */}
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

            <div className="p-5 bg-primary-tint border border-primary/15 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0 elevation-1">
                  <BellRing className="text-primary" size={17} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground mb-0.5">Update on Bills</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    You can now add beneficiaries for future bill payments
                  </p>
                  <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-dark transition-colors active:scale-[0.98]">
                    Add Beneficiaries
                  </button>
                </div>
              </div>
            </div>
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

            {!loading && !error && filtered.length > 0 && (
              <>
                <BillerSection
                  title={CATEGORY_META.airtime.title}
                  billers={byCategory('airtime')}
                  onSelect={setSelectedBiller}
                />
                <BillerSection
                  title={CATEGORY_META.data.title}
                  billers={byCategory('data')}
                  onSelect={setSelectedBiller}
                />
                <BillerSection
                  title={CATEGORY_META.electricity.title}
                  billers={byCategory('electricity')}
                  onSelect={setSelectedBiller}
                />
                <BillerSection
                  title={CATEGORY_META.cable.title}
                  billers={byCategory('cable')}
                  onSelect={setSelectedBiller}
                />
              </>
            )}
          </div>
        </div>
      ) : (
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
      )}

      {selectedBiller && (
        <BillPaymentFlow biller={selectedBiller} onClose={() => setSelectedBiller(null)} />
      )}
    </div>
  )
}
