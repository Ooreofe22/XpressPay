'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  Users,
  Wallet,
} from 'lucide-react'
import { AdminApiError, getStats, listTransactions } from '@/lib/admin-api'
import { formatNaira, timeAgo } from '@/lib/format'
import { StatCard } from '@/components/admin/StatCard'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CategoryIcon } from '@/components/admin/CategoryIcon'
import type { AdminStats, AdminTransaction } from '@/types/admin'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recent, setRecent] = useState<AdminTransaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Failed to load stats'))
    listTransactions()
      .then((t) => setRecent(t.slice(0, 6)))
      .catch(() => {})
  }, [])

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
        <AlertTriangle size={16} /> {error}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-card-border bg-card" />
        ))}
      </div>
    )
  }

  const successRate =
    stats.totalTransactions > 0 ? (stats.fulfilledCount / stats.totalTransactions) * 100 : 0

  return (
    <div className="flex flex-col gap-6">
      {stats.reconciliationCount > 0 && (
        <Link
          href="/admin/reconciliation"
          className="animate-fade-up group flex items-center gap-3 rounded-2xl border border-warning/25 bg-warning-tint px-4 py-3.5 transition-all duration-200 hover:border-warning/50 elevation-1"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-tint text-warning">
            <AlertTriangle size={17} strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {stats.reconciliationCount} payment{stats.reconciliationCount === 1 ? '' : 's'} need
              reconciliation
            </p>
            <p className="text-xs text-muted-foreground">
              Paystack charge and biller fulfilment disagree. Review before refunding anyone.
            </p>
          </div>
          <ArrowRight
            size={17}
            className="shrink-0 text-warning transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fulfilled volume"
          value={stats.totalVolume}
          icon={Wallet}
          format={(n) => formatNaira(Math.round(n))}
          hint={`${stats.totalTransactions.toLocaleString()} transactions total`}
        />
        <StatCard
          label="Success rate"
          value={successRate}
          icon={Activity}
          format={(n) => `${n.toFixed(1)}%`}
          hint="Fulfilled ÷ total transactions"
          delay={60}
        />
        <StatCard
          label="Accounts"
          value={stats.totalUsers}
          icon={Users}
          hint={`${stats.activeBillerCount} billers active`}
          delay={120}
        />
        <StatCard
          label="Needs review"
          value={stats.reconciliationCount + stats.failedCount}
          icon={AlertTriangle}
          tone="alert"
          hint={`${stats.reconciliationCount} reconciliation · ${stats.failedCount} failed`}
          delay={180}
        />
      </div>

      <div
        className="animate-fade-up rounded-2xl border border-card-border bg-card p-5 elevation-1"
        style={{ animationDelay: '240ms' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Recent transactions</h2>
          <Link
            href="/admin/transactions"
            className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
          >
            View all
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </Link>
        </div>
        <div className="flex flex-col">
          {recent.map((tx, i) => (
            <div
              key={tx.id}
              className="animate-fade-up flex items-center gap-3 border-b border-border py-2.5 last:border-0"
              style={{ animationDelay: `${280 + i * 50}ms` }}
            >
              <CategoryIcon category={tx.billerCategoryPath} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {tx.billerUniqueCode ?? 'Unknown biller'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {tx.userEmail ?? 'unknown user'} · {timeAgo(tx.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[13px] font-bold text-foreground tabular-nums">
                  {formatNaira(tx.amount)}
                </span>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No transactions yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/billers"
          className="animate-fade-up group flex items-center gap-4 rounded-2xl border border-card-border bg-card p-5 elevation-1 transition-all duration-200 hover:elevation-2"
          style={{ animationDelay: '380ms' }}
        >
          <span className="balance-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
            <Layers size={19} strokeWidth={2.25} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Sync biller catalog</p>
            <p className="text-xs text-muted-foreground">Pull the latest products from XpressPay</p>
          </div>
          <ArrowRight
            size={17}
            className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
          />
        </Link>
        <Link
          href="/admin/reconciliation"
          className="animate-fade-up group flex items-center gap-4 rounded-2xl border border-card-border bg-card p-5 elevation-1 transition-all duration-200 hover:elevation-2"
          style={{ animationDelay: '440ms' }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning-tint text-warning">
            <CheckCircle2 size={19} strokeWidth={2.25} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Review reconciliation queue</p>
            <p className="text-xs text-muted-foreground">Re-verify stuck payments against Paystack</p>
          </div>
          <ArrowRight
            size={17}
            className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-warning"
          />
        </Link>
      </div>
    </div>
  )
}
