'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput, type OtpInputRef } from '@/components/auth/OtpInput'
import { Loader2, MailCheck } from 'lucide-react'
import { motion } from 'motion/react'

const RESEND_SECONDS = 60
const OTP_LENGTH = 6

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [shake, setShake] = useState(false)
  const otpRef = useRef<OtpInputRef>(null)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
    setCanResend(true)
  }, [countdown])

  const handleVerify = async (otpString: string) => {
    if (otpString.length !== OTP_LENGTH) return
    setLoading(true)
    setError(null)
    try {
      await verifySignupOtp(otpString)
      // Account exists server-side now. Hand off to the same screen login uses.
      setAuthScreen('login-welcome')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setExpired(/expired/i.test(msg))
      setError(msg)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setOtp(new Array(OTP_LENGTH).fill(''))
      otpRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCountdown(RESEND_SECONDS)
    setCanResend(false)
    setError(null)
    setExpired(false)
    otpRef.current?.clear()
    try {
      await resendSignupOtp()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/^(.{2}).*(@.*)$/, '$1••••$2')
    : 'your inbox'

  return (
    <AuthLayout onBack={() => setAuthScreen('signup-email')} eyebrow="Create account · Step 2 of 2">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <span className="inline-flex w-12 h-12 rounded-2xl bg-primary-tint items-center justify-center mb-1">
            <MailCheck size={22} className="text-primary" strokeWidth={2} />
          </span>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Check your inbox</h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            We sent a {OTP_LENGTH}-digit code to{' '}
            <span className="font-semibold text-foreground">{maskedEmail}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <OtpInput
            ref={otpRef}
            value={otp}
            onChange={(next) => {
              setOtp(next)
              if (error) setError(null)
            }}
            onComplete={handleVerify}
            disabled={loading}
            shake={shake}
            error={error}
            length={OTP_LENGTH}
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
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
        </motion.div>

        <motion.button
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.join('').length !== OTP_LENGTH || loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-colors duration-200 hover:bg-primary-dark disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify'}
        </motion.button>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Codes expire after a few minutes. If nothing arrives, check your spam folder.
        </p>
      </div>
    </AuthLayout>
  )
}
