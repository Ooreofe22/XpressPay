'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, Copy, RefreshCw, Search, X } from 'lucide-react'
import { AdminApiError, listTransactions, requeryTransaction } from '@/lib/admin-api'
import { formatDateTime, formatNaira, timeAgo } from '@/lib/format'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CategoryIcon } from '@/components/admin/CategoryIcon'
import type { AdminTransaction, TxStatus } from '@/types/admin'

const statusOptions: { value: TxStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'PAYSTACK_CONFIRMED', label: 'Confirmed' },
  { value: 'FULFILLING', label: 'Fulfilling' },
  { value: 'PENDING_PAYMENT', label: 'Awaiting payment' },
  { value: 'NEEDS_RECONCILIATION', label: 'Needs review' },
  { value: 'FAILED', label: 'Failed' },
]

const selectClass =
  'h-10 rounded-lg border border-border bg-input px-3 text-sm font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<TxStatus | 'all'>('all')
  const [selected, setSelected] = useState<AdminTransaction | null>(null)
  const [requerying, setRequerying] = useState(false)
  const [requeryError, setRequeryError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const lastSelected = useRef<AdminTransaction | null>(null)

  if (selected) lastSelected.current = selected
  const drawerTx = selected ?? lastSelected.current

  useEffect(() => {
    listTransactions()
      .then(setTransactions)
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Failed to load transactions'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (status !== 'all' && t.status !== status) return false
        const needle = q.trim().toLowerCase()
        if (!needle) return true
        return [t.paystackReference, t.userEmail, t.billerUniqueCode]
          .filter((f): f is string => !!f)
          .some((f) => f.toLowerCase().includes(needle))
      }),
    [transactions, q, status],
  )

  async function handleRequery(tx: AdminTransaction) {
    if (!tx.paystackReference) {
      setRequeryError('No Paystack reference on this transaction — it may have been paid from wallet balance.')
      return
    }
    setRequerying(true)
    setRequeryError(null)
    try {
      const { status: next } = await requeryTransaction(tx.paystackReference)
      const nextStatus = next as TxStatus
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === tx.id ? { ...t, status: nextStatus, updatedAt: new Date().toISOString() } : t,
        ),
      )
      setSelected((prev) => (prev && prev.id === tx.id ? { ...prev, status: nextStatus } : prev))
    } catch (e) {
      setRequeryError(e instanceof AdminApiError ? e.message : 'Re-verify failed')
    } finally {
      setRequerying(false)
    }
  }

  function copyReference(ref: string) {
    navigator.clipboard?.writeText(ref)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, email, biller code…"
            className="h-10 w-full rounded-lg border border-border bg-input pr-3 pl-10 text-sm text-foreground transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40 focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TxStatus | 'all')}
          className={selectClass}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div
        className="animate-fade-up overflow-hidden rounded-2xl border border-card-border bg-card elevation-1"
        style={{ animationDelay: '80ms' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Biller</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse border-b border-border last:border-0">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 rounded bg-secondary" />
                    </td>
                  </tr>
                ))}
              {!loading &&
                filtered.map((tx, i) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className="animate-fade-up cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-secondary/60"
                    style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground">
                      {tx.paystackReference ?? tx.id.slice(0, 10)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon category={tx.billerCategoryPath} size="sm" />
                        <span className="font-medium text-foreground">{tx.billerUniqueCode ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{tx.userEmail ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-foreground tabular-nums">
                      {formatNaira(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs whitespace-nowrap text-muted-foreground">
                      {timeAgo(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No transactions match those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        onClick={() => setSelected(null)}
        className={`fixed inset-0 z-40 bg-primary-deep/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          selected ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card elevation-3 transition-transform duration-300 ease-out ${
          selected ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {drawerTx && (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <CategoryIcon category={drawerTx.billerCategoryPath} />
                <div>
                  <p className="text-sm font-bold text-foreground">{drawerTx.billerUniqueCode ?? 'Transaction'}</p>
                  <p className="text-xs text-muted-foreground">{drawerTx.paymentMethod ?? '—'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="balance-gradient mb-5 rounded-2xl p-5 text-white elevation-2">
                <p className="text-xs font-medium text-white/70">Amount</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{formatNaira(drawerTx.amount)}</p>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={drawerTx.status} />
                  <span className="text-xs text-white/70">{drawerTx.paymentMethod ?? '—'}</span>
                </div>
              </div>

              <dl className="flex flex-col gap-3 text-sm">
                {[
                  ['Reference', drawerTx.paystackReference ?? '—'],
                  ['User', drawerTx.userEmail ?? '—'],
                  ['Biller code', drawerTx.billerUniqueCode ?? '—'],
                  ['Category', drawerTx.billerCategoryPath ?? '—'],
                  ['Created', formatDateTime(drawerTx.createdAt)],
                  ['Last update', formatDateTime(drawerTx.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-border pb-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold text-foreground">
                      {label === 'Reference' && drawerTx.paystackReference ? (
                        <button
                          onClick={() => copyReference(drawerTx.paystackReference as string)}
                          className="flex items-center gap-1.5 font-mono text-xs transition-colors hover:text-primary"
                        >
                          {value}
                          {copied ? (
                            <Check size={13} className="text-primary" />
                          ) : (
                            <Copy size={13} className="text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {requeryError && (
                <div className="mt-5 rounded-xl border border-accent/25 bg-accent-tint p-4">
                  <p className="text-xs font-bold text-accent uppercase tracking-wide">Re-verify failed</p>
                  <p className="mt-1.5 text-sm text-foreground">{requeryError}</p>
                </div>
              )}
            </div>

            {(drawerTx.status === 'PENDING_PAYMENT' ||
              drawerTx.status === 'NEEDS_RECONCILIATION' ||
              drawerTx.status === 'FULFILLING') && (
              <div className="border-t border-border px-6 py-4">
                <button
                  onClick={() => handleRequery(drawerTx)}
                  disabled={requerying}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-dark active:translate-y-px disabled:opacity-60"
                >
                  <RefreshCw size={16} className={requerying ? 'animate-spin' : ''} />
                  {requerying ? 'Re-verifying with Paystack…' : 'Re-verify with Paystack'}
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
