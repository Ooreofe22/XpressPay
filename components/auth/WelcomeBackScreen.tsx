'use client'

import React, { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2 } from 'lucide-react'

// Shared final step for BOTH signup and login — reached from SignUpOTP after a
// real account is created, and from LoginOTPScreen after a real login. The
// backend has no PIN concept at all (email+OTP only); this PIN is a local
// device-level quick-unlock gate on top of the session already issued by the
// OTP step, stored hashed via lib/localPin.ts and keyed by email. First entry
// for an email on this device SETS the PIN; every entry after must match it.
export function WelcomeBackScreen() {
  const { completeLogin, setAuthScreen, pendingEmail, isSettingNewPin } = useApp()
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const reduceMotion = useReducedMotion()

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)
    setError('')

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    const full = newPin.join('')
    if (full.length === 4 && newPin.every((d) => d !== '')) {
      handleSubmit(full)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (pinCode: string) => {
    setLoading(true)
    setError('')
    try {
      await completeLogin(pinCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PIN. Try again.')
      setShakeKey((k) => k + 1)
      setPin(['', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const initial = pendingEmail ? pendingEmail.charAt(0).toUpperCase() : '\u2022'
  const maskedEmail = pendingEmail ?? ''

  return (
    <AuthLayout onBack={() => setAuthScreen('splash')}>
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="w-16 h-16 rounded-full balance-gradient flex items-center justify-center text-white text-xl font-bold elevation-2"
          >
            {initial}
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isSettingNewPin ? 'Create a PIN' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSettingNewPin
                ? `Set a 4-digit PIN to secure ${maskedEmail}`
                : 'Enter your PIN to continue'}
            </p>
            <button
              onClick={() => setAuthScreen('splash')}
              className="text-xs text-primary font-medium hover:underline mt-2 transition-colors"
            >
              Not your account? Log out
            </button>
          </div>
        </div>

        <motion.div
          key={shakeKey}
          animate={shakeKey && !reduceMotion ? { x: [0, -6, 5, -4, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.45, ease: [0.36, 0.07, 0.19, 0.97] }}
          className="flex gap-3 justify-center"
        >
          {pin.map((digit, index) => (
            <motion.div
              key={index}
              animate={digit && !reduceMotion ? { scale: [1, 1.09, 1] } : { scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <input
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                aria-label={`PIN digit ${index + 1}`}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-colors duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50 ${
                  digit ? 'border-primary bg-primary-tint' : 'border-card-border bg-background'
                }`}
              />
            </motion.div>
          ))}
        </motion.div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            <span>Signing you in…</span>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {isSettingNewPin && (
          <p className="text-xs text-muted-foreground text-center max-w-xs -mt-2">
            You&apos;ll use this PIN to unlock PayXpress on this device next time
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
