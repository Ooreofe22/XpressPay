'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Check, Download, Share2, X, Wallet, CreditCard } from 'lucide-react'
import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  onClose: () => void
}

function methodLabel(method?: Transaction['paymentMethod']) {
  if (method === 'wallet') return 'Wallet balance'
  if (method === 'paystack') return 'Paystack'
  return '—'
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const timestamp = new Date(transaction.timestamp)
  const isCompleted = transaction.status === 'completed'

  const handleDownload = () => {
    const receiptText = `
PayXpress Receipt
================
Reference: ${transaction.reference}
Biller: ${transaction.description}
Amount: ${formatCurrency(transaction.amount)}
Payment method: ${methodLabel(transaction.paymentMethod)}
Date: ${timestamp.toLocaleString('en-NG')}
Status: ${transaction.status}
    `.trim()

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
        className="relative w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl p-4 space-y-4 max-h-[92vh] overflow-y-auto safe-bottom"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Transaction Receipt</h2>
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            aria-label="Close receipt"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={22} className="text-foreground" />
          </motion.button>
        </div>

        <Card className="card-gradient">
          <CardContent className="py-8 space-y-6">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 240, delay: 0.1 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-primary-tint' : 'bg-secondary'
                }`}
              >
                <Check size={44} className={isCompleted ? 'text-primary' : 'text-muted-foreground'} />
              </motion.div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Transaction status</p>
              <p
                className={`text-2xl font-bold capitalize ${
                  isCompleted ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {transaction.status}
              </p>
            </div>

            <div className="text-center border-t border-b border-dashed border-card-border py-6">
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <p className="text-4xl font-bold text-foreground tracking-tight">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-muted-foreground flex-shrink-0">Biller</span>
                <span className="text-sm font-medium text-foreground text-right">
                  {transaction.description}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-muted-foreground flex-shrink-0">Reference</span>
                <span className="text-xs font-mono font-medium text-foreground text-right break-all">
                  {transaction.reference}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payment method</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {transaction.paymentMethod === 'wallet' ? (
                    <Wallet size={14} className="text-primary" />
                  ) : transaction.paymentMethod === 'paystack' ? (
                    <CreditCard size={14} className="text-accent" />
                  ) : null}
                  {methodLabel(transaction.paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-medium text-foreground">
                  {timestamp.toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm font-medium text-foreground">
                  {timestamp.toLocaleTimeString('en-NG')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <motion.button
            onClick={handleDownload}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
          >
            <Download size={19} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Download</span>
          </motion.button>
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
          >
            <Share2 size={19} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Share</span>
          </motion.button>
          <motion.button
            onClick={() => navigator.clipboard.writeText(transaction.reference)}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-card-border hover:bg-secondary transition-colors"
          >
            <Check size={19} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Copy ref</span>
          </motion.button>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
          Done
        </Button>
      </motion.div>
    </div>
  )
}
