'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, Copy, Download, Share2, X, Wallet, CreditCard } from 'lucide-react'
import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  onClose: () => void
}

function methodLabel(method: Transaction['paymentMethod']): string {
  if (method === 'wallet') return 'Wallet balance'
  if (method === 'paystack') return 'Paystack'
  return 'Card / transfer'
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const timestamp = new Date(transaction.timestamp)
  const isWallet = transaction.paymentMethod === 'wallet'
  const failed = transaction.status === 'failed'

  const receiptLines = [
    'PayXpress Receipt',
    '================',
    `Reference: ${transaction.reference}`,
    `Biller: ${transaction.description}`,
    `Amount: ${formatCurrency(transaction.amount)}`,
    `Method: ${methodLabel(transaction.paymentMethod)}`,
    `Date: ${timestamp.toLocaleString('en-NG')}`,
    `Status: ${transaction.status}`,
  ].join('\n')

  const handleDownload = () => {
    const blob = new Blob([receiptLines], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${transaction.reference}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PayXpress Receipt', text: receiptLines })
        return
      } catch {
        // user dismissed the share sheet — fall through to clipboard
      }
    }
    navigator.clipboard.writeText(receiptLines)
  }

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Reference', value: transaction.reference, mono: true },
    { label: 'Biller', value: transaction.description },
    { label: 'Payment method', value: methodLabel(transaction.paymentMethod) },
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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="relative w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto safe-bottom"
      >
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
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
                transition={{ type: 'spring', damping: 16, stiffness: 300, delay: 0.1 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  failed ? 'bg-destructive/10' : 'bg-primary-tint'
                }`}
              >
                {failed ? (
                  <X size={30} className="text-destructive" strokeWidth={2.5} />
                ) : (
                  <Check size={30} className="text-primary" strokeWidth={2.5} />
                )}
              </motion.div>

              <p className="text-xs text-muted-foreground mb-1.5 capitalize">
                {failed ? 'Payment failed' : `Payment ${transaction.status}`}
              </p>
              <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
                {formatCurrency(transaction.amount)}
              </p>

              <span
                className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isWallet ? 'bg-primary-tint text-primary' : 'bg-accent-tint text-accent'
                }`}
              >
                {isWallet ? <Wallet size={12} /> : <CreditCard size={12} />}
                {methodLabel(transaction.paymentMethod)}
              </span>
            </div>

            <div className="px-5 py-5 space-y-3.5">
              {rows.map((row) => (
                <div key={row.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-muted-foreground flex-shrink-0">{row.label}</span>
                  <span
                    className={`text-sm font-semibold text-foreground text-right break-all ${
                      row.mono ? 'font-mono text-xs' : ''
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleDownload}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <Download size={18} className="text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Download</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleShare}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <Share2 size={18} className="text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Share</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigator.clipboard.writeText(transaction.reference)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <Copy size={18} className="text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Copy ref</span>
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
    </div>
  )
}
