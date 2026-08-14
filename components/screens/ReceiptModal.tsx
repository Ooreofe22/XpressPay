'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, Clock, Download, Share2, X, XCircle, Wallet, CreditCard } from 'lucide-react'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  /** Optional biller/merchant name when the caller knows it. */
  billerName?: string
  onClose: () => void
}

const METHOD_LABEL: Record<'wallet' | 'paystack', string> = {
  wallet: 'Wallet balance',
  paystack: 'Paystack',
}

export function ReceiptModal({ transaction, billerName, onClose }: ReceiptModalProps) {
  const timestamp =
    transaction.timestamp instanceof Date ? transaction.timestamp : new Date(transaction.timestamp)

  const status = transaction.status
  const method = transaction.paymentMethod

  const receiptLines = [
    'PayXpress Receipt',
    '================',
    `Reference: ${transaction.reference}`,
    billerName ? `Biller: ${billerName}` : null,
    `Description: ${transaction.description}`,
    `Amount: ${formatCurrency(transaction.amount)}`,
    method ? `Payment method: ${METHOD_LABEL[method]}` : null,
    `Date: ${timestamp.toLocaleString('en-NG')}`,
    `Status: ${status}`,
  ].filter(Boolean) as string[]

  const handleDownload = () => {
    const blob = new Blob([receiptLines.join('\n')], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${transaction.reference}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const shareText = receiptLines.slice(2).join('\n')
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PayXpress Receipt', text: shareText })
      } catch {
        // user dismissed the share sheet — nothing to recover from
      }
      return
    }
    navigator.clipboard.writeText(shareText)
  }

  const statusStyles =
    status === 'completed'
      ? { wrap: 'bg-primary-tint', icon: <Check size={40} className="text-primary" strokeWidth={2.5} />, text: 'text-primary' }
      : status === 'failed'
        ? { wrap: 'bg-destructive/10', icon: <XCircle size={38} className="text-destructive" />, text: 'text-destructive' }
        : { wrap: 'bg-secondary', icon: <Clock size={36} className="text-muted-foreground" />, text: 'text-muted-foreground' }

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
        className="relative w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Receipt</h2>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            aria-label="Close receipt"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 pt-7 pb-6 text-center border-b border-dashed border-card-border">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 260, delay: 0.1 }}
              className={`w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-4 ${statusStyles.wrap}`}
            >
              {statusStyles.icon}
            </motion.div>

            <p className={`text-sm font-semibold capitalize ${statusStyles.text}`}>{status}</p>
            <p className="text-4xl font-bold text-foreground tracking-tight mt-2 tabular-nums">
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          <div className="px-5 py-5 space-y-3.5">
            {billerName && (
              <Row label="Biller" value={billerName} />
            )}
            <Row label="Description" value={transaction.description} />
            <Row label="Reference" value={transaction.reference} mono />
            <Row
              label="Date"
              value={timestamp.toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Row label="Time" value={timestamp.toLocaleTimeString('en-NG')} />
            {method && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-muted-foreground flex-shrink-0">Paid with</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {method === 'wallet' ? <Wallet size={14} /> : <CreditCard size={14} />}
                  {METHOD_LABEL[method]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ActionButton icon={<Download size={19} className="text-primary" />} label="Download" onClick={handleDownload} />
          <ActionButton icon={<Share2 size={19} className="text-primary" />} label="Share" onClick={handleShare} />
          <ActionButton
            icon={<span className="text-lg leading-none">⎇</span>}
            label="Copy ref"
            onClick={() => navigator.clipboard.writeText(transaction.reference)}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors elevation-1"
        >
          Done
        </motion.button>
      </motion.div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
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
      className="flex flex-col items-center gap-2 py-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
    >
      {icon}
      <span className="text-xs font-medium text-foreground">{label}</span>
    </motion.button>
  )
}
