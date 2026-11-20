'use client'

import React from 'react'

/*
 * App kit: the shared building blocks for every signed-in screen.
 * Same type scale and rules as the landing page (see DESIGN_SYSTEM.md),
 * on the app palette (green tinted neutrals, orange accent).
 */

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cx('animate-spin', className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Surface for grouped content. 24px corners, hairline border, soft lift. */
export function Panel({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: React.ReactNode
  className?: string
  as?: 'section' | 'div' | 'aside'
}) {
  return (
    <Tag className={cx('rounded-[24px] border border-card-border/80 bg-card elevation-1', className)}>
      {children}
    </Tag>
  )
}

/** Page title block: large title, one line of context, optional actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="type-title-2 text-foreground">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Section heading with an optional quiet text action on the right. */
export function SectionTitle({
  title,
  action,
  className = '',
}: {
  title: string
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div className={cx('mb-3 flex items-baseline justify-between gap-4', className)}>
      <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          className="group inline-flex items-center gap-0.5 text-[14px] font-medium text-primary transition-colors hover:text-primary-dark"
        >
          {action.label}
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
            ›
          </span>
        </button>
      )}
    </div>
  )
}

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'onBrand' | 'onBrandSolid'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-dark',
  accent: 'bg-accent text-accent-foreground hover:brightness-105',
  secondary: 'bg-secondary text-foreground hover:bg-card-border',
  ghost: 'text-foreground hover:bg-secondary',
  danger: 'bg-destructive-tint text-destructive hover:bg-destructive/15',
  onBrand: 'bg-white/12 text-white ring-1 ring-inset ring-white/20 hover:bg-white/20',
  onBrandSolid: 'bg-white text-primary-deep hover:bg-white/90',
}

const btnSizes = {
  sm: 'h-9 gap-1.5 rounded-[10px] px-3.5 text-[14px] [&_svg]:size-4',
  md: 'h-11 gap-2 rounded-[12px] px-5 text-[15px] [&_svg]:size-[18px]',
  lg: 'h-14 gap-2.5 rounded-[14px] px-7 text-[17px] [&_svg]:size-5',
}

/** Button with a built-in loading state: spinner replaces the icon and the label stays. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: keyof typeof btnSizes
  loading?: boolean
  icon?: React.ReactNode
}) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold tracking-[-0.01em] transition-[background-color,transform,opacity] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 aria-busy:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25',
        variants[variant],
        btnSizes[size],
        className,
      )}
    >
      {loading ? <Spinner size={size === 'lg' ? 20 : 17} /> : icon}
      {children}
    </button>
  )
}

export type TileTone = 'green' | 'orange' | 'neutral' | 'onBrand' | 'solid'

const tileTones: Record<TileTone, string> = {
  green: 'bg-primary-tint text-primary',
  orange: 'bg-accent-tint text-accent',
  neutral: 'bg-secondary text-foreground',
  onBrand: 'bg-white/12 text-white ring-1 ring-inset ring-white/15',
  solid: 'bg-primary text-primary-foreground',
}

/** Rounded square that holds an icon. Squircle corners, never a capsule. */
export function IconTile({
  icon,
  tone = 'green',
  size = 40,
  className = '',
}: {
  icon: React.ReactNode
  tone?: TileTone
  size?: number
  className?: string
}) {
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center', tileTones[tone], className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}
      aria-hidden
    >
      {icon}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <IconTile icon={icon} tone="neutral" size={52} />
      <p className="mt-4 text-[16px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-[18rem] text-[14px] leading-[1.45] text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** One line in a grouped list: leading tile, title and detail, trailing content. */
export function ListRow({
  leading,
  title,
  detail,
  trailing,
  onClick,
  className = '',
}: {
  leading?: React.ReactNode
  title: React.ReactNode
  detail?: React.ReactNode
  trailing?: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const inner = (
    <>
      {leading}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15px] font-medium text-foreground">{title}</span>
        {detail && (
          <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">{detail}</span>
        )}
      </span>
      {trailing}
    </>
  )
  const cls = cx('flex w-full items-center gap-3.5 px-5 py-3.5', className)
  return onClick ? (
    <button
      onClick={onClick}
      className={cx(cls, 'transition-colors duration-150 hover:bg-secondary/60 active:bg-secondary')}
    >
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

/** Shimmering placeholder block for loading states. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cx('skeleton rounded-[10px]', className)} aria-hidden />
}
