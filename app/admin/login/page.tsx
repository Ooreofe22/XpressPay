'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getCurrentUserEmail, isAllowlistedAdminEmail, setAdminKey } from '@/lib/admin-auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const email = getCurrentUserEmail()
    if (!email) {
      setError('Log in to PayXpress first, then come back to /admin.')
      return
    }
    if (!isAllowlistedAdminEmail(email)) {
      setError(`${email} is not on the admin allowlist.`)
      return
    }
    if (!key.trim()) {
      setError('Enter the admin key.')
      return
    }

    setAdminKey(key.trim())
    router.replace('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm animate-fade-up rounded-[22px] border border-card-border/80 bg-card p-6 elevation-1">
        <div className="mb-5 flex items-center gap-3">
          <span className="balance-gradient flex h-10 w-10 items-center justify-center rounded-full text-white elevation-1">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h1 className="text-[15px] font-bold text-foreground">Admin access</h1>
            <p className="text-[13px] text-muted-foreground">Restricted to allowlisted PayXpress staff</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-muted-foreground">Admin key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-[12px] border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              placeholder="X-Admin-Key"
              autoFocus
            />
          </div>

          {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-[12px] bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
