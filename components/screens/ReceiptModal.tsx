'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, Download, Share2, X, Clock, XCircle } from 'lucide-react'
import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  onClose: () => void
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const methodLabel =
    transaction.paymentMethod === 'wallet'
      ? 'Wallet Balance'
      : transaction.paymentMethod === 'paystack'
        ? 'Paystack'
        : '—'

  const timestamp = new Date(transaction.timestamp)

  const handleDownload = () => {
    const receiptText = [
      'PayXpress Receipt',
      '================',
      `Reference: ${transaction.reference}`,
      `Description: ${transaction.description}`,
      `Amount: ${formatCurrency(transaction.amount)}`,
      `Payment Method: ${methodLabel}`,
      `Date: ${timestamp.toLocaleString('en-NG')}`,
      `Status: ${transaction.status}`,
    ].join('\n')

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
        // user dismissed the share sheet — nothing to recover
      }
    } else {
      navigator.clipboard.writeText(shareText)
    }
  }

  const statusIcon =
    transaction.status === 'completed' ? (
      <Check size={40} className="text-primary" strokeWidth={2.5} />
    ) : transaction.status === 'failed' ? (
      <XCircle size={40} className="text-destructive" />
    ) : (
      <Clock size={40} className="text-warning" />
    )

  const statusTint =
    transaction.status === 'completed'
      ? 'bg-primary-tint'
      : transaction.status === 'failed'
        ? 'bg-destructive/10'
        : 'bg-secondary'

  const statusColor =
    transaction.status === 'completed'
      ? 'text-primary'
      : transaction.status === 'failed'
        ? 'text-destructive'
        : 'text-warning'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.6 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="relative w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Transaction Receipt</h2>
          <button
            onClick={onClose}
            aria-label="Close receipt"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-center mb-5">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 16, stiffness: 260, delay: 0.1 }}
                className={`w-20 h-20 rounded-full ${statusTint} flex items-center justify-center`}
              >
                {statusIcon}
              </motion.div>
            </div>

            <div className="text-center mb-5">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <p className={`text-xl font-bold capitalize ${statusColor}`}>{transaction.status}</p>
            </div>

            <div className="text-center border-t border-b border-card-border py-5 mb-5">
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs text-muted-foreground flex-shrink-0">Biller</span>
                <span className="text-sm font-semibold text-foreground text-right">
                  {transaction.description}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-muted-foreground flex-shrink-0">Reference</span>
                <span className="text-xs font-mono font-semibold text-foreground text-right break-all">
                  {transaction.reference}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-muted-foreground flex-shrink-0">Date</span>
                <span className="text-sm font-semibold text-foreground">
                  {timestamp.toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-muted-foreground flex-shrink-0">Time</span>
                <span className="text-sm font-semibold text-foreground">
                  {timestamp.toLocaleTimeString('en-NG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-muted-foreground flex-shrink-0">Payment Method</span>
                <span className="text-sm font-semibold text-foreground">{methodLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleDownload}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
            >
              <Download size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Download</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
            >
              <Share2 size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Share</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigator.clipboard.writeText(transaction.reference)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
            >
              <Check size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Copy Ref</span>
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full h-13 mt-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors elevation-1"
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
