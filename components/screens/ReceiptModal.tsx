'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, Download, Share2, X, Wallet, CreditCard } from 'lucide-react'
import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  /** Optional biller/merchant name when the caller knows it (payment flow does). */
  billerName?: string
  onClose: () => void
}

function methodLabel(method?: Transaction['paymentMethod']): string {
  if (method === 'wallet') return 'Wallet balance'
  if (method === 'paystack') return 'Paystack'
  return '—'
}

export function ReceiptModal({ transaction, billerName, onClose }: ReceiptModalProps) {
  const timestamp = new Date(transaction.timestamp)
  const isFailed = transaction.status === 'failed'
  const isPending = transaction.status === 'pending'

  const handleDownload = () => {
    const receiptText = [
      'PayXpress Receipt',
      '================',
      `Reference: ${transaction.reference}`,
      billerName ? `Biller: ${billerName}` : null,
      `Description: ${transaction.description}`,
      `Amount: ${formatCurrency(transaction.amount)}`,
      `Payment method: ${methodLabel(transaction.paymentMethod)}`,
      `Date: ${timestamp.toLocaleString('en-NG')}`,
      `Status: ${transaction.status}`,
    ]
      .filter(Boolean)
      .join('\n')

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${transaction.reference}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const shareText = `PayXpress Receipt\nReference: ${transaction.reference}\nAmount: ${formatCurrency(
      transaction.amount
    )}\nStatus: ${transaction.status}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'PayXpress Receipt', text: shareText })
      } catch {
        // user dismissed the share sheet — nothing to do
      }
    } else {
      navigator.clipboard.writeText(shareText)
    }
  }

  const statusTone = isFailed
    ? 'text-destructive'
    : isPending
      ? 'text-warning'
      : 'text-primary'

  const statusRing = isFailed
    ? 'bg-destructive/10'
    : isPending
      ? 'bg-warning/10'
      : 'bg-primary-tint'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.6 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        role="dialog"
        aria-label="Transaction receipt"
        className="relative w-full sm:max-w-sm glass rounded-2xl rounded-b-none sm:rounded-b-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-base font-bold text-foreground">Receipt</h2>
          <button
            onClick={onClose}
            aria-label="Close receipt"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-5 pb-6 text-center border-b border-dashed border-card-border">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.08 }}
            className={`w-16 h-16 rounded-full ${statusRing} flex items-center justify-center mx-auto mb-4`}
          >
            {isFailed ? (
              <X size={30} className="text-destructive" strokeWidth={2.25} />
            ) : (
              <Check size={30} className={statusTone} strokeWidth={2.5} />
            )}
          </motion.div>

          <p className={`text-sm font-semibold capitalize ${statusTone}`}>{transaction.status}</p>
          <p className="text-4xl font-bold text-foreground tracking-tight mt-1 tabular-nums">
            {formatCurrency(transaction.amount)}
          </p>
        </div>

        <div className="px-5 py-5 space-y-3.5">
          {billerName && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-sm text-muted-foreground">Biller</span>
              <span className="text-sm font-semibold text-foreground text-right">{billerName}</span>
            </div>
          )}
          <div className="flex justify-between items-start gap-4">
            <span className="text-sm text-muted-foreground">Description</span>
            <span className="text-sm font-semibold text-foreground text-right">
              {transaction.description}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">Reference</span>
            <span className="text-xs font-mono font-semibold text-foreground">
              {transaction.reference}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">Date</span>
            <span className="text-sm font-semibold text-foreground">
              {timestamp.toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {', '}
              {timestamp.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-muted-foreground">Payment method</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {transaction.paymentMethod === 'wallet' ? (
                <Wallet size={14} className="text-primary" />
              ) : transaction.paymentMethod === 'paystack' ? (
                <CreditCard size={14} className="text-accent" />
              ) : null}
              {methodLabel(transaction.paymentMethod)}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 grid grid-cols-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleDownload}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
          >
            <Download size={18} className="text-primary" />
            <span className="text-[11px] font-semibold text-foreground">Download</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
          >
            <Share2 size={18} className="text-primary" />
            <span className="text-[11px] font-semibold text-foreground">Share</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigator.clipboard.writeText(transaction.reference)}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
          >
            <Check size={18} className="text-primary" />
            <span className="text-[11px] font-semibold text-foreground">Copy ref</span>
          </motion.button>
        </div>

        <div className="px-5 pb-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors elevation-1"
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
