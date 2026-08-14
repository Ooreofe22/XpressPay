'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, Download, Share2, X, Wallet, CreditCard } from 'lucide-react'
import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  onClose: () => void
}

const STATUS_COPY: Record<Transaction['status'], string> = {
  completed: 'Successful',
  pending: 'Processing',
  failed: 'Failed',
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const timestamp = new Date(transaction.timestamp)
  const isWallet = transaction.paymentMethod === 'wallet'
  const methodLabel = isWallet ? 'Wallet balance' : 'Paystack'

  const statusTone =
    transaction.status === 'completed'
      ? 'text-primary'
      : transaction.status === 'failed'
        ? 'text-destructive'
        : 'text-warning'

  const handleDownload = () => {
    const receiptText = `
PayXpress Receipt
=================
Reference:      ${transaction.reference}
Biller:         ${transaction.description}
Amount:         ${formatCurrency(transaction.amount)}
Payment method: ${methodLabel}
Date:           ${timestamp.toLocaleString('en-NG')}
Status:         ${STATUS_COPY[transaction.status]}
    `.trim()

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payxpress-receipt-${transaction.reference}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const shareText = `PayXpress receipt\n${transaction.description}\n${formatCurrency(
      transaction.amount
    )}\nRef: ${transaction.reference}\nStatus: ${STATUS_COPY[transaction.status]}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'PayXpress Receipt', text: shareText })
      } catch {
        // user dismissed the share sheet — nothing to recover from
      }
    } else {
      navigator.clipboard.writeText(shareText)
    }
  }

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
        className="relative w-full sm:max-w-sm max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-background"
      >
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Receipt</h2>
          <button
            onClick={onClose}
            aria-label="Close receipt"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-5 pb-6">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 pt-8 pb-6 text-center border-b border-dashed border-card-border">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 240, delay: 0.1 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  transaction.status === 'completed' ? 'bg-primary-tint' : 'bg-secondary'
                }`}
              >
                <Check
                  size={30}
                  strokeWidth={2.5}
                  className={transaction.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}
                />
              </motion.div>

              <p className={`text-sm font-semibold mb-1 ${statusTone}`}>
                {STATUS_COPY[transaction.status]}
              </p>
              <p className="text-4xl font-bold text-foreground tracking-tight tabular-nums">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="px-6 py-5 space-y-3.5">
              <Row label="Biller" value={transaction.description} />
              <Row label="Reference" value={transaction.reference} mono />
              <Row
                label="Date"
                value={timestamp.toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              />
              <Row label="Time" value={timestamp.toLocaleTimeString('en-NG')} />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground flex-shrink-0">Payment method</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {isWallet ? (
                    <Wallet size={14} className="text-primary" />
                  ) : (
                    <CreditCard size={14} className="text-accent" />
                  )}
                  {methodLabel}
                </span>
              </div>
              <Row label="Status" value={STATUS_COPY[transaction.status]} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <ActionButton icon={<Download size={18} />} label="Download" onClick={handleDownload} />
            <ActionButton icon={<Share2 size={18} />} label="Share" onClick={handleShare} />
            <ActionButton
              icon={<span className="text-base leading-none">⌗</span>}
              label="Copy ref"
              onClick={() => navigator.clipboard.writeText(transaction.reference)}
            />
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span
        className={`text-sm font-semibold text-foreground text-right ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 py-3 rounded-xl bg-card border border-card-border text-primary hover:border-primary/30 transition-colors"
    >
      {icon}
      <span className="text-xs font-medium text-foreground">{label}</span>
    </motion.button>
  )
}
