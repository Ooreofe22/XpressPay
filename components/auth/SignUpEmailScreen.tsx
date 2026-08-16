'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Mail, Loader2 } from 'lucide-react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignUpEmailScreen() {
  const { setAuthScreen, requestSignupOtp } = useApp()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = EMAIL_PATTERN.test(email.trim())

  const handleNext = async () => {
    if (!isValidEmail) return
    setLoading(true)
    setError('')
    try {
      await requestSignupOtp(email)
      setAuthScreen('signup-otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout onBack={() => setAuthScreen('splash')} eyebrow="Create account · Step 1 of 2">
      <div className="space-y-8">
        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
            What&apos;s your email?
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            We&apos;ll send a verification code to confirm it&apos;s yours before setting up your account.
          </p>
        </div>

        {/* Email input */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground block">
            Email address
          </label>
          <div className="flex gap-2 items-stretch">
            <div className="flex items-center justify-center w-13 h-13 bg-background border border-card-border rounded-xl flex-shrink-0">
              <Mail size={18} className="text-muted-foreground" />
            </div>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              className="flex-1 min-w-0 h-13 px-4 bg-background border border-card-border rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!isValidEmail || loading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Sending code…' : 'Continue'}
        </button>

        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <button
            onClick={() => setAuthScreen('login-email')}
            className="text-primary font-semibold hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
