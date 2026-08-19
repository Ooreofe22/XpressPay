'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search } from 'lucide-react'
import { listAccounts, AdminApiError } from '@/lib/admin-api'
import type { AdminAccount } from '@/types/admin'
import { formatNaira, formatDateTime } from '@/lib/format'

const statusStyle: Record<AdminAccount['status'], string> = {
  ACTIVE: 'bg-primary-tint text-primary',
  SUSPENDED: 'bg-destructive/10 text-destructive',
  PENDING_VERIFICATION: 'bg-secondary text-muted-foreground',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    listAccounts()
      .then(setAccounts)
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Failed to load accounts'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = accounts.filter((a) => a.email.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email"
          className="w-full rounded-xl border border-border bg-card py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-card-border bg-card elevation-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs font-semibold text-muted-foreground">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/admin/accounts/${a.id}`} className="hover:underline">
                      {a.email}
                    </Link>
                    {a.flagged && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-bold text-accent">
                        <AlertTriangle size={11} /> Flagged
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{formatNaira(a.balance)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/accounts/${a.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No accounts match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
