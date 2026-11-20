import React from 'react'

/**
 * Inline status: a coloured marker followed by a plain label. No capsule.
 *
 * Tone carries meaning, so pick it by what the label says:
 *   neutral   counts, in progress, informational
 *   positive  done, verified, active
 *   warning   pending, flagged, needs attention
 *   danger    failed, suspended
 *   onBrand   on a green or dark brand surface
 *
 * Marker and label share the tone colour; every tone keeps at least 4.5:1
 * contrast on cards in both themes.
 */
export type StatusTone = 'neutral' | 'positive' | 'warning' | 'danger' | 'onBrand'

const marker: Record<StatusTone, string> = {
  neutral: 'text-muted-foreground',
  positive: 'text-primary',
  warning: 'text-warning',
  danger: 'text-destructive',
  onBrand: 'text-white',
}

const label: Record<StatusTone, string> = {
  neutral: 'text-muted-foreground',
  positive: 'text-primary',
  warning: 'text-warning',
  danger: 'text-destructive',
  onBrand: 'text-white/90',
}

const sizes = {
  sm: 'gap-1.5 text-[12px] [&_svg]:size-3.5',
  md: 'gap-2 text-[13px] [&_svg]:size-4',
  lg: 'gap-2 text-[15px] [&_svg]:size-[18px]',
}

interface StatusProps {
  tone?: StatusTone
  size?: keyof typeof sizes
  /** Leading dot. `live` adds a soft pulse ring for in-progress states. */
  dot?: boolean | 'live'
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function Status({
  tone = 'neutral',
  size = 'md',
  dot,
  icon,
  className = '',
  children,
}: StatusProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap font-medium leading-none tabular-nums [&_svg]:shrink-0 ${sizes[size]} ${label[tone]} ${className}`}
    >
      {(dot || icon) && (
        <span className={`flex items-center ${marker[tone]}`} aria-hidden>
          {icon ?? (
            <span className="relative flex h-2 w-2">
              {dot === 'live' && (
                <span className="absolute inset-0 rounded-full bg-current opacity-50 motion-safe:animate-ping" />
              )}
              <span className="relative h-2 w-2 rounded-full bg-current" />
            </span>
          )}
        </span>
      )}
      {children}
    </span>
  )
}
