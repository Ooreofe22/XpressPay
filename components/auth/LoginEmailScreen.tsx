'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2, Mail } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export function LoginEmailScreen() {
  const { setAuthScreen, requestLoginOtp } = useApp()
  const reduce = useReducedMotion()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

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
    if (!isValidEmail || loading) return
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
        <motion.div {...rise(0.05)} className="space-y-3">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Enter your email address and we&apos;ll send you a one-time code — no password to
            remember.
          </p>
        </motion.div>

        {/* Email input */}
        <motion.div {...rise(0.14)} className="space-y-2">
          <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <div className="group relative">
            <Mail
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
            />
            <input
              id="login-email"
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
              className="h-13 w-full rounded-xl border border-card-border bg-white pl-11 pr-4 text-base font-medium text-foreground transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
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
              {error.toLowerCase().includes('no account') && (
                <button
                  onClick={() => setAuthScreen('signup-email')}
                  className="font-semibold underline"
                >
                  Create one instead
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div {...rise(0.22)}>
          <motion.button
            onClick={handleNext}
            disabled={!isValidEmail || loading}
            whileHover={reduce || !isValidEmail ? undefined : { scale: 1.01 }}
            whileTap={reduce || !isValidEmail ? undefined : { scale: 0.98 }}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground elevation-1"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Sending code…' : 'Continue'}
          </motion.button>
        </motion.div>

        <motion.p {...rise(0.3)} className="text-center text-sm text-muted-foreground">
          New to PayXpress?{' '}
          <button
            onClick={() => setAuthScreen('signup-email')}
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </button>
        </motion.p>
      </div>
    </AuthLayout>
  )
}
