'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { Loader2 } from 'lucide-react'
import { motion } from 'motion/react'

const RESEND_SECONDS = 60

export function LoginOTPScreen() {
  const { setAuthScreen, verifyLoginOtp, requestLoginOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState(new Array(6).fill(''))
  const [timer, setTimer] = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const otpRef = useRef<React.ElementRef<typeof OtpInput>>(null)

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    }
    setCanResend(true)
  }, [timer])

  const handleVerify = async (otpString: string) => {
    setLoading(true)
    setError(null)
    try {
      await verifyLoginOtp(otpString)
      setAuthScreen('login-welcome')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(msg)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setOtp(new Array(6).fill(''))
      otpRef.current?.clear()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail) return
    setTimer(RESEND_SECONDS)
    setCanResend(false)
    setError(null)
    setOtp(new Array(6).fill(''))
    otpRef.current?.clear()
    try {
      await requestLoginOtp(pendingEmail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/(.{2}).+(@.+)/, '$1***$2')
    : '***@***'

  return (
    <AuthLayout onBack={() => setAuthScreen('login-email')} eyebrow="Log in">
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3"
        >
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
            Confirm your email
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Please enter the code sent to{' '}
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          {!canResend ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-semibold text-foreground">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-primary font-semibold hover:underline"
            >
              Resend Code
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
          {loading ? 'Verifying…' : 'Continue'}
        </motion.button>
      </div>
    </AuthLayout>
  )
}
