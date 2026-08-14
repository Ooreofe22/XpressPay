'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Loader2, AlertCircle, Wallet, CreditCard, Check } from 'lucide-react'
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

type FlowStep = 'details' | 'confirm' | 'redirecting' | 'debiting' | 'receipt'
type PaymentMethod = 'wallet' | 'paystack'

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
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(true)
  const [method, setMethod] = useState<PaymentMethod>('wallet')
  const [receipt, setReceipt] = useState<Transaction | null>(null)

  // for cable, the amount is fixed by the package and returned from validate()
  const [validatedCableAmount, setValidatedCableAmount] = useState<string>('0')
  const displayAmount = isCable && validatedName ? Number(validatedCableAmount) : Number(amount || 0)

  const identifierLabel = isElectricity ? 'Meter number' : isCable ? 'Smartcard number' : 'Phone number'
  const identifier = isAirtimeOrData ? phoneNumber : accountNumber

  const balance = user?.accountBalance ?? 0
  const insufficientBalance = method === 'wallet' && displayAmount > balance

  const canSubmitDetails = isAirtimeOrData
    ? phoneNumber.length >= 10 && Number(amount) > 0
    : accountNumber.length >= 5

  const buildDetails = (): Record<string, unknown> =>
    isElectricity
      ? { accountNumber, accountType, name: validatedName, address: validatedAddress }
      : isCable
        ? { accountNumber, accountType: 'smartcard', noOfMonth, name: validatedName, phoneNumber }
        : { phoneNumber }

  const persistBeneficiary = async () => {
    if (!saveAsBeneficiary) return
    const label = validatedName || `${biller.name} • ${identifier}`
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
        label,
      })
    } catch (err) {
      // never block a payment because saving the beneficiary failed
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

  // ── Wallet path: debit → receipt, no redirect ────────────────────
  const handleWalletPay = async () => {
    setPaying(true)
    setPayError(null)
    setStep('debiting')
    try {
      const tx = await payBillFromWallet({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details: buildDetails(),
      })

      await persistBeneficiary()

      const normalized: Transaction = {
        ...tx,
        timestamp: tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp),
        paymentMethod: 'wallet',
      }

      setReceipt(normalized)
      setStep('receipt')

      // balance and history both change as a result of this debit
      refreshBalance()
      refreshTransactionHistory()
    } catch (err) {
      // 402 → "Insufficient balance", 400 → "Payment failed: <reason>"
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setStep('confirm')
    } finally {
      setPaying(false)
    }
  }

  // ── Paystack path: unchanged behaviour ─────────────────────────
  const handlePaystackPay = async () => {
    setPaying(true)
    setPayError(null)
    try {
      const result = await initiateBillerCheckout({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details: buildDetails(),
      })

      // Must await this — it fires a POST to the backend. Without awaiting, the
      // window.location.href redirect below cancels the in-flight request
      // before the server ever receives it.
      await persistBeneficiary()

      setStep('redirecting')
      // Paystack's checkout page — user leaves the app here and comes back via
      // the callback_url configured server-side, which points at /bills/callback.
      window.location.href = result.authorizationUrl
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not start payment. Please try again.')
      setPaying(false)
    }
  }

  const handlePay = () => (method === 'wallet' ? handleWalletPay() : handlePaystackPay())

  if (step === 'receipt' && receipt) {
    return <ReceiptModal transaction={receipt} billerName={biller.name} onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="relative w-full sm:max-w-sm bg-background sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        {/* ── DETAILS ───────────────────────────────────── */}
        {step === 'details' && (
          <div>
            <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-card-border">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft size={19} />
              </motion.button>
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
                        className="w-10 h-10 rounded-lg border border-card-border text-muted-foreground font-bold"
                      >
                        −
                      </button>
                      <span className="text-base font-bold text-foreground w-6 text-center tabular-nums">
                        {noOfMonth}
                      </span>
                      <button
                        onClick={() => setNoOfMonth((n) => n + 1)}
                        className="w-10 h-10 rounded-lg border border-card-border text-muted-foreground font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Phone number for notifications</p>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="080 1234 5678"
                    className="w-full h-12 px-4 bg-card border border-card-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                  />
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
          </div>
        )}

        {/* ── CONFIRM + METHOD SELECTOR ──────────────────────── */}
        {step === 'confirm' && (
          <div>
            <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-card-border">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setStep('details')}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft size={19} />
              </motion.button>
              <p className="text-sm font-bold text-foreground">Confirm payment</p>
              <div className="w-9" />
            </div>

            <div className="px-5 pt-5 pb-6 space-y-5">
              <div className="glass rounded-xl p-4 space-y-3">
                <SummaryRow label="Biller" value={biller.name} />
                <SummaryRow label={identifierLabel} value={identifier} />
                {validatedName && <SummaryRow label="Customer" value={validatedName} />}
                {validatedAddress && <SummaryRow label="Address" value={validatedAddress} />}
                <div className="flex justify-between items-center pt-1 border-t border-card-border">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="text-base font-bold text-primary tabular-nums">
                    {formatCurrency(displayAmount)}
                  </span>
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Payment method
                </p>

                <MethodOption
                  active={method === 'wallet'}
                  onSelect={() => setMethod('wallet')}
                  icon={<Wallet size={19} />}
                  title="Pay with Balance"
                  subtitle={`${formatCurrency(balance)} available`}
                  warning={insufficientBalance ? 'Not enough balance for this payment' : undefined}
                />

                <MethodOption
                  active={method === 'paystack'}
                  onSelect={() => setMethod('paystack')}
                  icon={<CreditCard size={19} />}
                  title="Pay with Paystack"
                  subtitle="Card, bank transfer or USSD"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsBeneficiary}
                  onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                  className="w-4 h-4 rounded border-card-border text-primary focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground">
                  Save this {identifierLabel.toLowerCase()} for next time
                </span>
              </label>

              {payError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{payError}</span>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePay}
                disabled={paying || displayAmount <= 0 || insufficientBalance}
                className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
              >
                {paying && <Loader2 size={16} className="animate-spin" />}
                {paying
                  ? 'Processing…'
                  : method === 'wallet'
                    ? `Pay ${formatCurrency(displayAmount)}`
                    : 'Continue to Paystack'}
              </motion.button>
            </div>
          </div>
        )}

        {/* ── IN-FLIGHT STATES ────────────────────────────── */}
        <AnimatePresence>
          {(step === 'debiting' || step === 'redirecting') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 py-16 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-5">
                <Loader2 size={28} className="text-primary animate-spin" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">
                {step === 'debiting' ? 'Processing payment' : 'Redirecting to Paystack'}
              </p>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                {step === 'debiting'
                  ? 'Debiting your balance and sending it to the biller'
                  : 'Hold on while we hand you over to the secure checkout'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
  )
}

function MethodOption({
  active,
  onSelect,
  icon,
  title,
  subtitle,
  warning,
}: {
  active: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  warning?: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      aria-pressed={active}
      className={`relative w-full flex items-center gap-3.5 p-4 rounded-xl border text-left transition-colors ${
        active ? 'border-primary bg-primary-tint/60' : 'border-card-border bg-card hover:border-primary/30'
      }`}
    >
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          active ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
        }`}
      >
        {icon}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className={`block text-xs ${warning ? 'text-destructive' : 'text-muted-foreground'}`}>
          {warning ?? subtitle}
        </span>
      </span>

      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          active ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        }`}
      >
        <AnimatePresence>
          {active && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check size={12} className="text-white" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
