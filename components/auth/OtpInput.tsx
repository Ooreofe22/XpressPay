'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { motion } from 'motion/react'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete?: (otp: string) => void
  disabled?: boolean
  shake?: boolean
  hasError?: boolean
  length?: number
}

export interface OtpInputHandle {
  focus: () => void
  clear: () => void
}

/**
 * Shared 6-box OTP input used by both the signup and login verification
 * screens. Handles auto-advance, backspace-to-previous, and full-code paste.
 * Per-digit fill is a Motion pop; a wrong code shakes the whole row.
 */
export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, disabled, shake, hasError, length = 6 },
  ref
) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useImperativeHandle(ref, () => ({
    focus: () => inputRefs.current[0]?.focus(),
    clear: () => {
      onChange(new Array(length).fill(''))
      inputRefs.current[0]?.focus()
    },
  }))

  useEffect(() => {
    inputRefs.current[0]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (index: number, raw: string) => {
    if (disabled) return
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const joined = next.join('')
    if (joined.length === length && next.every((d) => d !== '')) {
      onComplete?.(joined)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Paste the whole code into the first box and it spreads across all of them —
  // this is how most people actually enter a code copied from their inbox.
  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    e.preventDefault()

    const next = new Array(length).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    onChange(next)

    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
    if (pasted.length === length) onComplete?.(pasted)
  }

  return (
    <motion.div
      animate={shake ? { x: [0, -6, 5, -4, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="flex gap-2.5 justify-between sm:justify-start"
    >
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? ''
        const filled = digit !== ''
        return (
          <motion.input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el as HTMLInputElement | null
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={hasError || undefined}
            animate={filled ? { scale: [0.86, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
              hasError
                ? 'border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/15'
                : filled
                  ? 'border-primary bg-primary-tint focus:border-primary focus:ring-primary/15'
                  : 'border-card-border bg-background focus:border-primary focus:ring-primary/15'
            }`}
          />
        )
      })}
    </motion.div>
  )
})
