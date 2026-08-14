'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Loader2, AlertCircle, Wallet, CreditCard, ChevronRight } from 'lucide-react'
import type { Biller, Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { validateBiller, initiateBillerCheckout, payBillFromWallet } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { ReceiptModal } from '@/components/screens/ReceiptModal'

interface BillPaymentFlowProps {
  biller: Biller
  onClose: () => void
  initialAccountNumber?: string
  initialAccountType?: 'prepaid' | 'postpaid'
}

type FlowStep = 'details' | 'confirm' | 'method' | 'debiting' | 'redirecting' | 'failed'
type PaymentMethod = 'wallet' | 'paystack'

const sheet = {
  initial: { y: 24, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -12, opacity: 0 },
}

export function BillPaymentFlow({
  biller,
  onClose,
  initialAccountNumber,
  initialAccountType,
}: BillPaymentFlowProps) {
  const { addBillerBeneficiary, refreshBalance, refreshTransactionHistory, user } = useApp()

  const isElectricity = biller.categoryPath === 'electricity'
  const isCable = biller.categoryPath === 'cable'
  const isAirtimeOrData = biller.categoryPath === 'airtime' || biller.categoryPath === 'data'
  const needsValidate = biller.requiresValidate

  const [step, setStep] = useState<FlowStep>('details')
  const [accountNumber, setAccountNumber] = useState(!isAirtimeOrData ? initialAccountNumber ?? '' : '')
  const [accountType, setAccountType] = useState<'prepaid' | 'postpaid'>(initialAccountType ?? 'prepaid')
  const [noOfMonth, setNoOfMonth] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState(isAirtimeOrData ? initialAccountNumber ?? '' : '')
  const [amount, setAmount] = useState('')
  const [validating, setValidating] = useState(false)
  const [validateError, setValidateError] = useState<string | null>(null)
  const [validatedName, setValidatedName] = useState<string | null>(null)
  const [validatedAddress, setValidatedAddress] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(true)
  const [method, setMethod] = useState<PaymentMethod>('wallet')
  const [receipt, setReceipt] = useState<Transaction | null>(null)

  // for cable, the amount is fixed by the package and returned from validate()
  const [validatedCableAmount, setValidatedCableAmount] = useState<string>('0')
  const displayAmount = isCable && validatedName ? Number(validatedCableAmount) : Number(amount || 0)

  const identifierLabel = isElectricity ? 'Meter number' : isCable ? 'Smartcard number' : 'Phone number'
  const identifier = isAirtimeOrData ? phoneNumber : accountNumber

  const canSubmitDetails = isAirtimeOrData
    ? phoneNumber.length >= 10 && Number(amount) > 0
    : accountNumber.length >= 5

  const balance = user?.accountBalance ?? 0
  const insufficientBalance = displayAmount > balance

  const buildDetails = (): Record<string, unknown> =>
    isElectricity
      ? { accountNumber, accountType, name: validatedName, address: validatedAddress }
      : isCable
        ? { accountNumber, accountType: 'smartcard', noOfMonth, name: validatedName, phoneNumber }
        : { phoneNumber }

  // Persisting the beneficiary must be awaited before any navigation, otherwise
  // the in-flight POST is cancelled by the redirect and never reaches the server.
  const persistBeneficiary = async () => {
    if (!saveAsBeneficiary) return
    try {
      await addBillerBeneficiary({
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${biller.uniqueCode}-${identifier}-${Date.now()}`,
        billerUniqueCode: biller.uniqueCode,
        billerName: biller.name,
        billerCategoryPath: biller.categoryPath,
        accountNumber: identifier,
        accountType: isElectricity ? accountType : undefined,
        label: validatedName || `${biller.name} • ${identifier}`,
      })
    } catch (err) {
      // never block a payment because a convenience save failed
      console.error('Could not save beneficiary:', err)
    }
  }

  const handleDetailsSubmit = async () => {
    if (!needsValidate) {
      setStep('confirm')
      return
    }

    setValidating(true)
    setValidateError(null)
    try {
      const result = await validateBiller({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        accountNumber,
        accountType: isElectricity ? accountType : undefined,
        noOfMonth: isCable ? noOfMonth : undefined,
      })

      if (!result.valid) {
        setValidateError(result.message || 'Could not validate this account. Check the number and try again.')
        return
      }

      setValidatedName(result.name || null)
      setValidatedAddress(result.address || null)
      if (isCable && result.amount) setValidatedCableAmount(result.amount)
      setStep('confirm')
    } catch (err) {
      setValidateError(err instanceof Error ? err.message : 'Validation failed. Please try again.')
    } finally {
      setValidating(false)
    }
  }

  // ── Wallet path (new) ───────────────────────────────────────────
  const handleWalletPay = async () => {
    setStep('debiting')
    setPayError(null)
    try {
      const tx = await payBillFromWallet({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details: buildDetails(),
      })

      await persistBeneficiary()

      // Balance moved server-side — pull the authoritative figure and history
      await Promise.all([refreshBalance(), refreshTransactionHistory()])

      setReceipt({
        ...tx,
        timestamp: new Date(tx.timestamp),
        paymentMethod: 'wallet',
      })
    } catch (err) {
      // 402 → "Insufficient balance", 400 → "Payment failed: <reason>"
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setStep('failed')
    }
  }

  // ── Paystack path (unchanged behaviour) ──────────────────────────────
  const handlePaystackPay = async () => {
    setStep('redirecting')
    setPayError(null)
    try {
      const result = await initiateBillerCheckout({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details: buildDetails(),
      })

      await persistBeneficiary()

      // User leaves the app here and returns via the server-configured
      // callback_url → /bills/callback (see app/bills/callback/page.tsx)
      window.location.href = result.authorizationUrl
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not start payment. Please try again.')
      setStep('failed')
    }
  }

  if (receipt) {
    return <ReceiptModal transaction={receipt} onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-40">
      <motion.div
        initial={{ y: '100%', opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full sm:max-w-sm bg-background sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        <AnimatePresence mode="wait" initial={false}>
          {/* ── DETAILS ────────────────────────────────────── */}
          {step === 'details' && (
            <motion.div key="details" {...sheet} transition={{ duration: 0.22 }}>
              <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-card-border">
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowLeft size={19} />
                </button>
                <p className="text-sm font-bold text-foreground">{biller.name}</p>
                <div className="w-9" />
              </div>

              <div className="px-5 pt-5 pb-6 space-y-4">
                {isElectricity && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Meter number
                      </label>
                      <input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 0101160313181"
                        className="w-full h-12 px-4 bg-card border border-card-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Meter type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['prepaid', 'postpaid'] as const).map((t) => (
                          <motion.button
                            key={t}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setAccountType(t)}
                            className={`h-11 rounded-lg text-sm font-semibold capitalize border transition-colors ${
                              accountType === t
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-card border-card-border text-muted-foreground'
                            }`}
                          >
                            {t}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {isCable && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Smartcard number
                      </label>
                      <input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 2004484048"
                        className="w-full h-12 px-4 bg-card border border-card-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Number of months
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setNoOfMonth((n) => Math.max(1, n - 1))}
                          aria-label="Fewer months"
                          className="w-10 h-10 rounded-lg border border-card-border text-muted-foreground font-bold"
                        >
                          −
                        </button>
                        <span className="text-base font-bold text-foreground w-6 text-center tabular-nums">
                          {noOfMonth}
                        </span>
                        <button
                          onClick={() => setNoOfMonth((n) => n + 1)}
                          aria-label="More months"
                          className="w-10 h-10 rounded-lg border border-card-border text-muted-foreground font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Phone number for notifications
                      </label>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        placeholder="080 1234 5678"
                        className="w-full h-12 px-4 bg-card border border-card-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                      />
                    </div>
                  </>
                )}

                {isAirtimeOrData && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Phone number
                      </label>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        placeholder="080 1234 5678"
                        className="w-full h-12 px-4 bg-card border border-card-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Amount
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['100', '500', '1000'].map((v) => (
                          <motion.button
                            key={v}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setAmount(v)}
                            className={`h-11 rounded-lg text-sm font-semibold border transition-colors ${
                              amount === v
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-card border-card-border text-muted-foreground'
                            }`}
                          >
                            ₦{v}
                          </motion.button>
                        ))}
                      </div>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                        placeholder="Or enter a custom amount"
                        className="w-full h-12 mt-2 px-4 bg-card border border-card-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                      />
                    </div>
                  </>
                )}

                {validateError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>{validateError}</span>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDetailsSubmit}
                  disabled={!canSubmitDetails || validating}
                  className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
                >
                  {validating && <Loader2 size={16} className="animate-spin" />}
                  {validating ? 'Validating…' : needsValidate ? 'Validate' : 'Continue'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── CONFIRM ────────────────────────────────────── */}
          {step === 'confirm' && (
            <motion.div key="confirm" {...sheet} transition={{ duration: 0.22 }}>
              <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-card-border">
                <button
                  onClick={() => setStep('details')}
                  aria-label="Back"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowLeft size={19} />
                </button>
                <p className="text-sm font-bold text-foreground">Confirm details</p>
                <div className="w-9" />
              </div>

              <div className="px-5 pt-5 pb-6 space-y-5">
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground mb-1">You&apos;re paying</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
                    {formatCurrency(displayAmount)}
                  </p>
                </div>

                <div className="glass rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-muted-foreground">Biller</span>
                    <span className="text-sm font-semibold text-foreground text-right">{biller.name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{identifierLabel}</span>
                    <span className="text-sm font-semibold text-foreground font-mono text-right">
                      {identifier}
                    </span>
                  </div>
                  {validatedName && (
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-muted-foreground">Name</span>
                      <span className="text-sm font-semibold text-foreground text-right">{validatedName}</span>
                    </div>
                  )}
                  {validatedAddress && (
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-muted-foreground">Address</span>
                      <span className="text-sm font-medium text-foreground text-right">{validatedAddress}</span>
                    </div>
                  )}
                  {isCable && (
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-muted-foreground">Months</span>
                      <span className="text-sm font-semibold text-foreground">{noOfMonth}</span>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsBeneficiary}
                    onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    Save this {identifierLabel.toLowerCase()} for next time
                  </span>
                </label>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('method')}
                  className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors elevation-1"
                >
                  Choose payment method
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── METHOD ─────────────────────────────────────── */}
          {step === 'method' && (
            <motion.div key="method" {...sheet} transition={{ duration: 0.22 }}>
              <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-card-border">
                <button
                  onClick={() => setStep('confirm')}
                  aria-label="Back"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowLeft size={19} />
                </button>
                <p className="text-sm font-bold text-foreground">How do you want to pay?</p>
                <div className="w-9" />
              </div>

              <div className="px-5 pt-5 pb-6 space-y-3">
                {/* Pay with Balance */}
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setMethod('wallet')}
                  aria-pressed={method === 'wallet'}
                  className={`relative w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-colors ${
                    method === 'wallet'
                      ? 'border-primary bg-primary-tint/60'
                      : 'border-card-border bg-card hover:border-primary/30'
                  }`}
                >
                  {method === 'wallet' && (
                    <motion.span
                      layoutId="method-ring"
                      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                      className="absolute inset-0 rounded-2xl ring-2 ring-primary pointer-events-none"
                    />
                  )}
                  <span className="w-11 h-11 rounded-xl bg-primary-tint flex items-center justify-center flex-shrink-0">
                    <Wallet size={20} className="text-primary" strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground">Pay with Balance</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(balance)} available
                    </span>
                  </span>
                </motion.button>

                {/* Pay with Paystack */}
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setMethod('paystack')}
                  aria-pressed={method === 'paystack'}
                  className={`relative w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-colors ${
                    method === 'paystack'
                      ? 'border-primary bg-primary-tint/60'
                      : 'border-card-border bg-card hover:border-primary/30'
                  }`}
                >
                  {method === 'paystack' && (
                    <motion.span
                      layoutId="method-ring"
                      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                      className="absolute inset-0 rounded-2xl ring-2 ring-primary pointer-events-none"
                    />
                  )}
                  <span className="w-11 h-11 rounded-xl bg-accent-tint flex items-center justify-center flex-shrink-0">
                    <CreditCard size={20} className="text-accent" strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground">Pay with Paystack</span>
                    <span className="block text-xs text-muted-foreground">Card, transfer or USSD</span>
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                </motion.button>

                <AnimatePresence>
                  {method === 'wallet' && insufficientBalance && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 text-warning text-xs">
                        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                        <span>
                          Your balance is short by{' '}
                          <strong className="font-semibold">
                            {formatCurrency(displayAmount - balance)}
                          </strong>
                          . Use Paystack instead, or top up first.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {formatCurrency(displayAmount)}
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={method === 'wallet' ? handleWalletPay : handlePaystackPay}
                  disabled={method === 'wallet' && insufficientBalance}
                  className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1"
                >
                  {method === 'wallet'
                    ? `Pay ${formatCurrency(displayAmount)}`
                    : 'Continue to Paystack'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── IN FLIGHT ─────────────────────────────────── */}
          {(step === 'debiting' || step === 'redirecting') && (
            <motion.div
              key="inflight"
              {...sheet}
              transition={{ duration: 0.22 }}
              className="px-6 py-16 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-5">
                <Loader2 size={28} className="text-primary animate-spin" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">
                {step === 'debiting' ? 'Paying from your balance' : 'Opening Paystack'}
              </p>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                {step === 'debiting'
                  ? 'Hold on while we complete this payment — don\u2019t close this window.'
                  : 'Redirecting you to complete payment securely.'}
              </p>
            </motion.div>
          )}

          {/* ── FAILED ─────────────────────────────────────── */}
          {step === 'failed' && (
            <motion.div
              key="failed"
              {...sheet}
              transition={{ duration: 0.22 }}
              className="px-6 py-14 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                <AlertCircle size={28} className="text-destructive" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">Payment didn&apos;t go through</p>
              <p className="text-sm text-muted-foreground max-w-[260px] mb-7">{payError}</p>
              <div className="w-full space-y-2.5">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('method')}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  Try another method
                </motion.button>
                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-xl bg-card border border-card-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
