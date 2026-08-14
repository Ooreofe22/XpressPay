'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete?: (otp: string) => void
  disabled?: boolean
  /** Set true briefly to shake the row — e.g. after a rejected code. */
  shake?: boolean
  invalid?: boolean
  length?: number
}

export interface OtpInputHandle {
  focus: () => void
  clear: () => void
}

/**
 * Segmented OTP entry shared by the signup and login verification screens.
 * Handles auto-advance, backspace-to-previous, full-code paste, and a per-digit
 * fill animation. All motion collapses to a plain state change when the user
 * prefers reduced motion.
 */
export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, disabled, shake, invalid, length = 6 },
  ref
) {
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
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
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
    if (pasted.length === length) onComplete?.(pasted)
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
            value={value[index] ?? ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={invalid || undefined}
            animate={reduceMotion ? undefined : { scale: filled ? [0.92, 1.06, 1] : 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 ${
              invalid
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
