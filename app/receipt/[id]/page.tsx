'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Clock, Download, Share2, Copy, Wallet, CreditCard, Loader2 } from 'lucide-react'
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

  useEffect(() => {
    const cached = transactions.find((t) => t.id === params.id)
    if (cached) {
      setTransaction(cached)
      setLoading(false)
      return
    }

    // not in memory (direct link, refresh, or came from a different session) — fetch it
    fetchTransaction(params.id)
        .then(setTransaction)
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not load this receipt'))
        .finally(() => setLoading(false))
  }, [params.id, transactions])

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={26} className="text-primary animate-spin" />
        </div>
    )
  }

  if (error || !transaction) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="text-base font-bold text-foreground mb-1">Receipt not found</p>
          <p className="text-sm text-muted-foreground mb-6">{error || "This transaction doesn't exist."}</p>
          <button
              onClick={() => router.back()}
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            Go back
          </button>
        </div>
    )
  }

  const isSuccess = transaction.status === 'completed'
  const isFailed = transaction.status === 'failed'
  const isPending = transaction.status === 'pending'
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
        // user cancelled — no-op
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
      `Date: ${transaction.timestamp.toLocaleDateString()} ${transaction.timestamp.toLocaleTimeString()}`,
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

  return (
      <div className="min-h-screen bg-secondary/40 pb-10">
        {/* Nav bar */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-card-border">
          <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
            <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={19} />
            </button>
            <p className="text-sm font-bold text-foreground">Receipt</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pt-6">
          {/* ── Receipt card, real-world styled with a torn/perforated bottom edge ── */}
          <div className="relative">
            <div className="bg-card rounded-t-2xl border border-b-0 border-card-border elevation-2 px-6 pt-8 pb-6">
              {/* Status */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full ${statusConfig.bg} flex items-center justify-center mb-4`}>
                  <statusConfig.icon size={28} className="text-white" strokeWidth={3} />
                </div>
                <p className={`text-sm font-bold uppercase tracking-wide ${statusConfig.text} mb-2`}>
                  {statusConfig.label}
                </p>
                <p className="text-4xl font-bold text-foreground tracking-tight">
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isSuccess ? 'Paid to' : isFailed ? 'Payment to' : 'Payment pending to'}{' '}
                  <span className="font-semibold text-foreground">
                  {transaction.billerName || transaction.description}
                </span>
                </p>
              </div>

              {isFailed && transaction.billerResponseMessage && (
                  <div className="mt-5 bg-destructive/10 rounded-xl p-3 text-xs text-destructive text-center">
                    {transaction.billerResponseMessage}
                  </div>
              )}
            </div>

            {/* Perforation */}
            <div className="relative h-5 bg-card border-x border-card-border overflow-visible">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-secondary" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary/40" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary/40" />
            </div>

            {/* Details */}
            <div className="bg-card rounded-b-2xl border border-t-0 border-card-border elevation-2 px-6 py-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment method</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {isBalancePayment ? <Wallet size={14} className="text-primary" /> : <CreditCard size={14} className="text-primary" />}
                  {isBalancePayment ? 'PayXpress Balance' : 'Card / Gateway'}
              </span>
              </div>

              {transaction.billerCategoryPath && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="text-sm font-semibold text-foreground capitalize">
                  {transaction.billerCategoryPath}
                </span>
                  </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-semibold text-foreground">
                {transaction.timestamp.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm font-semibold text-foreground">
                {transaction.timestamp.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </span>
              </div>

              <div className="pt-4 border-t border-dashed border-card-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reference</span>
                <button
                    onClick={handleCopyRef}
                    className="flex items-center gap-1.5 text-sm font-mono font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {transaction.reference}
                  <Copy size={12} />
                </button>
              </div>

              {transaction.xpressReferenceId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Xpress Ref</span>
                    <span className="text-xs font-mono text-muted-foreground">{transaction.xpressReferenceId}</span>
                  </div>
              )}
            </div>
          </div>

          {copied && (
              <div className="text-center text-xs font-semibold text-primary mt-3">Copied to clipboard</div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
                onClick={handleDownload}
                className="h-12 rounded-xl bg-card border border-card-border text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary transition-colors elevation-1"
            >
              <Download size={16} />
              Download
            </button>
            <button
                onClick={handleShare}
                className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors elevation-1"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Licensed by the CBN and insured by the NDIC.
          </p>
        </div>
      </div>
  )
}
