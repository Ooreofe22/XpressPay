'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { AdminApiError, listBillers, setBillerActive, syncBillers } from '@/lib/admin-api'
import { timeAgo } from '@/lib/format'
import { CategoryIcon, categoryLabel } from '@/components/admin/CategoryIcon'
import type { AdminBiller } from '@/types/admin'

export default function BillersPage() {
  const [billers, setBillers] = useState<AdminBiller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncedMsg, setSyncedMsg] = useState<string | null>(null)

  useEffect(() => {
    listBillers()
      .then(setBillers)
      .catch((e) => setError(e instanceof AdminApiError ? e.message : 'Failed to load billers'))
      .finally(() => setLoading(false))
  }, [])

  const groups = useMemo(() => {
    const byCategory = new Map<string, AdminBiller[]>()
    for (const b of billers) {
      const key = b.categoryPath || 'uncategorized'
      byCategory.set(key, [...(byCategory.get(key) ?? []), b])
    }
    return Array.from(byCategory.entries())
  }, [billers])

  async function handleSync() {
    setSyncing(true)
    setSyncedMsg(null)
    setError(null)
    try {
      await syncBillers()
      const fresh = await listBillers()
      setBillers(fresh)
      setSyncedMsg(`Catalog synced — ${fresh.length} billers`)
      setTimeout(() => setSyncedMsg(null), 4000)
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function toggle(biller: AdminBiller) {
    const next = !biller.active
    setBillers((prev) => prev.map((b) => (b.id === biller.id ? { ...b, active: next } : b)))
    try {
      await setBillerActive(biller.id, next)
    } catch (e) {
      // Roll back on failure
      setBillers((prev) => prev.map((b) => (b.id === biller.id ? { ...b, active: !next } : b)))
      setError(e instanceof AdminApiError ? e.message : 'Failed to update biller')
    }
  }

  if (loading) {
    return (
      <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-card-border bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Products come from the XpressPay catalog. Sync pulls the latest set; the switch controls
          whether a biller is offered in the app.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-dark active:translate-y-px disabled:opacity-60"
        >
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing catalog…' : 'Sync catalog'}
        </button>
      </div>

      {error && (
        <div className="animate-fade-up flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {syncedMsg && (
        <div className="animate-fade-up flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary-tint px-4 py-3 text-sm font-semibold text-primary">
          <CheckCircle2 size={16} />
          {syncedMsg}
        </div>
      )}

      {groups.map(([categoryPath, group], ci) => (
        <section key={categoryPath}>
          <h2
            className="animate-fade-up mb-3 text-sm font-bold text-foreground"
            style={{ animationDelay: `${ci * 60}ms` }}
          >
            {categoryLabel(categoryPath)}
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              {group.length} product{group.length === 1 ? '' : 's'}
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.map((biller, i) => (
              <div
                key={biller.id}
                style={{ animationDelay: `${ci * 60 + i * 40}ms` }}
                className={`animate-fade-up rounded-2xl border border-card-border bg-card p-4 elevation-1 transition-all duration-300 hover:elevation-2 ${
                  biller.active ? '' : 'opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={biller.categoryPath} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{biller.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{biller.uniqueCode}</p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={biller.active}
                    aria-label={`Toggle ${biller.name}`}
                    onClick={() => toggle(biller)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                      biller.active ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white elevation-1 transition-transform duration-200 ${
                        biller.active ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {biller.lastSyncedAt ? `Last synced ${timeAgo(biller.lastSyncedAt)}` : 'Never synced'} ·{' '}
                  <span className={biller.active ? 'text-primary' : ''}>
                    {biller.active ? 'live in app' : 'hidden from app'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">No billers synced yet — run a catalog sync.</p>
      )}
    </div>
  )
}
