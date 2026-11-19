'use client'

import React, { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  format?: (n: number) => string
  hint?: string
  tone?: 'default' | 'alert'
  delay?: number
}

export function StatCard({
  label,
  value,
  icon: Icon,
  format = (n) => Math.round(n).toLocaleString('en-NG'),
  hint,
  tone = 'default',
  delay = 0,
}: StatCardProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let raf: number
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <div
      className="animate-fade-up rounded-2xl border border-card-border bg-card p-5 elevation-1 transition-shadow duration-300 hover:elevation-2"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tone === 'alert' ? 'bg-warning-tint text-warning' : 'bg-primary-tint text-primary'
          }`}
        >
          <Icon size={17} strokeWidth={2.25} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {format(display)}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
