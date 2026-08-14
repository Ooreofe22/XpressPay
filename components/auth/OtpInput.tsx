'use client'

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

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

export const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  ({ value, onChange, onComplete, disabled, shake, error, length = 6 }, ref) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useImperativeHandle(ref, () => ({
      focus: () => inputRefs.current[0]?.focus(),
      clear: () => {
        onChange(new Array(length).fill(''))
        inputRefs.current[0]?.focus()
      },
    }))

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
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i]
      }
      onChange(next)
      const focusIndex = Math.min(pasted.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
      if (pasted.length === length && onComplete) {
        onComplete(pasted)
      }
    }

    useEffect(() => {
      inputRefs.current[0]?.focus()
    }, [])

    return (
      <div className={`flex gap-2.5 justify-between sm:justify-start ${shake ? 'shake' : ''}`}>
        {Array.from({ length }).map((_, index) => {
          const filled = value[index] !== ''
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value[index] || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={disabled}
              aria-label={`Digit ${index + 1}`}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 text-foreground transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50 ${
                filled
                  ? 'border-primary bg-primary-tint animate-otp-pop'
                  : 'border-card-border bg-background'
              } ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/15' : ''}`}
            />
          )
        })}
      </div>
    )
  }
)

OtpInput.displayName = 'OtpInput'
