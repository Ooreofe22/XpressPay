'use client'

import React, { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2 } from 'lucide-react'
import { motion } from 'motion/react'

export function WelcomeBackScreen() {
  const { completeLogin, setAuthScreen, pendingEmail, isSettingNewPin } = useApp()
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
      setPin(['', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const maskedEmail = pendingEmail
    ? pendingEmail.replace(/(.{2}).+(@.+)/, '$1***$2')
    : ''

  return (
    <AuthLayout onBack={() => setAuthScreen('splash')}>
      <div className="flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full balance-gradient flex items-center justify-center text-white text-xl font-bold elevation-2">
            {pendingEmail ? pendingEmail.charAt(0).toUpperCase() : '•'}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isSettingNewPin ? 'Create a PIN' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSettingNewPin
                ? `Set a 4-digit PIN to secure ${maskedEmail}`
                : 'Enter your PIN to continue'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="flex gap-3 justify-center"
        >
          {pin.map((digit, index) => (
            <input
              key={index}
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
              className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50 ${
                digit ? 'border-primary bg-primary-tint' : 'border-card-border bg-background'
              }`}
            />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive font-medium text-center bg-destructive/10 px-4 py-2.5 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {isSettingNewPin && (
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            You&apos;ll use this PIN to unlock PayXpress on this device next time
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
