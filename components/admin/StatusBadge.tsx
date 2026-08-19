import React from 'react'
import type { TxStatus } from '@/types/admin'

const config: Record<TxStatus, { label: string; className: string; pulse?: boolean }> = {
  FULFILLED: { label: 'Fulfilled', className: 'bg-primary-tint text-primary' },
  PAYSTACK_CONFIRMED: { label: 'Confirmed', className: 'bg-primary-tint text-primary' },
  FULFILLING: { label: 'Fulfilling', className: 'bg-secondary text-muted-foreground', pulse: true },
  PENDING_PAYMENT: { label: 'Awaiting payment', className: 'bg-accent-tint text-accent', pulse: true },
  FAILED: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  NEEDS_RECONCILIATION: { label: 'Needs review', className: 'bg-accent-tint text-accent', pulse: true },
}

export function StatusBadge({ status }: { status: TxStatus }) {
  const c = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${c.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  )
}
