'use client'

import React, { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput, emptyOtp, otpErrorMessage } from '@/components/auth/OtpInput'
import { Loader2, MailCheck } from 'lucide-react'

export function LoginOTPScreen() {
  const { setAuthScreen, verifyLoginOtp, resendLoginOtp: _unused, requestLoginOtp, pendingEmail } = useApp()
  const [otp, setOtp] = useState<string[]>(emptyOtp())
  const [countdown, setCountdown] = useState(59)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
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
      await verifyLoginOtp(otpString)
      setAuthScreen('login-welcome')
    } catch (err) {
      setError(otpErrorMessage(err))
      setOtp(emptyOtp())
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail) return
    setCountdown(59)
    setCanResend(false)
    setError('')
    setOtp(emptyOtp())
    try {
      await requestLoginOtp(pendingEmail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  return (
      <AuthLayout onBack={() => setAuthScreen('login-email')} eyebrow="Log in">
        <div className="space-y-10">
          {/* Heading — "check your inbox" state */}
          <div className="space-y-3">
            <span className="w-12 h-12 rounded-2xl bg-primary-tint flex items-center justify-center">
              <MailCheck size={22} className="text-primary" strokeWidth={2} />
            </span>
            <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
              Check your inbox
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{pendingEmail ?? 'your email'}</span>
            </p>
          </div>

          <OtpInput
              value={otp}
              onChange={(next) => {
                setOtp(next)
                if (error) setError('')
              }}
              onComplete={(code) => handleVerify(code)}
              disabled={loading}
              invalid={!!error}
          />

          {error && (
              <div className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg -mt-4">
                {error}
              </div>
          )}

          {/* Timer / Resend */}
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
                  Resend code
                </button>
            )}
          </div>

          <button
              onClick={() => handleVerify()}
              disabled={otp.join('').length !== 6 || loading}
              className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </div>
      </AuthLayout>
  )
}
