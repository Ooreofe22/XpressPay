'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { motion } from 'motion/react'

export interface OtpInputHandle {
  focus: () => void
  clear: () => void
}

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  onComplete: (otp: string) => void
  disabled?: boolean
  shake?: boolean
  error?: string | null
  length?: number
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
    { value, onChange, onComplete, disabled, shake, error, length = 6 },
    ref
) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRefs.current[0]?.focus()
    },
    clear: () => {
      onChange(new Array(length).fill(''))
      inputRefs.current[0]?.focus()
    },
  }))

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (next.every((d) => d !== '') && next.join('').length === length) {
      onComplete(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
        const next = [...value]
        next[index - 1] = ''
        onChange(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const next = new Array(length).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    onChange(next)
    const focusIndex = Math.min(pasted.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === length) {
      onComplete(pasted)
    }
  }

  return (
      <motion.div
          animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center gap-2 sm:gap-3"
      >
        {Array.from({ length }).map((_, index) => (
            <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={value[index] ?? ''}
                disabled={disabled}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`h-13 w-11 rounded-xl border text-center text-xl font-semibold outline-none transition-colors duration-150 sm:h-14 sm:w-12 ${
                    error
                        ? 'border-destructive bg-destructive/5 text-destructive'
                        : 'border-border bg-background text-foreground focus:border-primary'
                } disabled:cursor-not-allowed disabled:opacity-60`}
            />
        ))}
      </motion.div>
  )
})