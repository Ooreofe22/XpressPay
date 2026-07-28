'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { PasscodeInput } from './PasscodeInput'
import { Fingerprint } from 'lucide-react'

export function LoginScreen() {
  const { login } = useApp()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const handleLogin = async (code: string) => {
    setLoading(true)
    setError('')
    try {
      await login(code)
    } catch (err) {
      setError('Invalid passcode. Try again.')
      setPasscode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-3 shadow-sm">
            <span className="text-xl font-bold text-primary-foreground">PX</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">PayXpress</h1>
          <p className="text-sm text-muted-foreground">Mobile Banking for Nigerians</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 border border-card-border shadow-sm relative">
          {/* Passcode Input */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-4 font-medium">Enter 6-Dot Passcode</p>
            <PasscodeInput
              length={6}
              value={passcode}
              onChange={setPasscode}
              onComplete={handleLogin}
            />
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (passcode.length < 6) {
                    const newCode = passcode + num
                    setPasscode(newCode)
                    if (newCode.length === 6) {
                      handleLogin(newCode)
                    }
                  }
                }}
                className="h-12 rounded-lg bg-secondary border border-card-border text-foreground font-semibold hover:bg-card transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => setPasscode(passcode.slice(0, -1))}
            className="w-full h-12 rounded-lg bg-secondary border border-card-border text-foreground font-semibold hover:bg-card transition-colors active:scale-95 text-sm"
          >
            Delete
          </button>

          {/* Forgot PIN Link */}
          <button
            onClick={() => setShowForgot(!showForgot)}
            className="w-full mt-4 text-primary text-sm font-medium hover:underline"
          >
            Forgot PIN?
          </button>

          {/* Fingerprint Icon - Positioned Bottom Right */}
          <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
            <Fingerprint className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Security Info */}
        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground">
            🔒 Secured with bank-level encryption
          </p>
        </div>

        {/* Sign Up Link */}
        <button className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <span className="text-primary font-semibold hover:underline">Sign Up</span>
        </button>
      </div>
    </div>
  )
}
