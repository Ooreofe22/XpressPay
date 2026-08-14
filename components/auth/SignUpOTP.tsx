'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput, type OtpInputHandle } from '@/components/auth/OtpInput'
import { Loader2, MailCheck } from 'lucide-react'

const RESEND_SECONDS = 60
const OTP_LENGTH = 6

function maskEmail(email: string | null): string {
  if (!email) return 'your inbox'
  const [local, domain] = email.split('@')
  if (!domain) return email
  const head = local.slice(0, 2)
  return `${head}${'\u2022'.repeat(Math.max(local.length - 2, 2))}@${domain}`
}

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [shake, setShake] = useState(false)
  const otpRef = useRef<OtpInputHandle>(null)

  const canResend = countdown === 0

  useEffect(() => {
    if (countdown === 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleVerify = async (code?: string) => {
    const otpString = code ?? otp.join('')
    if (otpString.length !== OTP_LENGTH) return

    setLoading(true)
    setError('')
    setExpired(false)
    try {
      await verifySignupOtp(otpString)
      // Account exists server-side now. Hand off to the same screen login uses.
      setAuthScreen('login-welcome')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(message)
      setExpired(/expired/i.test(message))
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setOtp(new Array(OTP_LENGTH).fill(''))
      otpRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || resending) return
    setResending(true)
    setError('')
    setExpired(false)
    setOtp(new Array(OTP_LENGTH).fill(''))
    try {
      await resendSignupOtp()
      setCountdown(RESEND_SECONDS)
      otpRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout onBack={() => setAuthScreen('signup-email')} eyebrow="Create account · Step 2 of 2">
      <div className="space-y-9">
        {/* "Check your inbox" state */}
        <div className="space-y-4">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="inline-flex w-12 h-12 rounded-2xl bg-primary-tint items-center justify-center"
          >
            <MailCheck size={22} className="text-primary" strokeWidth={2} />
          </motion.span>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Check your inbox</h1>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              We sent a {OTP_LENGTH}-digit code to{' '}
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
          shake={shake}
          invalid={Boolean(error)}
          length={OTP_LENGTH}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
            {expired && canResend && (
              <>
                {' '}
                <button onClick={handleResend} className="underline font-semibold">
                  Send a new code
                </button>
              </>
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
              disabled={resending}
              className="text-sm text-primary font-semibold hover:underline disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {resending && <Loader2 size={14} className="animate-spin" />}
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleVerify()}
          disabled={otp.join('').length !== OTP_LENGTH || loading}
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
