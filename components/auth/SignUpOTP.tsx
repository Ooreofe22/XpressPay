'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput, type OtpInputRef } from '@/components/auth/OtpInput'
import { Loader2, MailCheck } from 'lucide-react'

const RESEND_SECONDS = 60

function maskEmail(email: string | null): string {
  if (!email) return 'your inbox'
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'\u2022'.repeat(Math.max(local.length - 2, 2))}@${domain}`
}

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const otpRef = useRef<OtpInputRef>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleVerify = async (code: string) => {
    if (code.length !== 6 || loading) return
    setLoading(true)
    setError('')
    try {
      await verifySignupOtp(code)
      // Account exists server-side now. Hand off to the same screen the login
      // flow uses to finish authenticating — same component, no duplicate.
      setAuthScreen('login-welcome')
    } catch (err) {
      // 400 → "Invalid code", 410 → "Code expired"
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setShakeKey((k) => k + 1)
      setOtp(new Array(6).fill(''))
      otpRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || resending) return
    setResending(true)
    setError('')
    try {
      await resendSignupOtp()
      setCountdown(RESEND_SECONDS)
      setOtp(new Array(6).fill(''))
      otpRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    } finally {
      setResending(false)
    }
  }

  const expired = error.toLowerCase().includes('expired')

  return (
    <AuthLayout onBack={() => setAuthScreen('signup-email')} eyebrow="Create account · Step 2 of 2">
      <div className="space-y-8">
        <div className="space-y-4">
          <span className="w-12 h-12 rounded-2xl bg-primary-tint flex items-center justify-center">
            <MailCheck size={22} className="text-primary" strokeWidth={2} />
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Check your inbox</h1>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{maskEmail(pendingEmail)}</span>. It
              expires in 10 minutes.
            </p>
          </div>
        </div>

        <OtpInput
          ref={otpRef}
          value={otp}
          onChange={setOtp}
          onComplete={handleVerify}
          disabled={loading}
          shakeKey={shakeKey}
          invalid={Boolean(error)}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
            {expired && ' — request a new one below.'}
          </motion.div>
        )}

        <div className="flex items-center justify-between gap-4">
          {countdown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{' '}
              <span className="font-semibold text-foreground tabular-nums">
                0:{countdown.toString().padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary font-semibold hover:underline disabled:opacity-60 flex items-center gap-1.5"
            >
              {resending && <Loader2 size={14} className="animate-spin" />}
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}

          <button
            onClick={() => setAuthScreen('signup-email')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Wrong email?
          </button>
        </div>

        <motion.button
          whileTap={{ scale: otp.join('').length === 6 && !loading ? 0.98 : 1 }}
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.join('').length !== 6 || loading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-colors duration-200 hover:bg-primary-dark disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify'}
        </motion.button>
      </div>
    </AuthLayout>
  )
}
