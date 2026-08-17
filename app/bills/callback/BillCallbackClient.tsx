'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { Transaction } from '@/types'
import { verifyBillerPayment } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/context/AppContext'

const POLL_INTERVAL_MS = 2500
const MAX_POLLS = 8 // ~20s of polling before giving up and just showing "still processing"

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

        // FULFILLING is the only state worth actively polling on - everything
        // else (completed/failed/pending-exhausted) is a resting state
        if (result.status === 'pending' && pollCount < MAX_POLLS) {
          setTimeout(() => setPollCount((c) => c + 1), POLL_INTERVAL_MS)
        } else {
          // resolved (or given up polling) - refresh the real history list
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

  return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card border border-card-border rounded-2xl elevation-2 overflow-hidden">

          {!transaction && !error && (
              <div className="px-6 py-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-5">
                  <Loader2 size={28} className="text-primary animate-spin" />
                </div>
                <p className="text-base font-bold text-foreground mb-1">Confirming your payment</p>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  We're verifying with the gateway and processing your bill payment
                </p>
              </div>
          )}

          {error && (
              <div className="px-6 py-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                  <XCircle size={28} className="text-destructive" />
                </div>
                <p className="text-base font-bold text-foreground mb-1">Something went wrong</p>
                <p className="text-sm text-muted-foreground max-w-[260px] mb-6">{error}</p>
                <button
                    onClick={() => router.push('/app')}
                    className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Back to app
                </button>
              </div>
          )}

          {transaction && (
              <>
                <div className="px-6 pt-8 pb-6 text-center border-b border-dashed border-card-border">
                  <div
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
                    {transaction.status === 'failed' && <XCircle size={30} className="text-destructive" />}
                    {transaction.status === 'pending' && (
                        stillPolling
                            ? <Loader2 size={28} className="text-muted-foreground animate-spin" />
                            : <Clock size={28} className="text-muted-foreground" />
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-1">
                    {transaction.status === 'completed' && 'Payment successful'}
                    {transaction.status === 'failed' && 'Payment failed'}
                    {transaction.status === 'pending' && (stillPolling ? 'Still confirming...' : 'Taking longer than usual')}
                  </p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(transaction.amount)}</p>

                  {transaction.status === 'pending' && !stillPolling && (
                      <p className="text-xs text-muted-foreground mt-3 max-w-[240px] mx-auto">
                        This can happen if the biller network is slow. Check your payment history in a few minutes -
                        it'll update automatically.
                      </p>
                  )}
                </div>

                <div className="px-6 py-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-semibold text-foreground text-right">{transaction.description}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-semibold font-mono text-xs text-foreground">{transaction.reference}</span>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                      onClick={() => router.push('/app')}
                      className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98]"
                  >
                    Done
                  </button>
                </div>
              </>
          )}
        </div>
      </div>
  )
}
