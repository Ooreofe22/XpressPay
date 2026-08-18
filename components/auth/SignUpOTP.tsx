'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { Loader2, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const RESEND_SECONDS = 60

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const reduce = useReducedMotion()
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

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? 0.2 : 0.55,
      delay: reduce ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  })

  const handleVerify = async (otpString: string) => {
    if (otpString.length !== 6 || loading) return
    setLoading(true)
    setError(null)
    try {
      await verifySignupOtp(otpString)
      // Account exists server-side now — BVN is the second signup step,
      // then the shared PIN screen finishes authentication.
      setAuthScreen('signup-bvn')
    } catch (err) {
      // Backend distinguishes "Invalid code" (400) from "Code expired" (410)
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
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
      <AuthLayout
          onBack={() => setAuthScreen('signup-email')}
          eyebrow="Create account"
          step={1}
          totalSteps={2}
      >
        <div className="space-y-8">
          {/* Heading */}
          <motion.div {...rise(0.05)} className="space-y-3">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Check your inbox
            </h1>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{maskedEmail}</span>
            </p>
          </motion.div>

          {/* OTP boxes */}
          <motion.div {...rise(0.14)}>
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

          {/* Error */}
          <AnimatePresence>
            {error && (
                <motion.div
                    key={error}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive"
                >
                  {error}
                </motion.div>
            )}
          </AnimatePresence>

          {/* Resend */}
          <motion.div {...rise(0.2)}>
            {!canResend ? (
                <p className="text-sm text-muted-foreground">
                  Resend code in{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                0:{countdown.toString().padStart(2, '0')}
              </span>
                </p>
            ) : (
                <button
                    onClick={handleResend}
                    className="text-sm font-semibold text-primary hover:underline"
                >
                  Resend code
                </button>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div {...rise(0.26)}>
            <motion.button
                onClick={() => handleVerify(otp.join(''))}
                disabled={otp.join('').length !== 6 || loading}
                whileHover={reduce || loading ? undefined : { scale: 1.01 }}
                whileTap={reduce || loading ? undefined : { scale: 0.98 }}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground elevation-1"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Verifying…' : 'Verify'}
            </motion.button>
          </motion.div>

          {/* Help card */}
          <motion.div
              {...rise(0.32)}
              className="flex items-start gap-3 rounded-2xl bg-primary-tint/60 p-4"
          >
            <ShieldCheck size={17} className="mt-0.5 flex-shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The code expires in 15 minutes. If you don&apos;t see it, check your spam folder.
            </p>
          </motion.div>
        </div>
      </AuthLayout>
  )
}
