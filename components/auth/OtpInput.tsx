'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { motion } from 'motion/react'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete: (otp: string) => void
  disabled?: boolean
  shake?: boolean
  error?: string | null
  length?: number
}

export interface OtpInputHandle {
  focus: () => void
  clear: () => void
}

/**
 * Six-box (default) OTP input. Exposes focus()/clear() via ref so parent
 * screens can refocus or reset after a failed verify/resend without holding
 * their own array of input refs.
 */
export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, disabled, shake, length = 6 },
  ref
) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useImperativeHandle(ref, () => ({
    focus: () => inputRefs.current[0]?.focus(),
    clear: () => inputRefs.current[0]?.focus(),
  }))

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const joined = next.join('')
    if (joined.length === length) {
      onComplete(joined)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    e.preventDefault()
    const next = new Array(length).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    onChange(next)
    const lastIndex = Math.min(pasted.length, length) - 1
    inputRefs.current[lastIndex]?.focus()
    if (pasted.length === length) onComplete(pasted)
  }

  return (
    <motion.div
      animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-between gap-2.5 sm:justify-start"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${index + 1}`}
          className={`h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60 ${
            value[index] ? 'border-primary bg-primary-tint' : 'border-card-border bg-white'
          }`}
        />
      ))}
    </motion.div>
  )
})
