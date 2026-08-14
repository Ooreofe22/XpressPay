'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2, Mail, ShieldCheck } from 'lucide-react'

export function SignUpEmailScreen() {
  const { setAuthScreen, requestSignupOtp } = useApp()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleNext = async () => {
    if (!isValidEmail || loading) return
    setLoading(true)
    setError('')
    try {
      await requestSignupOtp(email)
      setAuthScreen('signup-otp')
    } catch (err) {
      // 409 → "An account with this email already exists" (from backend)
      setError(err instanceof Error ? err.message : 'Could not send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const alreadyExists = error.toLowerCase().includes('already exists')

  return (
    <AuthLayout onBack={() => setAuthScreen('splash')} eyebrow="Create account · Step 1 of 2">
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
            Let&apos;s get you started
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            Enter your email address — we&apos;ll send a verification code to confirm it&apos;s
            yours.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-foreground block">
            Email address
          </label>
          <div className="relative">
            <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="signup-email"
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
          <p className="text-xs text-muted-foreground">Your code and receipts will be sent here</p>
        </div>

        <div className="glass rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck size={17} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use one-time codes instead of passwords — your account stays secure even if someone
            knows your email.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}{' '}
            {alreadyExists && (
              <button
                onClick={() => setAuthScreen('login-email')}
                className="underline font-semibold"
              >
                Log in instead
              </button>
            )}
          </motion.div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!isValidEmail || loading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-colors duration-200 hover:bg-primary-dark disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Sending code…' : 'Continue'}
        </motion.button>

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
