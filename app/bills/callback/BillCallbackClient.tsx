'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { Transaction } from '@/types'
import { verifyBillerPayment } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { ReceiptModal } from '@/components/screens/ReceiptModal'

const POLL_INTERVAL_MS = 2500
const MAX_POLLS = 8 // ~20s of polling before giving up and just showing "still processing"

interface BillCallbackClientProps {
  reference?: string
}

export function BillCallbackClient({ reference }: BillCallbackClientProps) {
  const router = useRouter()
  const { refreshTransactionHistory, refreshBalance } = useApp()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)

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

        if (result.status === 'pending' && pollCount < MAX_POLLS) {
          setTimeout(() => setPollCount((c) => c + 1), POLL_INTERVAL_MS)
        } else {
          // resolved (or given up polling) — refresh history, and the balance too
          // since a completed Paystack payment can change the wallet server-side
          refreshTransactionHistory()
          if (result.status === 'completed') refreshBalance()
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

  return (
    <div className="min-h-screen bg-background ambient-mesh flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-sm bg-card border border-card-border rounded-2xl elevation-2 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!transaction && !error && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-16 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-5">
                <Loader2 size={28} className="text-primary animate-spin" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">Confirming your payment</p>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                We&apos;re verifying with Paystack and processing your bill payment
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-16 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                <XCircle size={28} className="text-destructive" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">Something went wrong</p>
              <p className="text-sm text-muted-foreground max-w-[260px] mb-6">{error}</p>
              <motion.button
                onClick={() => router.push('/app')}
                whileTap={{ scale: 0.97 }}
                className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Back to app
              </motion.button>
            </motion.div>
          )}

          {transaction && (
            <motion.div
              key={`tx-${transaction.status}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-6 pt-8 pb-6 text-center border-b border-dashed border-card-border">
                <motion.div
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 240 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    transaction.status === 'completed'
                      ? 'bg-primary-tint'
                      : transaction.status === 'failed'
                        ? 'bg-destructive/10'
                        : 'bg-secondary'
                  }`}
                >
                  {transaction.status === 'completed' && (
                    <CheckCircle2 size={30} className="text-primary" strokeWidth={2} />
                  )}
                  {transaction.status === 'failed' && (
                    <XCircle size={30} className="text-destructive" />
                  )}
                  {transaction.status === 'pending' &&
                    (stillPolling ? (
                      <Loader2 size={28} className="text-muted-foreground animate-spin" />
                    ) : (
                      <Clock size={28} className="text-muted-foreground" />
                    ))}
                </motion.div>

                <p className="text-sm text-muted-foreground mb-1">
                  {transaction.status === 'completed' && 'Payment successful'}
                  {transaction.status === 'failed' && 'Payment failed'}
                  {transaction.status === 'pending' &&
                    (stillPolling ? 'Still confirming…' : 'Taking longer than usual')}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(transaction.amount)}
                </p>

                {transaction.status === 'pending' && !stillPolling && (
                  <p className="text-xs text-muted-foreground mt-3 max-w-[240px] mx-auto">
                    This can happen if the biller network is slow. Check your payment history in a
                    few minutes — it&apos;ll update automatically.
                  </p>
                )}
              </div>

              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground flex-shrink-0">Description</span>
                  <span className="font-semibold text-foreground text-right">
                    {transaction.description}
                  </span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground flex-shrink-0">Reference</span>
                  <span className="font-semibold font-mono text-xs text-foreground text-right break-all">
                    {transaction.reference}
                  </span>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-2.5">
                {transaction.status === 'completed' && (
                  <motion.button
                    onClick={() => setShowReceipt(true)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 rounded-xl border border-primary/30 text-primary font-semibold text-sm hover:bg-primary-tint transition-colors"
                  >
                    View receipt
                  </motion.button>
                )}
                <motion.button
                  onClick={() => router.push('/app')}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showReceipt && transaction && (
          <ReceiptModal
            transaction={{ ...transaction, paymentMethod: 'paystack' }}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
