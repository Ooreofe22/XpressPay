'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete?: (otp: string) => void
  disabled?: boolean
  /** Flip to a new truthy value to trigger the error shake. */
  shakeKey?: number
  hasError?: boolean
  length?: number
}

export interface OtpInputRef {
  focus: () => void
  clear: () => void
}

/**
 * Segmented OTP entry shared by the signup and login verification screens.
 * Handles auto-advance, backspace-to-previous, full-code paste, per-digit fill
 * animation and an error shake. Motion is skipped entirely when the user has
 * reduced-motion set.
 */
export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, disabled, shakeKey = 0, hasError, length = 6 },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    commit(next)
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
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
    commit(next)
  }

  return (
    <motion.div
      key={shakeKey}
      animate={shakeKey && !reduceMotion ? { x: [0, -6, 5, -4, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.45, ease: [0.36, 0.07, 0.19, 0.97] }}
      className="flex gap-2.5 justify-between sm:justify-start"
    >
      {Array.from({ length }).map((_, index) => {
        const filled = Boolean(value[index])
        return (
          <motion.div
            key={index}
            animate={filled && !reduceMotion ? { scale: [1, 1.09, 1] } : { scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <input
              ref={(el) => {
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
              aria-invalid={hasError || undefined}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                hasError
                  ? 'border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/15'
                  : filled
                    ? 'border-primary bg-primary-tint focus:border-primary focus:ring-primary/15'
                    : 'border-card-border bg-background focus:border-primary focus:ring-primary/15'
              }`}
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
})
