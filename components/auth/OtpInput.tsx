'use client'

import React, { useRef, useState } from 'react'

interface OtpInputProps {
  length?: number
  value: string[]
  onChange: (next: string[]) => void
  /** Fired once every box is filled (typing or paste). */
  onComplete?: (code: string) => void
  disabled?: boolean
  /** true paints the boxes in the destructive error state */
  invalid?: boolean
  autoFocus?: boolean
}

/**
 * Shared fintech-style segmented OTP input: 6 boxes, auto-advance, backspace
 * to previous box, full-code paste support, and a numeric keyboard on mobile.
 */
export function OtpInput({
                           length = 6,
                           value,
                           onChange,
                           onComplete,
                           disabled = false,
                           invalid = false,
                           autoFocus = true,
                         }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null)

  const focusAt = (index: number) => {
    inputRefs.current[index]?.focus()
    inputRefs.current[index]?.select()
  }

  const commit = (next: string[]) => {
    onChange(next)
    const code = next.join('')
    if (code.length === length && next.every((d) => d !== '')) {
      onComplete?.(code)
    }
  }

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return

    // Pasting (or autofill) into a box can deliver the whole code at once —
    // distribute it across the boxes from this position.
    const next = [...value]
    const chars = digits.slice(0, length - index).split('')
    chars.forEach((d, i) => {
      next[index + i] = d
    })
    commit(next)

    const nextEmpty = next.findIndex((d) => d === '')
    if (nextEmpty !== -1) focusAt(nextEmpty)
    else inputRefs.current[length - 1]?.blur()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...value]
      if (next[index]) {
        next[index] = ''
        commit(next)
      } else if (index > 0) {
        next[index - 1] = ''
        commit(next)
        focusAt(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusAt(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      focusAt(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!digits) return
    const next = Array.from({ length }, (_, i) => digits[i] ?? '')
    commit(next)
    if (digits.length < length) focusAt(digits.length)
  }

  return (
      <div className="flex gap-2.5 justify-between sm:justify-start" role="group" aria-label="Verification code">
        {value.map((digit, index) => (
            <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={length}
                value={digit}
                disabled={disabled}
                autoFocus={autoFocus && index === 0}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${index + 1} of ${length}`}
                aria-invalid={invalid || undefined}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-all focus:outline-none disabled:opacity-50 ${
                    invalid
                        ? 'border-destructive bg-destructive/5 focus:border-destructive focus:ring-2 focus:ring-destructive/15'
                        : digit
                            ? 'border-primary bg-primary-tint focus:border-primary focus:ring-2 focus:ring-primary/15'
                            : 'border-card-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/15'
                } ${focusedIndex === index && !digit ? 'border-primary/60' : ''}`}
            />
        ))}
      </div>
  )
}

/** Convenience: an empty digit array for a fresh code entry. */
export function emptyOtp(length = 6): string[] {
  return Array.from({ length }, () => '')
}

/** Map backend OTP errors to clear UX copy. */
export function otpErrorMessage(err: unknown): string {
  const status = (err as { status?: number })?.status
  if (status === 410) return 'This code has expired. Request a new one.'
  if (status === 400) return 'That code is incorrect. Check your inbox and try again.'
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}
