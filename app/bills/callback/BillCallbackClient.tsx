'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Clock } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button, Spinner } from '@/components/app/kit'
import type { Transaction } from '@/types'
import { verifyBillerPayment } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

const POLL_INTERVAL_MS = 2500
const MAX_POLLS = 8 // about 20s of polling before showing "taking longer than usual"

interface BillCallbackClientProps {
  reference?: string
}

export function BillCallbackClient({ reference }: BillCallbackClientProps) {
  const router = useRouter()
  const { refreshTransactionHistory } = useApp()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (!reference) {
      setError('No payment reference found in the URL')
      return
    }

    let cancelled = false

    async function poll() {
      try {
        const result = await verifyBillerPayment(reference!)
        if (cancelled) return
        setTransaction(result)

        // Pending is the only state worth polling on; completed, failed and
        // pending after the last poll are resting states
        if (result.status === 'pending' && pollCount < MAX_POLLS) {
          setTimeout(() => setPollCount((c) => c + 1), POLL_INTERVAL_MS)
        } else {
          // resolved (or polling exhausted): refresh the real history list
          refreshTransactionHistory()
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not verify payment')
      }
    }

    poll()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, pollCount])

  const stillPolling = transaction?.status === 'pending' && pollCount < MAX_POLLS
  const reduce = useReducedMotion()
  const status = transaction?.status
  const done = status === 'completed'
  const failed = status === 'failed' || !!error

  const steps = [
    { label: 'Card payment received', state: transaction ? 'done' : error ? 'idle' : 'active' },
    {
      label: 'Confirming with the biller',
      state: done ? 'done' : failed ? 'failed' : transaction ? (stillPolling ? 'active' : 'waiting') : 'idle',
    },
    { label: 'Delivered', state: done ? 'done' : 'idle' },
  ] as const

  const title = error
    ? 'We couldn\'t confirm this payment'
    : !transaction
      ? 'Confirming your payment'
      : done
        ? 'Payment complete'
        : status === 'failed'
          ? 'Payment failed'
          : stillPolling
            ? 'Almost there'
            : 'Taking longer than usual'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] overflow-hidden rounded-[28px] border border-card-border/80 bg-card elevation-3"
      >
        <div className="px-7 pb-7 pt-9 text-center" aria-live="polite">
          <p className="text-[14px] text-muted-foreground">{title}</p>
          <p className="mt-2 text-[44px] font-bold leading-none tracking-[-0.04em] text-foreground tabular-nums">
            {transaction ? formatCurrency(transaction.amount) : '₦ · · ·'}
          </p>
          {transaction && (
            <p className="mt-2 text-[15px] text-muted-foreground">{transaction.description}</p>
          )}
        </div>

        <ol className="space-y-4 border-t border-card-border/70 px-7 py-6">
          {steps.map((st) => (
            <li key={st.label} className="flex items-center gap-3.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  st.state === 'done'
                    ? 'bg-primary text-primary-foreground'
                    : st.state === 'failed'
                      ? 'bg-destructive text-white'
                      : st.state === 'active'
                        ? 'text-primary'
                        : st.state === 'waiting'
                          ? 'bg-warning-tint text-warning'
                          : 'border border-card-border'
                }`}
              >
                {st.state === 'done' && (
                  <motion.span initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} className="flex">
                    <Check size={15} strokeWidth={3.2} />
                  </motion.span>
                )}
                {st.state === 'failed' && <X size={15} strokeWidth={3.2} />}
                {st.state === 'active' && <Spinner size={26} />}
                {st.state === 'waiting' && <Clock size={15} strokeWidth={2.4} />}
              </span>
              <span
                className={`text-[15px] ${st.state === 'idle' ? 'text-muted-foreground' : 'font-medium text-foreground'}`}
              >
                {st.label}
              </span>
            </li>
          ))}
        </ol>

        {(error || (status === 'pending' && !stillPolling)) && (
          <p className="mx-7 mb-2 rounded-[14px] bg-background p-4 text-[14px] leading-[1.45] text-muted-foreground">
            {error ||
              'The biller network is slow right now. Your payment history will update on its own in a few minutes.'}
          </p>
        )}

        {transaction && (
          <dl className="mx-7 mt-2 flex justify-between gap-4 text-[14px]">
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="font-mono font-semibold text-foreground">{transaction.reference}</dd>
          </dl>
        )}

        <div className="p-7">
          <Button
            size="lg"
            className="w-full"
            variant={transaction || error ? 'primary' : 'secondary'}
            onClick={() => router.push('/app')}
          >
            {done ? 'Done' : 'Back to PayXpress'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
