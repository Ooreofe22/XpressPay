'use client'

import React, { useRef, useEffect } from 'react'

interface PasscodeInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
}

export function PasscodeInput({
  length = 4,
  value,
  onChange,
  onComplete,
}: PasscodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, length, onComplete])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return

    const newValue = value.split('')
    newValue[index] = digit
    const updatedValue = newValue.join('').slice(0, length)
    onChange(updatedValue)

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        const newValue = value.slice(0, index) + value.slice(index + 1)
        onChange(newValue)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-14 h-14 text-center text-2xl font-bold
              bg-input border-2 border-border rounded-lg
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              transition-all duration-200 text-foreground"
          />
        ))}
    </div>
  )
}
