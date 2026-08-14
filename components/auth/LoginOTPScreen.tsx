'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput, type OtpInputRef } from '@/components/auth/OtpInput'
import { Loader2, MailCheck } from 'lucide-react'
import { motion } from 'motion/react'

const RESEND_SECONDS = 60

function maskEmail(email: string | null): string {
  if (!email) return 'your inbox'
  const [local, domain] = email.split('@')
  if (!domain) return email
  const shown = local.slice(0, 2)
  return `${shown}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`
}

export function LoginOTPScreen() {
  const { setAuthScreen, verifyLoginOtp, requestLoginOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [resent, setResent] = useState(false)
  const otpRef = useRef<OtpInputRef>(null)

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleVerify = async (code: string) => {
    if (code.length !== 6 || loading) return
    setLoading(true)
    setError(null)
    try {
      await verifyLoginOtp(code)
      setAuthScreen('login-welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      otpRef.current?.clear()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || !pendingEmail) return
    setCountdown(RESEND_SECONDS)
    setCanResend(false)
    setError(null)
    setResent(false)
    otpRef.current?.clear()
    try {
      await requestLoginOtp(pendingEmail)
      setResent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const isExpired = Boolean(error && /expire/i.test(error))

  return (
    <AuthLayout onBack={() => setAuthScreen('login-email')} eyebrow="Log in">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3"
        >
          <span className="inline-flex w-12 h-12 rounded-2xl bg-primary-tint items-center justify-center">
            <MailCheck size={22} className="text-primary" strokeWidth={2} />
          </span>
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
            Check your inbox
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Enter the 6-digit code we sent to{' '}
            <span className="font-semibold text-foreground">{maskEmail(pendingEmail)}</span>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
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
            error={error}
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
            {isExpired && canResend && (
              <button onClick={handleResend} className="ml-1 underline font-semibold">
                Send a new code
              </button>
            )}
          </motion.div>
        )}

        {resent && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-primary font-medium"
          >
            A new code is on its way.
          </motion.p>
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
          whileTap={{ scale: 0.98 }}
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.join('').length !== 6 || loading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-colors duration-200 hover:bg-primary-dark disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Continue'}
        </motion.button>

        <p className="text-xs text-muted-foreground text-center">
          Wrong email?{' '}
          <button
            onClick={() => setAuthScreen('login-email')}
            className="text-primary font-semibold hover:underline"
          >
            Change it
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
