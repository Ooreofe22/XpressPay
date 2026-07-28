'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Check, Download, Share2, X } from 'lucide-react'
import { Transaction } from '@/types'

interface ReceiptModalProps {
  transaction: Transaction
  onClose: () => void
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const handleDownload = () => {
    const receiptText = `
PayXpress Receipt
================
Reference: ${transaction.reference}
Description: ${transaction.description}
Amount: ₦${transaction.amount.toLocaleString()}
Date: ${transaction.timestamp.toLocaleString()}
Status: ${transaction.status}
    `.trim()

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${transaction.reference}.txt`
    a.click()
  }

  const handleShare = async () => {
    const shareText = `Transaction Receipt\nReference: ${transaction.reference}\nAmount: ₦${transaction.amount.toLocaleString()}\nStatus: ${transaction.status}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PayXpress Receipt',
          text: shareText,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Receipt copied to clipboard')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-40">
      <div className="w-full bg-background rounded-2xl rounded-b-none p-4 space-y-4 max-h-screen overflow-y-auto safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Transaction Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={24} className="text-foreground" />
          </button>
        </div>

        {/* Receipt Card */}
        <Card className="card-gradient border-success/20">
          <CardContent className="py-8 space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
                <Check size={48} className="text-success" />
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Transaction Status</p>
              <p className="text-2xl font-bold text-success capitalize">{transaction.status}</p>
            </div>

            {/* Amount */}
            <div className="text-center border-t border-b border-white/10 py-6">
              <p className="text-sm text-muted-foreground mb-2">Amount</p>
              <p className="text-4xl font-bold text-foreground">₦{transaction.amount.toLocaleString()}</p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="text-sm font-mono font-medium text-foreground">{transaction.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Description</span>
                <span className="text-sm font-medium text-foreground text-right">{transaction.description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm font-medium text-foreground">{transaction.timestamp.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-medium text-foreground">{transaction.timestamp.toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          <button className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
            <Download size={20} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Download</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Share2 size={20} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Share</span>
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(transaction.reference)}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <span className="text-xl">📋</span>
            <span className="text-xs font-medium text-foreground">Copy Ref</span>
          </button>
        </div>

        {/* Close Button */}
        <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
