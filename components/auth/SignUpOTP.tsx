'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput, type OtpInputHandle } from '@/components/auth/OtpInput'
import { Loader2, MailCheck } from 'lucide-react'

const RESEND_SECONDS = 60

function maskEmail(email: string | null): string {
  if (!email) return 'your inbox'
  const [local, domain] = email.split('@')
  if (!domain) return email
  const shown = local.slice(0, 2)
  return `${shown}${'•'.repeat(Math.max(local.length - 2, 1))}@${domain}`
}

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const otpRef = useRef<OtpInputHandle>(null)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
    setCanResend(true)
  }, [countdown])

  const handleVerify = async (code?: string) => {
    const otpString = code ?? otp.join('')
    if (otpString.length !== 6 || loading) return

    setLoading(true)
    setError('')
    try {
      await verifySignupOtp(otpString)
      // Account exists server-side now. Hand off to the same screen login uses
      // to finish authenticating — same component, no signup-specific finish.
      setAuthScreen('login-welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setOtp(new Array(6).fill(''))
      otpRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail) return
    setCountdown(RESEND_SECONDS)
    setCanResend(false)
    setError('')
    otpRef.current?.clear()
    try {
      await resendSignupOtp()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const expired = error.toLowerCase().includes('expired')

  return (
    <AuthLayout onBack={() => setAuthScreen('signup-email')} eyebrow="Create account · Step 2 of 2">
      <div className="space-y-9">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1.5 text-xs font-semibold text-primary">
            <MailCheck size={14} />
            Check your inbox
          </span>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Enter your code</h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-foreground">{maskEmail(pendingEmail)}</span>. It
            expires in 10 minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <OtpInput
            ref={otpRef}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            disabled={loading}
            shake={shake}
            hasError={Boolean(error)}
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
            {expired && canResend && (
              <button onClick={handleResend} className="ml-1.5 underline font-semibold">
                Send a new code
              </button>
            )}
          </motion.div>
        )}

        <div>
          {!canResend ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{' '}
              <span className="font-semibold text-foreground tabular-nums">
                0:{countdown.toString().padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-primary font-semibold hover:underline"
            >
              Resend code
            </button>
          )}
        </div>

        <motion.button
          onClick={() => handleVerify()}
          disabled={otp.join('').length !== 6 || loading}
          whileTap={{ scale: 0.98 }}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-colors duration-200 hover:bg-primary-dark disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify'}
        </motion.button>

        <p className="text-xs text-muted-foreground text-center">
          Wrong email?{' '}
          <button
            onClick={() => setAuthScreen('signup-email')}
            className="text-primary font-semibold hover:underline"
          >
            Change it
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
