'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput, type OtpInputRef } from '@/components/auth/OtpInput'
import { Loader2, MailCheck } from 'lucide-react'
import { motion } from 'motion/react'

const RESEND_SECONDS = 60
const OTP_LENGTH = 6

function maskEmail(email: string | null): string {
  if (!email) return 'your inbox'
  const [local, domain] = email.split('@')
  if (!domain) return email
  const head = local.slice(0, 2)
  return `${head}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`
}

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const otpRef = useRef<OtpInputRef>(null)

  const canResend = countdown === 0

  useEffect(() => {
    if (countdown === 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleVerify = async (otpString: string) => {
    if (otpString.length !== OTP_LENGTH || loading) return
    setLoading(true)
    setError(null)
    try {
      await verifySignupOtp(otpString)
      // Account exists server-side now. Hand off to the shared final step — the
      // same screen login uses — which sets/validates the device PIN.
      setAuthScreen('login-welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setOtp(new Array(OTP_LENGTH).fill(''))
      otpRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setCountdown(RESEND_SECONDS)
    setError(null)
    setOtp(new Array(OTP_LENGTH).fill(''))
    otpRef.current?.clear()
    try {
      await resendSignupOtp()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const isExpired = Boolean(error && /expired/i.test(error))

  return (
    <AuthLayout onBack={() => setAuthScreen('signup-email')} eyebrow="Create account · Step 2 of 2">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3"
        >
          <span className="w-12 h-12 rounded-2xl bg-primary-tint flex items-center justify-center">
            <MailCheck size={22} className="text-primary" strokeWidth={2} />
          </span>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Check your inbox</h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-foreground">{maskEmail(pendingEmail)}</span>. It
            expires in 15 minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
            {isExpired && canResend && (
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
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-sm text-primary font-semibold hover:underline"
            >
              Resend code
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend code in{' '}
              <span className="font-semibold text-foreground tabular-nums">
                0:{countdown.toString().padStart(2, '0')}
              </span>
            </p>
          )}
        </div>

        <motion.button
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.join('').length !== OTP_LENGTH || loading}
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
