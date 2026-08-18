'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2 } from 'lucide-react'

export function SignUpOTP() {
  const { setAuthScreen, verifySignupOtp, resendSignupOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(59)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) return
    setLoading(true)
    setError('')
    try {
      await verifySignupOtp(otpString)
      // verify-otp just created + activated the account, seeded the wallet,
      // and issued tokens server-side. Hand off to the shared PIN screen —
      // same component login uses — to finish (device-local PIN, then dashboard).
      setAuthScreen('login-welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail) return
    setCountdown(59)
    setCanResend(false)
    setOtp(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
    try {
      await resendSignupOtp()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const maskedEmail = pendingEmail
      ? pendingEmail.replace(/^(.{2}).*(@.*)$/, (_m, first, domain) => `${first}••••${domain}`)
      : '••••'

  return (
      <AuthLayout onBack={() => setAuthScreen('signup-email')} eyebrow="Create account">
        <div className="space-y-10">
          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Enter OTP</h1>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{maskedEmail}</span>
            </p>
          </div>

          {/* OTP Input Boxes */}
          <div className="flex gap-2.5 justify-between sm:justify-start">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    aria-label={`Digit ${index + 1}`}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${
                        digit ? 'border-primary bg-primary-tint' : 'border-card-border bg-background'
                    }`}
                />
            ))}
          </div>

          {error && (
              <div className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg -mt-4">
                {error}
              </div>
          )}

          {/* Countdown or Resend */}
          <div>
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
          </div>

          <button
              onClick={handleVerify}
              disabled={otp.join('').length !== 6 || loading}
              className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </AuthLayout>
  )
}