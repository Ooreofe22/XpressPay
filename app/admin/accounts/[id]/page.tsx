'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Trash2 } from 'lucide-react'
import {
  AdminApiError,
  deactivateAccount,
  deleteAccount,
  getAccount,
  reactivateAccount,
} from '@/lib/admin-api'
import type { AdminAccount, AdminTransaction } from '@/types/admin'
import { formatDateTime, formatNaira } from '@/lib/format'
import { StatusBadge } from '@/components/admin/StatusBadge'
import Link from 'next/link'
import { Status } from '@/components/ui/Status'

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [account, setAccount] = useState<AdminAccount | null>(null)
  const [flagged, setFlagged] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function load() {
    setLoading(true)
    getAccount(id)
      .then(({ account, flaggedTransactions }) => {
        setAccount(account)
        setFlagged(flaggedTransactions)
      })
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Failed to load account'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleDeactivate() {
    setBusy(true)
    try {
      await deactivateAccount(id)
      load()
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Failed to deactivate')
    } finally {
      setBusy(false)
    }
  }

  async function handleReactivate() {
    setBusy(true)
    try {
      await reactivateAccount(id)
      load()
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Failed to reactivate')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete ${account?.email}? This cannot be undone.`)) return
    setBusy(true)
    try {
      await deleteAccount(id)
      router.replace('/admin/accounts')
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Failed to delete')
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading account…</p>

  if (!account) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-destructive">{error ?? 'Account not found'}</p>
        <Link href="/admin/accounts" className="text-sm font-semibold text-primary hover:underline">
          Back to accounts
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/admin/accounts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} /> Accounts
      </Link>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="animate-fade-up rounded-2xl border border-card-border bg-card p-6 elevation-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">{account.email}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Created {formatDateTime(account.createdAt)}</p>
          </div>
          {account.flagged && (
            <Status tone="warning" icon={<AlertTriangle />}>
              Flagged: transaction over ₦20,000
            </Status>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{formatNaira(account.balance)}</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-1 text-xl font-bold text-foreground">{account.status}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {account.status === 'SUSPENDED' ? (
            <button
              onClick={handleReactivate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <CheckCircle2 size={15} /> Reactivate
            </button>
          ) : (
            <button
              onClick={handleDeactivate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              <Ban size={15} /> Deactivate
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-50"
          >
            <Trash2 size={15} /> Delete account
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-foreground">Flagged transactions</h3>
        {flagged.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions over ₦20,000 on this account.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-card-border bg-card elevation-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3">Biller</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{t.billerUniqueCode ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-foreground">
                      {formatNaira(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
