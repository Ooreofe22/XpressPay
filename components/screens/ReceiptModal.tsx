'use client'

import React from 'react'
import { Check, Download, Share2, X, Wallet, CreditCard, ReceiptText } from 'lucide-react'
import { Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ReceiptModalProps {
  transaction: Transaction
  onClose: () => void
  /** Biller name when known (bill payments); falls back to description. */
  billerName?: string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wallet: 'Wallet balance',
  paystack: 'Paystack',
  card: 'Card',
  transfer: 'Bank transfer',
}

export function ReceiptModal({ transaction, onClose, billerName }: ReceiptModalProps) {
  const isSuccess = transaction.status === 'completed'
  const methodLabel = transaction.paymentMethod
      ? PAYMENT_METHOD_LABELS[transaction.paymentMethod] ?? transaction.paymentMethod
      : null
  const billerLabel = billerName ?? transaction.recipient ?? transaction.description

  const receiptText = `
PayXpress Receipt
================
Reference: ${transaction.reference}
Biller: ${billerLabel}
Amount: ${formatCurrency(transaction.amount)}
Date: ${new Date(transaction.timestamp).toLocaleString()}
Status: ${transaction.status}
${methodLabel ? `Payment method: ${methodLabel}` : ''}
  `.trim()

  const handleDownload = () => {
    const blob = new Blob([receiptText], { type: 'text/plain' })
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
        await navigator.share({ title: 'PayXpress Receipt', text: receiptText })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(receiptText)
      alert('Receipt copied to clipboard')
    }
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Reference', value: <span className="font-mono">{transaction.reference}</span> },
    { label: 'Biller', value: billerLabel },
    {
      label: 'Date',
      value: new Date(transaction.timestamp).toLocaleDateString('en-NG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    {
      label: 'Time',
      value: new Date(transaction.timestamp).toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      label: 'Status',
      value: (
          <span className={`capitalize font-semibold ${isSuccess ? 'text-success' : 'text-destructive'}`}>
            {transaction.status}
          </span>
      ),
    },
  ]
  if (methodLabel) {
    rows.push({
      label: 'Payment method',
      value: (
          <span className="inline-flex items-center gap-1.5">
            {transaction.paymentMethod === 'wallet' ? <Wallet size={13} /> : <CreditCard size={13} />}
            {methodLabel}
          </span>
      ),
    })
  }

  return (
      <div className="fixed inset-0 bg-black/50 ambient-blooms flex items-end sm:items-center sm:justify-center z-40">
        <div className="w-full sm:max-w-sm glass-panel sm:rounded-2xl rounded-t-2xl p-5 space-y-5 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Transaction Receipt</h2>
            <button
                onClick={onClose}
                aria-label="Close receipt"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Receipt body */}
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden elevation-1">
            <div className="py-7 px-5 text-center space-y-4 border-b border-dashed border-card-border">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  isSuccess ? 'bg-primary-tint' : 'bg-destructive/10'
              }`}>
                {isSuccess ? (
                    <Check size={32} className="text-success" strokeWidth={2.5} />
                ) : (
                    <ReceiptText size={28} className="text-destructive" strokeWidth={2} />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {isSuccess ? 'Payment successful' : `Payment ${transaction.status}`}
                </p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3.5">
              {rows.map((row) => (
                  <div key={row.label} className="flex justify-between items-center gap-4">
                    <span className="text-xs text-muted-foreground flex-shrink-0">{row.label}</span>
                    <span className="text-sm font-medium text-foreground text-right truncate">{row.value}</span>
                  </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
                onClick={handleDownload}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <Download size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Download</span>
            </button>
            <button
                onClick={handleShare}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <Share2 size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Share</span>
            </button>
            <button
                onClick={() => navigator.clipboard.writeText(transaction.reference)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
            >
              <ReceiptText size={18} className="text-primary" />
              <span className="text-xs font-medium text-foreground">Copy ref</span>
            </button>
          </div>

          <button
              onClick={onClose}
              className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] elevation-1"
          >
            Done
          </button>
        </div>
      </div>
  )
}
