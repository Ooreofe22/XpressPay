'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search } from 'lucide-react'
import { listAccounts, AdminApiError } from '@/lib/admin-api'
import type { AdminAccount } from '@/types/admin'
import { formatNaira, formatDateTime } from '@/lib/format'
import { Status } from '@/components/ui/Status'

const statusMeta: Record<AdminAccount['status'], { label: string; tone: 'positive' | 'danger' | 'neutral' }> = {
  ACTIVE: { label: 'Active', tone: 'positive' },
  SUSPENDED: { label: 'Suspended', tone: 'danger' },
  PENDING_VERIFICATION: { label: 'Pending verification', tone: 'neutral' },
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
          className="w-full rounded-[12px] border border-border bg-card py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[12px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-card-border/80 bg-card elevation-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-[13px] font-semibold text-muted-foreground">
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
                      <Status tone="warning" size="sm" icon={<AlertTriangle />} className="ml-2">
                        Flagged
                      </Status>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{formatNaira(a.balance)}</td>
                  <td className="px-4 py-3">
                    <Status tone={statusMeta[a.status].tone} dot>
                      {statusMeta[a.status].label}
                    </Status>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/accounts/${a.id}`}
                      className="text-[13px] font-semibold text-primary hover:underline"
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
