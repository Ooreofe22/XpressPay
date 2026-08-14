'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { Loader2, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'

const RESEND_SECONDS = 60

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState(new Array(6).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const otpRef = useRef<React.ElementRef<typeof OtpInput>>(null)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
    setCanResend(true)
  }, [countdown])

  const handleVerify = async (otpString: string) => {
    setLoading(true)
    setError(null)
    try {
      await verifySignupOtp(otpString)
      setAuthScreen('login-welcome')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(msg)
      setShake(true)
      setTimeout(() => setShake(false), 600)
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
    setError(null)
    setOtp(new Array(6).fill(''))
    otpRef.current?.clear()
    try {
      await resendSignupOtp()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '***@***'

  return (
    <AuthLayout onBack={() => setAuthScreen('signup-email')} eyebrow="Create account · Step 2 of 2">
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3"
        >
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Check your inbox</h1>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-foreground">{maskedEmail}</span>
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
            error={error}
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {!canResend ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{' '}
              <span className="font-semibold text-foreground">
                0:{countdown.toString().padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-primary font-semibold hover:underline"
            >
              Resend OTP
            </button>
          )}
        </motion.div>

        <motion.button
          onClick={() => handleVerify(otp.join(''))}
          disabled={otp.join('').length !== 6 || loading}
          whileTap={{ scale: 0.98 }}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-colors duration-200 hover:bg-primary-dark disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify'}
        </motion.button>

        <div className="flex items-start gap-3 bg-secondary rounded-2xl p-4">
          <ShieldCheck size={17} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            The code expires in 15 minutes. If you don&apos;t see it, check your spam folder.
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
