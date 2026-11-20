'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react'
import { AdminApiError, listReconciliationTransactions, requeryTransaction } from '@/lib/admin-api'
import { formatDateTime, formatNaira, timeAgo } from '@/lib/format'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { CategoryIcon } from '@/components/admin/CategoryIcon'
import type { AdminTransaction, TxStatus } from '@/types/admin'

export default function ReconciliationPage() {
  const [queue, setQueue] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resolved, setResolved] = useState<Record<string, TxStatus>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})

  useEffect(() => {
    listReconciliationTransactions()
      .then(setQueue)
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Failed to load queue'))
      .finally(() => setLoading(false))
  }, [])

  async function reverify(tx: AdminTransaction) {
    if (!tx.paystackReference) {
      setRowError((r) => ({ ...r, [tx.id]: 'No Paystack reference to re-verify against.' }))
      return
    }
    setBusyId(tx.id)
    setRowError((r) => ({ ...r, [tx.id]: '' }))
    try {
      const { status } = await requeryTransaction(tx.paystackReference)
      const nextStatus = status as TxStatus
      if (nextStatus === 'FULFILLED' || nextStatus === 'FAILED') {
        setResolved((r) => ({ ...r, [tx.id]: nextStatus }))
        setTimeout(() => setQueue((q) => q.filter((x) => x.id !== tx.id)), 900)
      } else {
        setQueue((q) => q.map((x) => (x.id === tx.id ? { ...x, status: nextStatus } : x)))
      }
    } catch (e) {
      setRowError((r) => ({
        ...r,
        [tx.id]: e instanceof AdminApiError ? e.message : 'Re-verify failed',
      }))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex animate-pulse flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-[22px] border border-card-border/80 bg-card" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-[12px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
        <AlertTriangle size={16} /> {error}
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="animate-fade-up flex flex-col items-center justify-center rounded-[22px] border border-card-border/80 bg-card px-6 py-20 text-center elevation-1">
        <span className="pulse-soft flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint text-primary">
          <ShieldCheck size={28} strokeWidth={2} />
        </span>
        <h2 className="mt-5 text-lg font-bold text-foreground">All clear</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          No payments are stuck between Paystack and the biller right now. New mismatches will
          show up here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="animate-fade-up text-sm text-muted-foreground">
        These payments carry a NEEDS_RECONCILIATION status: the Paystack charge and biller
        fulfilment disagree. Re-verifying safely reruns the confirmation flow and does nothing if
        the webhook already settled it.
      </p>

      {queue.map((tx, i) => {
        const doneStatus = resolved[tx.id]
        const isBusy = busyId === tx.id
        return (
          <div
            key={tx.id}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`animate-fade-up rounded-[22px] border bg-card p-5 elevation-1 transition-all duration-500 ${
              doneStatus ? 'translate-x-3 border-primary/40 opacity-0' : 'border-l-4 border-card-border border-l-warning'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <CategoryIcon category={tx.billerCategoryPath} />
                <div>
                  <p className="text-sm font-bold text-foreground">{tx.billerUniqueCode ?? 'Transaction'}</p>
                  <p className="font-mono text-[13px] text-muted-foreground">
                    {tx.paystackReference ?? tx.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {formatNaira(tx.amount)}
                </span>
                {doneStatus ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <CheckCircle2 size={16} />
                    Resolved · {doneStatus === 'FULFILLED' ? 'fulfilled' : 'failed'}
                  </span>
                ) : (
                  <StatusBadge status={tx.status} />
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[13px] text-muted-foreground">User</p>
                <p className="font-semibold text-foreground">{tx.userEmail ?? '—'}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Payment method</p>
                <p className="font-semibold text-foreground">{tx.paymentMethod ?? '—'}</p>
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Initiated</p>
                <p className="font-semibold text-foreground">
                  {formatDateTime(tx.createdAt)} · {timeAgo(tx.createdAt)}
                </p>
              </div>
            </div>

            {rowError[tx.id] && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[13px] font-medium text-destructive">
                {rowError[tx.id]}
              </p>
            )}

            {!doneStatus && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => reverify(tx)}
                  disabled={isBusy}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-dark active:translate-y-px disabled:opacity-60"
                >
                  <RefreshCw size={15} className={isBusy ? 'animate-spin' : ''} />
                  {isBusy ? 'Re-verifying…' : 'Re-verify with Paystack'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
