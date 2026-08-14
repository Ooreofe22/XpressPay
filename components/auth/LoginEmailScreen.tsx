'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2, Mail } from 'lucide-react'

export function LoginEmailScreen() {
  const { setAuthScreen, requestLoginOtp } = useApp()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleNext = async () => {
    if (!isValidEmail) return
    setLoading(true)
    setError('')
    try {
      await requestLoginOtp(email)
      setAuthScreen('login-otp')
    } catch (err) {
      // 404 → "No account found for this email" (message comes from backend)
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
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              Enter your email address and we&apos;ll send you a verification code.
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground block">
              Email address
            </label>
            <div className="relative">
              <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  className="w-full h-13 pl-11 pr-4 bg-background border border-card-border rounded-xl text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
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
            New to PayXpress?{' '}
            <button
                onClick={() => setAuthScreen('signup-email')}
                className="text-primary font-semibold hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </AuthLayout>
  )
}
