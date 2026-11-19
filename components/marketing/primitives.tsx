'use client'

import React from 'react'
import Link, { useLinkStatus } from 'next/link'
import { ArrowRight } from 'lucide-react'

/** Page width and side gutters shared by every landing section. */
export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-[1120px] px-5 sm:px-8 ${className}`}>{children}</div>
  )
}

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`animate-spin motion-reduce:animate-[spin_1.6s_linear_infinite] ${className}`}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/** Swaps the trailing arrow for a spinner while the navigation is pending. */
function PendingIndicator({ size }: { size: number }) {
  const { pending } = useLinkStatus()
  return (
    <span className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {pending ? (
        <Spinner size={size} />
      ) : (
        <ArrowRight
          size={size}
          strokeWidth={2.5}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
      <span className="sr-only" aria-live="polite">
        {pending ? 'Loading' : ''}
      </span>
    </span>
  )
}

type CtaSize = 'sm' | 'md' | 'lg'

const sizes: Record<CtaSize, string> = {
  sm: 'h-9 px-4 text-[14px] gap-1.5 rounded-[10px]',
  md: 'h-12 px-6 text-[16px] gap-2 rounded-xl',
  lg: 'h-14 px-8 text-[17px] gap-2.5 rounded-[14px]',
}

/**
 * The one filled button on the page. Accent background, squared corners, and a
 * loading state so a slow navigation never looks like a dead click.
 */
export function CtaLink({
  href,
  children,
  size = 'md',
  className = '',
  onClick,
}: {
  href: string
  children: React.ReactNode
  size?: CtaSize
  className?: string
  onClick?: () => void
}) {
  const icon = size === 'lg' ? 18 : size === 'md' ? 17 : 14
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group inline-flex items-center justify-center bg-primary font-semibold tracking-[-0.01em] text-primary-foreground transition-[background-color,transform,box-shadow] duration-200 hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 ${sizes[size]} ${className}`}
    >
      {children}
      <PendingIndicator size={icon} />
    </Link>
  )
}

/** Quiet text link used next to the CTA so the CTA stays the only button. */
export function TextLink({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const isHash = href.startsWith('#')
  const cls = `group inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:underline ${className}`
  const inner = (
    <>
      {children}
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
        ›
      </span>
    </>
  )
  return isHash ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  )
}

/** Wordmark: a plain green tile and the name. No dots, rings or flourishes. */
export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 17 17 7M9 7h8v8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">PayXpress</span>
    </span>
  )
}
