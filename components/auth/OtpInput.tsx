'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export interface OtpInputRef {
  focus: () => void
  clear: () => void
}

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete?: (otp: string) => void
  disabled?: boolean
  /** Bump this number to trigger a shake (wrong / expired code). */
  shakeKey?: number
  invalid?: boolean
  length?: number
}

/**
 * Shared 6-box OTP field used by both the signup and login verification
 * screens. Handles auto-advance, backspace-to-previous, full-code paste, a
 * per-digit fill animation, and a shake when the backend rejects the code.
 */
export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, disabled, shakeKey = 0, invalid, length = 6 },
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

  const commit = (next: string[]) => {
    onChange(next)
    const joined = next.join('')
    if (joined.length === length && next.every((d) => d !== '')) {
      onComplete?.(joined)
    }
  }

  const handleChange = (index: number, raw: string) => {
    if (disabled) return
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus()
    commit(next)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    if (disabled) return
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const next = new Array(length).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
    commit(next)
  }

  return (
    <motion.div
      key={shakeKey}
      animate={
        shakeKey > 0 && !reduceMotion
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : { x: 0 }
      }
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
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={invalid || undefined}
            animate={filled && !reduceMotion ? { scale: [0.9, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-50 ${
              invalid
                ? 'border-destructive bg-destructive/5 focus:border-destructive'
                : filled
                  ? 'border-primary bg-primary-tint focus:border-primary'
                  : 'border-card-border bg-background focus:border-primary'
            }`}
          />
        )
      })}
    </motion.div>
  )
})
