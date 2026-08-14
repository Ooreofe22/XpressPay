'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, Download, Share2, X, Wallet, CreditCard, Clock, XCircle } from 'lucide-react'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  onClose: () => void
}

const METHOD_LABEL: Record<string, string> = {
  wallet: 'Wallet balance',
  paystack: 'Paystack',
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const timestamp = new Date(transaction.timestamp)
  const isCompleted = transaction.status === 'completed'
  const isFailed = transaction.status === 'failed'

  const handleDownload = () => {
    const receiptText = [
      'PayXpress Receipt',
      '================',
      `Reference: ${transaction.reference}`,
      `Biller: ${transaction.description}`,
      `Amount: ${formatCurrency(transaction.amount)}`,
      `Method: ${METHOD_LABEL[transaction.paymentMethod ?? ''] ?? 'Card / Transfer'}`,
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
      return
    }
    navigator.clipboard.writeText(shareText)
  }

  const statusIcon = isCompleted ? (
    <Check size={40} className="text-primary" strokeWidth={2.5} />
  ) : isFailed ? (
    <XCircle size={40} className="text-destructive" strokeWidth={2} />
  ) : (
    <Clock size={36} className="text-warning" strokeWidth={2} />
  )

  const rows: { label: string; value: React.ReactNode; mono?: boolean }[] = [
    { label: 'Reference', value: transaction.reference, mono: true },
    { label: 'Biller', value: transaction.description },
    {
      label: 'Payment method',
      value: (
        <span className="inline-flex items-center gap-1.5">
          {transaction.paymentMethod === 'wallet' ? (
            <Wallet size={14} className="text-primary" />
          ) : (
            <CreditCard size={14} className="text-accent" />
          )}
          {METHOD_LABEL[transaction.paymentMethod ?? ''] ?? 'Card / Transfer'}
        </span>
      ),
    },
    {
      label: 'Date',
      value: timestamp.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    },
    { label: 'Time', value: timestamp.toLocaleTimeString('en-NG') },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-50"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.6 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Transaction receipt"
        className="w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
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

        <div className="px-5 pb-6">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 pt-7 pb-6 text-center border-b border-dashed border-card-border">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 16, stiffness: 260, delay: 0.08 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isCompleted ? 'bg-primary-tint' : isFailed ? 'bg-destructive/10' : 'bg-secondary'
                }`}
              >
                {statusIcon}
              </motion.div>

              <p className="text-xs text-muted-foreground mb-1">
                {isCompleted ? 'Payment successful' : isFailed ? 'Payment failed' : 'Payment pending'}
              </p>
              <p className="text-4xl font-bold text-foreground tracking-tight tabular-nums">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="px-5 py-5 space-y-3.5">
              {rows.map((row) => (
                <div key={row.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-muted-foreground flex-shrink-0">{row.label}</span>
                  <span
                    className={`text-sm font-semibold text-foreground text-right ${
                      row.mono ? 'font-mono text-xs' : ''
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="flex flex-col items-center gap-2 py-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <Download size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Download</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex flex-col items-center gap-2 py-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <Share2 size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Share</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigator.clipboard.writeText(transaction.reference)}
              className="flex flex-col items-center gap-2 py-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <CreditCard size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Copy ref</span>
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full h-13 mt-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors elevation-1"
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
