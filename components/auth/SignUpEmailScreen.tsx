'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2, Mail, Fingerprint, ShieldCheck, Check } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

// NOTE: signup collects email + BVN together on this one screen — the
// backend's /auth/signup/request-otp and /auth/signup/verify-otp both
// require email+bvn in the same call, and the account isn't created until
// verify-otp succeeds. There is no separate "add BVN later" step/endpoint,
// so this must stay a single combined screen (step 1 of 2 — OTP is step 2).
export function SignUpEmailScreen() {
  const { setAuthScreen, requestSignupOtp } = useApp()
  const reduce = useReducedMotion()
  const [email, setEmail] = useState('')
  const [bvn, setBvn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const isValidBvn = bvn.length === 11
  const canContinue = isValidEmail && isValidBvn

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? 0.2 : 0.55,
      delay: reduce ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  })

  const handleNext = async () => {
    if (!canContinue || loading) return
    setLoading(true)
    setError('')
    try {
      await requestSignupOtp(email, bvn)
      setAuthScreen('signup-otp')
    } catch (err) {
      // 409 → "An account with this email already exists" (from backend)
      setError(err instanceof Error ? err.message : 'Could not send code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      onBack={() => setAuthScreen('splash')}
      eyebrow="Create account"
      step={1}
      totalSteps={2}
    >
      <div className="space-y-8">
        {/* Heading */}
        <motion.div {...rise(0.05)} className="space-y-3">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Let&apos;s get you started
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Enter your email and BVN and we&apos;ll send a verification code to confirm it&apos;s
            you.
          </p>
        </motion.div>

        {/* Email input */}
        <motion.div {...rise(0.12)} className="space-y-2">
          <label htmlFor="signup-email" className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <div className="group relative">
            <Mail
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
            />
            <input
              id="signup-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              className="h-13 w-full rounded-xl border border-card-border bg-card pl-11 pr-4 text-base font-medium text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Your code and receipts will be sent here</p>
        </motion.div>

        {/* BVN input */}
        <motion.div {...rise(0.18)} className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="signup-bvn" className="block text-sm font-medium text-foreground">
              Bank Verification Number
            </label>
            <span
              className={`text-xs font-medium tabular-nums transition-colors ${
                isValidBvn ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {bvn.length}/11
            </span>
          </div>
          <div className="group relative">
            <Fingerprint
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
            />
            <input
              id="signup-bvn"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="22212345678"
              value={bvn}
              onChange={(e) => {
                setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))
                if (error) setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              className={`h-13 w-full rounded-xl border bg-card pl-11 pr-12 font-mono text-base font-semibold tracking-[0.18em] text-foreground transition-all duration-200 placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 ${
                isValidBvn
                  ? 'border-primary focus:border-primary focus:ring-primary/10'
                  : 'border-card-border focus:border-primary focus:ring-primary/10'
              }`}
            />
            <AnimatePresence>
              {isValidBvn && (
                <motion.span
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary"
                >
                  <Check size={13} strokeWidth={3} className="text-white" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-xs text-muted-foreground">
            Dial <span className="font-semibold text-foreground">*565*0#</span> on your registered
            line to check your BVN
          </p>
        </motion.div>

        {/* Trust card */}
        <motion.div
          {...rise(0.24)}
          className="flex items-start gap-3 rounded-2xl bg-primary-tint/60 p-4"
        >
          <ShieldCheck size={17} className="mt-0.5 flex-shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            We use verification codes instead of passwords, so your account stays secure even if someone
            knows your email. Your BVN identifies you; we never share it with third parties.
          </p>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key={error}
              initial={{ opacity: 0, y: 6 }}
              animate={
                reduce
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
              }
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive"
            >
              {error}{' '}
              {error.toLowerCase().includes('already exists') && (
                <button
                  onClick={() => setAuthScreen('login-email')}
                  className="font-semibold underline"
                >
                  Log in instead
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div {...rise(0.3)}>
          <motion.button
            onClick={handleNext}
            disabled={!canContinue || loading}
            whileHover={reduce || !canContinue ? undefined : { scale: 1.01 }}
            whileTap={reduce || !canContinue ? undefined : { scale: 0.98 }}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground elevation-1"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Sending code…' : 'Continue'}
          </motion.button>
        </motion.div>

        <motion.p {...rise(0.36)} className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => setAuthScreen('login-email')}
            className="font-semibold text-primary hover:underline"
          >
            Log in
          </button>
        </motion.p>
      </div>
    </AuthLayout>
  )
}
