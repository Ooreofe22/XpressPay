'use client'

import React, { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2 } from 'lucide-react'

export function LoginOTPScreen() {
  const { setAuthScreen, verifyLoginOtp, requestLoginOtp, pendingPhone } = useApp()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(41)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value.replace(/\D/g, '')
    setOtp(newOtp)

    if (value && index < 5) {
      const inputs = document.querySelectorAll('[data-otp-input]')
      ;(inputs[index + 1] as HTMLInputElement)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const inputs = document.querySelectorAll('[data-otp-input]')
      ;(inputs[index - 1] as HTMLInputElement)?.focus()
    }
  }

  const fullOtp = otp.join('')
  const isComplete = fullOtp.length === 6

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    try {
      await verifyLoginOtp(fullOtp)
      setAuthScreen('login-welcome')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setOtp(['', '', '', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingPhone) return
    setTimer(41)
    setCanResend(false)
    try {
      await requestLoginOtp(pendingPhone)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const maskedPhone = pendingPhone ? `****${pendingPhone.slice(-4)}` : '****'

  return (
    <AuthLayout onBack={() => setAuthScreen('login-phone')} eyebrow="Log in">
      <div className="space-y-10">
        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground tracking-tight text-balance">
            Confirm phone number
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Please enter the code sent to the number ending in{' '}
            <span className="font-semibold text-foreground">{maskedPhone}</span>
          </p>
        </div>

        {/* OTP Input Boxes */}
        <div className="flex gap-2.5 justify-between sm:justify-start">
          {otp.map((digit, index) => (
            <input
              key={index}
              data-otp-input
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
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

        {/* Timer / Resend */}
        <div>
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
        </div>

        <button
          onClick={handleVerify}
          disabled={!isComplete || loading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying...' : 'Continue'}
        </button>
      </div>
    </AuthLayout>
  )
}
