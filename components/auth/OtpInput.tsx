'use client'

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete?: (otp: string) => void
  disabled?: boolean
  shake?: boolean
  error?: string | null
  length?: number
}

export interface OtpInputRef {
  focus: () => void
  clear: () => void
}

/**
 * Shared 6-box OTP field used by both the signup and login verification
 * screens. Handles auto-advance, backspace-to-previous, full-code paste, and
 * a per-digit fill animation. Shake-on-error is driven by the `shake` prop so
 * the parent controls when it fires (i.e. only after a rejected code).
 */
export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  ({ value, onChange, onComplete, disabled, shake, error, length = 6 }, ref) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const reduceMotion = useReducedMotion()

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

    const handleChange = (index: number, rawValue: string) => {
      if (disabled) return
      const digit = rawValue.replace(/\D/g, '').slice(-1)
      const next = [...value]
      next[index] = digit
      onChange(next)

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      const joined = next.join('')
      if (joined.length === length && next.every((d) => d !== '') && onComplete) {
        onComplete(joined)
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      if (disabled) return
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      if (!pasted) return

      const next = new Array(length).fill('')
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
      onChange(next)

      inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
      if (pasted.length === length && onComplete) onComplete(pasted)
    }

    return (
      <motion.div
        animate={shake && !reduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="flex gap-2.5 justify-between sm:justify-start"
      >
        {Array.from({ length }).map((_, index) => {
          const filled = Boolean(value[index])
          return (
            <motion.input
              key={index}
              ref={(el: HTMLInputElement | null) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={value[index] || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={disabled}
              aria-label={`Digit ${index + 1}`}
              aria-invalid={Boolean(error)}
              animate={
                reduceMotion ? undefined : { scale: filled ? [0.9, 1.06, 1] : 1 }
              }
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                error
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
  }
)

OtpInput.displayName = 'OtpInput'
