'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
  Search,
  ChevronRight,
  Plus,
  Loader2,
  CheckCircle2,
  Landmark,
  UserRound,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SendStep {
  recipient: string | null
  amount: number | null
  note: string
}

export function SendMoneyScreen() {
  const { bankContacts, user, addTransaction } = useApp()
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'success'>('select')
  const [sendData, setSendData] = useState<SendStep>({
    recipient: null,
    amount: null,
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [reference, setReference] = useState('')

  const selectedRecipient = bankContacts.find((c) => c.id === sendData.recipient)
  const filteredContacts = bankContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.accountNumber.includes(searchQuery)
  )

  const handleSelectRecipient = (recipientId: string) => {
    setSendData({ ...sendData, recipient: recipientId })
    setStep('amount')
  }

  const handleConfirm = async () => {
    if (!selectedRecipient || !sendData.amount) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const ref = `TXN${Date.now()}`
    addTransaction({
      id: Math.random().toString(),
      type: 'sent',
      recipient: selectedRecipient.name,
      amount: sendData.amount,
      description: `Transfer to ${selectedRecipient.name}`,
      timestamp: new Date(),
      status: 'completed',
      reference: ref,
    })

    setReference(ref)
    setLoading(false)
    setStep('success')
  }

  const handleDone = () => {
    setStep('select')
    setSendData({ recipient: null, amount: null, note: '' })
    setReference('')
  }

  const initialsOf = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()

  // ── STEP 1: Select recipient ─────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="flex-1 pb-24">
        {/* Search */}
        <div className="px-4 pt-4 pb-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search name or account number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-card border border-card-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
            />
          </div>
        </div>

        {/* Add New Recipient */}
        <div className="px-4 pb-5">
          <button className="w-full h-12 rounded-xl border border-dashed border-primary/40 bg-primary-tint/50 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-tint transition-colors active:scale-[0.98]">
            <Plus size={17} />
            Add New Recipient
          </button>
        </div>

        {/* Contacts List */}
        <div className="px-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Your Contacts
          </h3>
          {filteredContacts.length === 0 ? (
            <div className="bg-card border border-card-border rounded-2xl p-8 text-center elevation-1">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <UserRound size={22} className="text-muted-foreground" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No contacts found</p>
              <p className="text-xs text-muted-foreground">Try a different name or account number</p>
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-2xl divide-y divide-card-border elevation-1 overflow-hidden">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectRecipient(contact.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-xs">
                        {initialsOf(contact.name)}
                      </span>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Landmark size={11} />
                        {contact.bankName} · {contact.accountNumber}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={17} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── STEP 2: Amount entry ─────────────────────────────────────────────────
  if (step === 'amount' && selectedRecipient) {
    return (
      <div className="flex-1 pb-24 flex flex-col">
        <div className="flex-1">
          {/* Recipient Card */}
          <div className="px-4 pt-4">
            <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3 elevation-1">
              <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">
                  {initialsOf(selectedRecipient.name)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Send to</p>
                <p className="text-base font-bold text-foreground truncate">
                  {selectedRecipient.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedRecipient.bankName} · {selectedRecipient.accountNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="px-4 pt-8">
            <div className="text-center mb-8">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Enter amount
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-muted-foreground">₦</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={sendData.amount || ''}
                  onChange={(e) =>
                    setSendData({
                      ...sendData,
                      amount: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="0"
                  aria-label="Amount"
                  className="w-48 text-5xl font-bold text-center bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              {user && (
                <p className="text-xs text-muted-foreground mt-3">
                  Available balance:{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(user.accountBalance)}
                  </span>
                </p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-medium text-foreground block">
                Reference (optional)
              </label>
              <input
                id="note"
                type="text"
                placeholder="What's this for?"
                value={sendData.note}
                onChange={(e) => setSendData({ ...sendData, note: e.target.value })}
                className="w-full h-12 px-4 bg-card border border-card-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pt-8 pb-4 flex gap-3">
          <button
            onClick={() => setStep('select')}
            className="flex-1 h-13 rounded-xl border border-card-border bg-card text-foreground font-semibold text-base hover:bg-secondary transition-colors active:scale-[0.98]"
          >
            Back
          </button>
          <button
            onClick={() => setStep('confirm')}
            disabled={!sendData.amount || sendData.amount <= 0}
            className="flex-1 h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary-dark transition-all active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1"
          >
            Review
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 3: Confirm ──────────────────────────────────────────────────────
  if (step === 'confirm' && selectedRecipient && sendData.amount) {
    return (
      <div className="flex-1 pb-24 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-6">
          <div className="w-full bg-card border border-card-border rounded-2xl elevation-2 overflow-hidden">
            <div className="balance-gradient px-6 py-8 text-center">
              <p className="text-xs text-white/70 font-medium mb-2">You are sending</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                {formatCurrency(sendData.amount)}
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm font-semibold text-foreground">
                  {selectedRecipient.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bank</span>
                <span className="text-sm font-semibold text-foreground">
                  {selectedRecipient.bankName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Account</span>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {selectedRecipient.accountNumber}
                </span>
              </div>
              {sendData.note && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reference</span>
                  <span className="text-sm font-semibold text-foreground">{sendData.note}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-card-border">
                <span className="text-sm text-muted-foreground">Fee</span>
                <span className="text-sm font-semibold text-credit">Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-6 flex gap-3">
          <button
            onClick={() => setStep('amount')}
            disabled={loading}
            className="flex-1 h-13 rounded-xl border border-card-border bg-card text-foreground font-semibold text-base hover:bg-secondary transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-70 elevation-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 4: Success receipt ──────────────────────────────────────────────
  if (step === 'success' && selectedRecipient && sendData.amount) {
    return (
      <div className="flex-1 pb-24 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-6 animate-fade-up">
          <div className="w-full bg-card border border-card-border rounded-2xl elevation-2 overflow-hidden">
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={34} className="text-primary" strokeWidth={2} />
              </div>
              <p className="text-lg font-bold text-foreground mb-1">Transfer Successful</p>
              <p className="text-3xl font-bold text-foreground tracking-tight">
                {formatCurrency(sendData.amount)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                sent to {selectedRecipient.name}
              </p>
            </div>

            {/* Receipt-style dashed divider */}
            <div className="border-t border-dashed border-card-border mx-6" />

            <div className="px-6 py-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Bank</span>
                <span className="text-xs font-semibold text-foreground">
                  {selectedRecipient.bankName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Account</span>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {selectedRecipient.accountNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Reference</span>
                <span className="text-xs font-mono font-semibold text-foreground">{reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="text-xs font-semibold text-credit">Completed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 pt-6">
          <button
            onClick={handleDone}
            className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary-dark transition-all active:scale-[0.98] elevation-1"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return null
}
