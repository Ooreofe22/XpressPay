import React from 'react'
import type { TxStatus } from '@/types/admin'
import { Status, type StatusTone } from '@/components/ui/Status'

const config: Record<TxStatus, { label: string; tone: StatusTone; live?: boolean }> = {
  FULFILLED: { label: 'Fulfilled', tone: 'positive' },
  PAYSTACK_CONFIRMED: { label: 'Confirmed', tone: 'positive' },
  FULFILLING: { label: 'Fulfilling', tone: 'neutral', live: true },
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'warning', live: true },
  FAILED: { label: 'Failed', tone: 'danger' },
  NEEDS_RECONCILIATION: { label: 'Needs review', tone: 'warning' },
}

export function StatusBadge({ status }: { status: TxStatus }) {
  const c = config[status]
  return (
    <Status tone={c.tone} dot={c.live ? 'live' : true}>
      {c.label}
    </Status>
  )
}
