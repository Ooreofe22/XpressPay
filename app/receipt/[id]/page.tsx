'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Clock, Download, Share2, Copy, Wallet, CreditCard, Landmark } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button, EmptyState, Panel, Skeleton } from '@/components/app/kit'
import { txStatus } from '@/lib/txStatus'
import { useApp } from '@/context/AppContext'
import { fetchTransaction } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/types'

export default function ReceiptPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { transactions } = useApp()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const cached = transactions.find((t) => t.id === params.id)
    if (cached) {
      setTransaction(cached)
      setLoading(false)
      return
    }

    // not in memory (direct link, refresh, or another session): fetch it
    fetchTransaction(params.id)
        .then(setTransaction)
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not load this receipt'))
        .finally(() => setLoading(false))
  }, [params.id, transactions])

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-10 border-b border-card-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[480px] items-center gap-2 px-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft size={19} />
          </button>
          <p className="text-[16px] font-semibold text-foreground">Receipt</p>
        </div>
      </div>
      <div className="mx-auto max-w-[480px] px-4 pt-6">{children}</div>
    </div>
  )

  if (loading) {
    return (
      <Shell>
        <Panel className="space-y-4 p-8" as="div">
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-4 w-28" />
          <Skeleton className="mx-auto h-11 w-48" />
          <div className="space-y-3 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </Panel>
      </Shell>
    )
  }

  if (error || !transaction) {
    return (
      <Shell>
        <Panel>
          <EmptyState
            icon={<X size={22} />}
            title="Receipt not found"
            body={error || "This transaction doesn't exist."}
            action={
              <Button size="sm" onClick={() => router.back()}>
                Go back
              </Button>
            }
          />
        </Panel>
      </Shell>
    )
  }

  const when = new Date(transaction.timestamp)
  const tone = txStatus(transaction.status).tone
  const isSuccess = tone === 'positive'
  const isFailed = tone === 'danger'
  const isBalancePayment = transaction.paymentMethod === 'BALANCE'

  const statusConfig = isSuccess
      ? { icon: Check, label: 'Successful', bg: 'bg-primary', text: 'text-primary' }
      : isFailed
          ? { icon: X, label: 'Failed', bg: 'bg-destructive', text: 'text-destructive' }
          : { icon: Clock, label: 'Pending', bg: 'bg-warning', text: 'text-warning' }

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleShare = async () => {
    const text = `PayXpress Receipt\n${transaction.billerName || transaction.description}\nAmount: ${formatCurrency(transaction.amount)}\nStatus: ${statusConfig.label}\nRef: ${transaction.reference}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PayXpress Receipt', text })
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const handleDownload = () => {
    const lines = [
      'PAYXPRESS',
      '================================',
      `Status: ${statusConfig.label}`,
      `Amount: ${formatCurrency(transaction.amount)}`,
      '--------------------------------',
      `Paid to: ${transaction.billerName || transaction.description}`,
      transaction.billerCategoryPath ? `Category: ${transaction.billerCategoryPath}` : '',
      `Payment method: ${isBalancePayment ? 'PayXpress Balance' : 'Card / Gateway'}`,
      `Reference: ${transaction.reference}`,
      transaction.xpressReferenceId ? `Xpress Ref: ${transaction.xpressReferenceId}` : '',
      `Date: ${when.toLocaleDateString()} ${when.toLocaleTimeString()}`,
      '================================',
      'Thank you for using PayXpress.',
    ].filter(Boolean)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payxpress-receipt-${transaction.reference}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const band = isSuccess
    ? { cls: 'balance-gradient text-white', icon: Check, label: 'Payment successful', iconCls: 'bg-white text-primary' }
    : isFailed
      ? { cls: 'bg-destructive-tint text-destructive', icon: X, label: 'Payment failed', iconCls: 'bg-destructive text-white' }
      : { cls: 'bg-warning-tint text-warning', icon: Clock, label: 'Payment pending', iconCls: 'bg-warning text-white' }
  const Icon = band.icon

  const rows: [string, React.ReactNode][] = [
    [
      'Paid with',
      <span key="m" className="inline-flex items-center gap-1.5">
        {isBalancePayment ? <Wallet size={15} className="text-primary" /> : <CreditCard size={15} className="text-primary" />}
        {isBalancePayment ? 'PayXpress balance' : 'Card'}
      </span>,
    ],
    ...(transaction.billerCategoryPath
      ? ([['Category', <span key="c" className="capitalize">{transaction.billerCategoryPath}</span>]] as [string, React.ReactNode][])
      : []),
    ['Date', when.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })],
    ['Time', when.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })],
  ]

  return (
    <Shell>
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-[28px] border border-card-border/80 bg-card elevation-2"
      >
        <div className={`flex flex-col items-center px-6 pb-8 pt-9 text-center ${band.cls}`}>
          <span className={`flex h-14 w-14 items-center justify-center rounded-full ${band.iconCls}`}>
            <Icon size={26} strokeWidth={3} />
          </span>
          <p className="mt-4 text-[15px] font-medium">{band.label}</p>
          <p
            className={`mt-1 text-[44px] font-bold leading-none tracking-[-0.04em] tabular-nums ${
              isSuccess ? 'text-white' : 'text-foreground'
            }`}
          >
            {formatCurrency(transaction.amount)}
          </p>
          <p className={`mt-2 text-[15px] ${isSuccess ? 'text-white/85' : 'text-muted-foreground'}`}>
            to <span className={`font-semibold ${isSuccess ? 'text-white' : 'text-foreground'}`}>{transaction.billerName || transaction.description}</span>
          </p>
        </div>

        {isFailed && transaction.billerResponseMessage && (
          <p className="mx-6 mt-6 rounded-[14px] bg-destructive-tint p-3.5 text-center text-[14px] text-destructive">
            {transaction.billerResponseMessage}
          </p>
        )}

        <dl className="divide-y divide-card-border/70 px-6 py-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3.5 text-[15px]">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium text-foreground">{v}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-3.5 text-[15px]">
            <dt className="text-muted-foreground">Reference</dt>
            <dd>
              <button
                onClick={handleCopyRef}
                className="inline-flex items-center gap-1.5 font-mono font-semibold text-foreground transition-colors hover:text-primary"
                aria-label="Copy reference"
              >
                {transaction.reference}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? 'ok' : 'copy'}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex"
                  >
                    {copied ? <Check size={14} className="text-primary" strokeWidth={3} /> : <Copy size={13} />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </dd>
          </div>
          {transaction.xpressReferenceId && (
            <div className="flex items-center justify-between gap-4 py-3.5 text-[15px]">
              <dt className="text-muted-foreground">Biller reference</dt>
              <dd className="font-mono text-[13px] text-muted-foreground">{transaction.xpressReferenceId}</dd>
            </div>
          )}
        </dl>
      </motion.div>

      <p className="mt-3 h-5 text-center text-[13px] font-medium text-primary" aria-live="polite">
        {copied ? 'Copied' : ''}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" icon={<Download />} onClick={handleDownload}>
          Download
        </Button>
        <Button size="lg" icon={<Share2 />} onClick={handleShare}>
          Share
        </Button>
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
        <Landmark size={14} />
        Licensed by the CBN. Deposits insured by the NDIC.
      </p>
    </Shell>
  )
}
