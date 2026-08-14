'use client'

import React, { useState } from 'react'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Wallet, CreditCard } from 'lucide-react'
import type { Biller, Transaction } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { validateBiller, initiateBillerCheckout, debitWalletForBillPayment } from '@/lib/api'
import { useApp } from '@/context/AppContext'
import { ReceiptModal } from '@/components/screens/ReceiptModal'

interface BillPaymentFlowProps {
  biller: Biller
  onClose: () => void
  initialAccountNumber?: string
  initialAccountType?: 'prepaid' | 'postpaid'
}

type FlowStep = 'details' | 'confirm' | 'redirecting'
type PaymentMethodChoice = 'wallet' | 'paystack'

export function BillPaymentFlow({
                                  biller,
                                  onClose,
                                  initialAccountNumber,
                                  initialAccountType,
                                }: BillPaymentFlowProps) {
  const { addBillerBeneficiary, user, refreshWalletBalance, refreshTransactionHistory } = useApp()
  const isElectricity = biller.categoryPath === 'electricity'
  const isCable = biller.categoryPath === 'cable'
  const isAirtimeOrData = biller.categoryPath === 'airtime' || biller.categoryPath === 'data'
  const needsValidate = biller.requiresValidate

  const [step, setStep] = useState<FlowStep>('details')
  const [accountNumber, setAccountNumber] = useState(!isAirtimeOrData ? initialAccountNumber ?? '' : '')
  const [accountType, setAccountType] = useState<'prepaid' | 'postpaid'>(
      initialAccountType ?? 'prepaid'
  )
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

  // Payment method — wallet debit is the new path; Paystack is byte-for-byte
  // the flow that already existed (initiate → redirect to authorizationUrl).
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice>('wallet')
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null)

  // for cable, the amount is fixed by the package and returned from validate()
  const [validatedCableAmount, setValidatedCableAmount] = useState<string>('0')
  const displayAmount = isCable && validatedName ? Number(validatedCableAmount) : Number(amount || 0)

  const identifierLabel = isElectricity ? 'Meter number' : isCable ? 'Smartcard number' : 'Phone number'
  const insufficientBalance = user !== null && displayAmount > user.accountBalance

  const canSubmitDetails = isAirtimeOrData
      ? phoneNumber.length >= 10 && Number(amount) > 0
      : accountNumber.length >= 5

  const buildDetails = (): Record<string, unknown> =>
      isElectricity
          ? { accountNumber, accountType, name: validatedName, address: validatedAddress }
          : isCable
              ? { accountNumber, accountType: 'smartcard', noOfMonth, name: validatedName, phoneNumber }
              : { phoneNumber }

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

  const maybeSaveBeneficiary = async () => {
    const identifier = isAirtimeOrData ? phoneNumber : accountNumber
    const label = validatedName || `${biller.name} • ${identifier}`

    // Must await this — it fires a POST to the backend. Without awaiting,
    // the Paystack redirect fires immediately and cancels the in-flight
    // request before the server ever receives it.
    if (saveAsBeneficiary) {
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
        // don't block the payment if saving the beneficiary fails
        console.error('Could not save beneficiary:', err)
      }
    }
  }

  const handlePay = async () => {
    setPaying(true)
    setPayError(null)
    try {
      if (paymentMethod === 'wallet') {
        // ── Pay with Balance: confirm → debit → receipt, no redirect ──
        const tx = await debitWalletForBillPayment({
          uniqueCode: biller.uniqueCode,
          categoryPath: biller.categoryPath,
          amount: displayAmount,
          details: buildDetails(),
        })
        await maybeSaveBeneficiary()
        refreshWalletBalance()
        refreshTransactionHistory()
        setCompletedTx(tx)
        return
      }

      // ── Paystack: unchanged from the existing flow ──
      const result = await initiateBillerCheckout({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details: buildDetails(),
      })

      await maybeSaveBeneficiary()

      setStep('redirecting')
      // Paystack's checkout page — user leaves the app here and comes back via
      // the callback_url configured server-side (paystack.callback.url), which
      // should point at /bills/callback in this app. See app/bills/callback/page.tsx
      window.location.href = result.authorizationUrl
    } catch (err) {
      const status = (err as { status?: number })?.status
      if (status === 402) {
        setPayError('Insufficient wallet balance — top up or pay with Paystack instead.')
      } else {
        setPayError(err instanceof Error ? err.message : 'Could not complete payment. Please try again.')
      }
      setPaying(false)
    }
  }

  // Wallet payment completed → same receipt UX as the rest of the app
  if (completedTx) {
    return (
        <ReceiptModal
            transaction={completedTx}
            billerName={biller.name}
            onClose={onClose}
        />
    )
  }

  return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-40">
        <div className="w-full sm:max-w-sm bg-background sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[92vh] overflow-y-auto">

          {/* ── DETAILS ───────────────────────────────────────────── */}
          {step === 'details' && (
              <div>
                <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-card-border">
                  <button
                      onClick={onClose}
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
                                <button
                                    key={t}
                                    onClick={() => setAccountType(t)}
                                    className={`h-11 rounded-lg text-sm font-semibold capitalize border transition-colors ${
                                        accountType === t
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'bg-card border-card-border text-muted-foreground'
                                    }`}
                                >
                                  {t}
                                </button>
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
                            <span className="text-base font-bold text-foreground w-6 text-center">{noOfMonth}</span>
                            <button
                                onClick={() => setNoOfMonth((n) => n + 1)}
                                className="w-10 h-10 rounded-lg border border-card-border text-muted-foreground font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Phone number for notifications
                        </p>
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
                                <button
                                    key={v}
                                    onClick={() => setAmount(v)}
                                    className={`h-11 rounded-lg text-sm font-semibold border transition-colors ${
                                        amount === v
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'bg-card border-card-border text-muted-foreground'
                                    }`}
                                >
                                  ₦{v}
                                </button>
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

                  <button
                      onClick={handleDetailsSubmit}
                      disabled={!canSubmitDetails || validating}
                      className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
                  >
                    {validating && <Loader2 size={16} className="animate-spin" />}
                    {validating ? 'Validating…' : needsValidate ? 'Validate' : 'Continue'}
                  </button>
                </div>
              </div>
          )}

          {/* ── CONFIRM ───────────────────────────────────────────── */}
          {step === 'confirm' && (
              <div>
                <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-card-border">
                  <button
                      onClick={() => setStep('details')}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft size={19} />
                  </button>
                  <p className="text-sm font-bold text-foreground">Confirm payment</p>
                  <div className="w-9" />
                </div>

                <div className="px-5 pt-5 pb-6 space-y-5">
                  {/* Summary */}
                  <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Biller</span>
                      <span className="font-semibold text-foreground">{biller.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{identifierLabel}</span>
                      <span className="font-semibold text-foreground">
                        {isAirtimeOrData ? phoneNumber : accountNumber}
                      </span>
                    </div>
                    {validatedName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Customer</span>
                          <span className="font-semibold text-foreground text-right">{validatedName}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-card-border pt-3">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-foreground text-base">{formatCurrency(displayAmount)}</span>
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Pay with
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                          onClick={() => setPaymentMethod('wallet')}
                          className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                              paymentMethod === 'wallet'
                                  ? 'border-primary bg-primary-tint ring-1 ring-primary/30'
                                  : 'border-card-border bg-card hover:border-primary/30'
                          }`}
                      >
                        <Wallet size={18} className={paymentMethod === 'wallet' ? 'text-primary' : 'text-muted-foreground'} />
                        <span className="text-sm font-semibold text-foreground">Balance</span>
                        <span className="text-[11px] text-muted-foreground">
                          {user ? formatCurrency(user.accountBalance) : '—'} available
                        </span>
                      </button>
                      <button
                          onClick={() => setPaymentMethod('paystack')}
                          className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                              paymentMethod === 'paystack'
                                  ? 'border-primary bg-primary-tint ring-1 ring-primary/30'
                                  : 'border-card-border bg-card hover:border-primary/30'
                          }`}
                      >
                        <CreditCard size={18} className={paymentMethod === 'paystack' ? 'text-primary' : 'text-muted-foreground'} />
                        <span className="text-sm font-semibold text-foreground">Paystack</span>
                        <span className="text-[11px] text-muted-foreground">Card, bank, USSD</span>
                      </button>
                    </div>
                    {paymentMethod === 'wallet' && insufficientBalance && (
                        <p className="text-xs text-destructive font-medium mt-2">
                          Balance too low for this payment — pick Paystack instead.
                        </p>
                    )}
                  </div>

                  {/* Save as beneficiary */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={saveAsBeneficiary}
                        onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">Save as beneficiary</span>
                  </label>

                  {payError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                        <span>{payError}</span>
                      </div>
                  )}

                  <button
                      onClick={handlePay}
                      disabled={paying || (paymentMethod === 'wallet' && insufficientBalance)}
                      className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
                  >
                    {paying && <Loader2 size={16} className="animate-spin" />}
                    {paying
                        ? paymentMethod === 'wallet'
                            ? 'Debiting wallet…'
                            : 'Starting payment…'
                        : paymentMethod === 'wallet'
                            ? `Pay ${formatCurrency(displayAmount)} from balance`
                            : `Pay ${formatCurrency(displayAmount)} with Paystack`}
                  </button>
                </div>
              </div>
          )}

          {/* ── REDIRECTING (Paystack) ─────────────────────────────── */}
          {step === 'redirecting' && (
              <div className="px-5 py-14 flex flex-col items-center text-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm font-semibold text-foreground">Redirecting to Paystack…</p>
                <p className="text-xs text-muted-foreground max-w-56">
                  You&apos;ll complete the payment on Paystack&apos;s secure page, then return here automatically.
                </p>
              </div>
          )}
        </div>
      </div>
  )
}

export { CheckCircle2 }
