import type { StatusTone } from '@/components/ui/Status'

/**
 * Maps any transaction status (the app's lowercase values or the backend's
 * enum names) to a readable label and a colour tone.
 */
export function txStatus(raw: string | undefined | null): { label: string; tone: StatusTone } {
  const s = (raw ?? '').toLowerCase()
  if (['completed', 'fulfilled', 'paystack_confirmed', 'success', 'successful'].includes(s))
    return { label: 'Completed', tone: 'positive' }
  if (['failed', 'reversed', 'cancelled'].includes(s)) return { label: 'Failed', tone: 'danger' }
  if (s === 'needs_reconciliation') return { label: 'Under review', tone: 'warning' }
  if (['pending', 'pending_payment', 'fulfilling', 'processing'].includes(s))
    return { label: 'Pending', tone: 'warning' }
  const label = s ? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : 'Unknown'
  return { label, tone: 'neutral' }
}
