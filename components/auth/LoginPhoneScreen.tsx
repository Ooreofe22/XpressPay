'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ChevronDown, Loader2 } from 'lucide-react'

export function LoginPhoneScreen() {
  const { setAuthScreen, requestLoginOtp } = useApp()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidPhone = phone.replace(/\D/g, '').length === 10

  const handleNext = async () => {
    if (!isValidPhone) return
    setLoading(true)
    setError('')
    try {
      await requestLoginOtp(phone)
      setAuthScreen('login-otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout onBack={() => setAuthScreen('splash')} eyebrow="Log in">
      <div className="space-y-8">
        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
            What&apos;s your number?
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            We&apos;ll send a verification code to your registered number to make sure it&apos;s
            yours.
          </p>
        </div>

        {/* Phone Input with country selector */}
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground block">
            Phone number
          </label>
          <div className="flex gap-2 items-stretch">
            <button className="flex items-center gap-1.5 px-3 h-13 bg-background border border-card-border rounded-xl hover:border-primary/40 transition-colors">
              <span className="text-base">🇳🇬</span>
              <span className="text-sm font-semibold text-foreground">+234</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>

            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="801 234 5678"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                if (digits.length <= 10) {
                  setPhone(digits)
                }
              }}
              maxLength={10}
              className="flex-1 min-w-0 h-13 px-4 bg-background border border-card-border rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
            />
          </div>
          <p className="text-xs text-muted-foreground">{phone.length}/10 digits</p>
        </div>

        {error && (
          <div className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!isValidPhone || loading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Sending code…' : 'Continue'}
        </button>

        <p className="text-sm text-muted-foreground text-center">
          New to PayXpress?{' '}
          <button
            onClick={() => setAuthScreen('signup-bvn')}
            className="text-primary font-semibold hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
