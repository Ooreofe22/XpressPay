'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ShieldCheck, Loader2 } from 'lucide-react'

export function SignUpBVN() {
  const { setAuthScreen, submitBvn } = useApp()
  const [bvn, setBvn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canContinue = bvn.length === 11

  const handleNext = async () => {
    if (!canContinue) return
    setLoading(true)
    setError('')
    try {
      await submitBvn(bvn)
      // Account is now active and the wallet is funded server-side. Hand off
      // to the exact same screen/component the login flow uses to finish —
      // same design, same code, no separate signup-specific finish screen.
      setAuthScreen('login-welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify BVN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout onBack={() => setAuthScreen('signup-otp')} eyebrow="Create account · Step 2 of 2">
      <div className="space-y-8">
        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
            Confirm your BVN
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            One last step: we check your BVN format to finish setting up your account.
          </p>
        </div>

        {/* BVN Input */}
        <div className="space-y-2">
          <label htmlFor="bvn" className="text-sm font-medium text-foreground block">
            BVN (11 digits)
          </label>
          <input
            id="bvn"
            type="text"
            inputMode="numeric"
            placeholder="Enter your BVN"
            value={bvn}
            onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
            maxLength={11}
            className="w-full h-13 px-4 bg-background border border-card-border rounded-xl text-center text-lg font-semibold tracking-[0.3em] text-foreground placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:font-normal placeholder:text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
          />
          <p className="text-xs text-muted-foreground text-center">{bvn.length}/11 digits</p>
        </div>

        {/* Helper card */}
        <div className="bg-secondary rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground text-center">
            {'Dial *565*0# to get your BVN'}
          </p>
          <button className="flex items-center justify-center gap-1.5 text-sm text-primary font-medium hover:underline w-full">
            <ShieldCheck size={15} />
            Why we ask for BVN?
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!canContinue || loading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Continue'}
        </button>
      </div>
    </AuthLayout>
  )
}
