'use client'

import React, { useState } from 'react'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Wallet, CreditCard, Check, X, ReceiptText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Biller } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { validateBiller, initiateBillerCheckout } from '@/lib/api'
import { payBillFromWallet } from '@/lib/auth-api'
import { useApp } from '@/context/AppContext'

interface BillPaymentFlowProps {
  biller: Biller
  onClose: () => void
  initialAccountNumber?: string
  initialAccountType?: 'prepaid' | 'postpaid'
}

type FlowStep = 'details' | 'confirm' | 'redirecting' | 'processing' | 'success' | 'failed'
type PaymentMethod = 'balance' | 'gateway'

export function BillPaymentFlow({
                                  biller,
                                  onClose,
                                  initialAccountNumber,
                                  initialAccountType,
                                }: BillPaymentFlowProps) {
  const router = useRouter()
  const { addBillerBeneficiary, user, refreshBalance, refreshTransactionHistory } = useApp()
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
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null)

  // for cable, the amount is fixed by the package and returned from validate()
  const [validatedCableAmount, setValidatedCableAmount] = useState<string>('0')
  const displayAmount = isCable && validatedName ? Number(validatedCableAmount) : Number(amount || 0)

  const identifierLabel = isElectricity ? 'Meter number' : isCable ? 'Smartcard number' : 'Phone number'

  const canSubmitDetails = isAirtimeOrData
      ? phoneNumber.length >= 10 && Number(amount) > 0
      : accountNumber.length >= 5

  // Default to Balance when there's enough to cover it, otherwise steer toward Gateway
  const hasEnoughBalance = (user?.accountBalance ?? 0) >= displayAmount && displayAmount > 0
  const [method, setMethod] = useState<PaymentMethod>('balance')

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

  const buildDetails = (): Record<string, unknown> =>
      isElectricity
          ? { accountNumber, accountType, name: validatedName, address: validatedAddress }
          : isCable
              ? { accountNumber, accountType: 'smartcard', noOfMonth, name: validatedName, phoneNumber }
              : { phoneNumber }

  const persistBeneficiaryIfNeeded = async () => {
    if (!saveAsBeneficiary) return
    const identifier = isAirtimeOrData ? phoneNumber : accountNumber
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
      // don't block the payment flow if saving the beneficiary fails
      console.error('Could not save beneficiary:', err)
    }
  }

  // ── Pay with Balance — resolves synchronously, no redirect ────────────
  const handlePayWithBalance = async () => {
    setPaying(true)
    setPayError(null)
    setStep('processing')
    try {
      const accessToken = localStorage.getItem('payxpress_access_token')
      if (!accessToken) throw new Error('Session expired — please log in again')

      const result = await payBillFromWallet(accessToken, {
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details: buildDetails(),
      })

      await persistBeneficiaryIfNeeded()
      await refreshBalance()
      await refreshTransactionHistory()

      if (result.status === 'FULFILLED') {
        setCompletedTransactionId(result.transactionId)
        setStep('success')
      } else {
        setPayError(result.billerResponseMessage || 'Payment could not be completed. Your balance was refunded.')
        setStep('failed')
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not complete payment. Please try again.')
      setStep('failed')
    } finally {
      setPaying(false)
    }
  }

  // ── Pay with Gateway — unchanged Paystack redirect flow ────────────────
  const handlePayWithGateway = async () => {
    setPaying(true)
    setPayError(null)
    try {
      const result = await initiateBillerCheckout({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details: buildDetails(),
      })

      // Must await this — it fires a POST to the backend. Without awaiting,
      // the window.location.href redirect below fires immediately and cancels
      // the in-flight request before the server ever receives it.
      await persistBeneficiaryIfNeeded()

      setStep('redirecting')
      // Paystack's checkout page — user leaves the app here and comes back via
      // the callback_url configured server-side (paystack.callback.url), which
      // should point at /bills/callback in this app. See app/bills/callback/page.tsx
      window.location.href = result.authorizationUrl
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not start payment. Please try again.')
      setPaying(false)
    }
  }

  const handlePay = () => {
    if (method === 'balance') {
      handlePayWithBalance()
    } else {
      handlePayWithGateway()
    }
  }

  const identifier = isAirtimeOrData ? phoneNumber : accountNumber

  return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-40">
        <div className="w-full sm:max-w-sm bg-background sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[85dvh] sm:max-h-[92dvh] overflow-y-auto overscroll-contain">

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

                <div className="px-5 pt-5 pb-6 space-y-5">
                  {isElectricity && (
                      <div className="grid grid-cols-2 gap-2">
                        {(['prepaid', 'postpaid'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setAccountType(t)}
                                className={`h-11 rounded-xl text-sm font-semibold capitalize border transition-colors ${
                                    accountType === t
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'bg-card border-card-border text-muted-foreground'
                                }`}
                            >
                              {t}
                            </button>
                        ))}
                      </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {identifierLabel}
                    </label>
                    <input
                        value={isAirtimeOrData ? phoneNumber : accountNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                          isAirtimeOrData ? setPhoneNumber(v) : setAccountNumber(v)
                        }}
                        maxLength={11}
                        inputMode="numeric"
                        placeholder={`Enter ${identifierLabel.toLowerCase()}`}
                        className="w-full h-12 px-4 bg-card border border-card-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {(isAirtimeOrData ? phoneNumber : accountNumber).length}/11 digits
                    </p>
                  </div>

                  {isCable && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Duration
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 6].map((m) => (
                              <button
                                  key={m}
                                  onClick={() => setNoOfMonth(m)}
                                  className={`h-10 rounded-lg text-xs font-semibold border transition-colors ${
                                      noOfMonth === m
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'bg-card border-card-border text-muted-foreground'
                                  }`}
                              >
                                {m}mo
                              </button>
                          ))}
                        </div>
                      </div>
                  )}

                  {isAirtimeOrData && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                      disabled={paying}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft size={19} />
                  </button>
                  <p className="text-sm font-bold text-foreground">Confirm payment</p>
                  <div className="w-9" />
                </div>

                <div className="px-5 pt-5 pb-6 space-y-5">
                  {needsValidate && validatedName && (
                      <div className="rounded-xl p-4 bg-primary-tint border border-primary/15">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 size={13} className="text-primary" />
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Verified</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{validatedName}</p>
                        {validatedAddress && <p className="text-xs text-muted-foreground mt-0.5">{validatedAddress}</p>}
                      </div>
                  )}

                  <div className="bg-secondary rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Biller</span>
                      <span className="font-semibold text-foreground">{biller.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{identifierLabel}</span>
                      <span className="font-semibold font-mono text-foreground">{identifier}</span>
                    </div>
                    {isCable && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-semibold text-foreground">{noOfMonth} month{noOfMonth > 1 ? 's' : ''}</span>
                        </div>
                    )}
                  </div>

                  {isElectricity && (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                          Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₦</span>
                          <input
                              value={amount}
                              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                              placeholder="0"
                              className="w-full h-12 pl-8 pr-4 bg-card border border-card-border rounded-xl text-base font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                          />
                        </div>
                      </div>
                  )}

                  {/* ── Payment method selector ─────────────────────── */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Pay with
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                          onClick={() => setMethod('balance')}
                          className={`relative rounded-xl border-2 p-3.5 text-left transition-all ${
                              method === 'balance'
                                  ? 'border-primary bg-primary-tint'
                                  : 'border-card-border bg-card hover:border-primary/30'
                          }`}
                      >
                        <Wallet size={18} className={method === 'balance' ? 'text-primary' : 'text-muted-foreground'} />
                        <p className="text-sm font-bold text-foreground mt-2">Balance</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatCurrency(user?.accountBalance ?? 0)}
                        </p>
                        {!hasEnoughBalance && displayAmount > 0 && (
                            <p className="text-[10px] text-destructive font-medium mt-1">Insufficient</p>
                        )}
                        {method === 'balance' && (
                            <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check size={11} className="text-primary-foreground" strokeWidth={3} />
                            </div>
                        )}
                      </button>

                      <button
                          onClick={() => setMethod('gateway')}
                          className={`relative rounded-xl border-2 p-3.5 text-left transition-all ${
                              method === 'gateway'
                                  ? 'border-primary bg-primary-tint'
                                  : 'border-card-border bg-card hover:border-primary/30'
                          }`}
                      >
                        <CreditCard size={18} className={method === 'gateway' ? 'text-primary' : 'text-muted-foreground'} />
                        <p className="text-sm font-bold text-foreground mt-2">Card / Gateway</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">via Gateway</p>
                        {method === 'gateway' && (
                            <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check size={11} className="text-primary-foreground" strokeWidth={3} />
                            </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-card-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(displayAmount)}</span>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-muted-foreground select-none cursor-pointer">
                    <input
                        type="checkbox"
                        checked={saveAsBeneficiary}
                        onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                        className="w-4 h-4 rounded border-card-border text-primary focus:ring-primary/30 focus:ring-offset-0"
                    />
                    Save this {identifierLabel.toLowerCase()} as a beneficiary for next time
                  </label>

                  {payError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                        <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                        <span>{payError}</span>
                      </div>
                  )}

                  <button
                      onClick={handlePay}
                      disabled={paying || !displayAmount || (method === 'balance' && !hasEnoughBalance)}
                      className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
                  >
                    {paying && <Loader2 size={16} className="animate-spin" />}
                    {paying ? 'Processing…' : `Pay ${formatCurrency(displayAmount)}`}
                  </button>
                  {method === 'gateway' && (
                      <p className="text-xs text-muted-foreground text-center -mt-2">
                        You&apos;ll be redirected to the Payment-gateway to complete payment
                      </p>
                  )}
                </div>
              </div>
          )}

          {/* ── PROCESSING (balance path only — synchronous) ────────── */}
          {step === 'processing' && (
              <div className="px-5 py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-5">
                  <Loader2 size={28} className="text-primary animate-spin" />
                </div>
                <p className="text-base font-bold text-foreground mb-1">Processing payment…</p>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Debiting your balance and confirming with {biller.name}
                </p>
              </div>
          )}

          {/* ── SUCCESS ───────────────────────────────────────────── */}
          {step === 'success' && (
              <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center">
                <div className="w-18 h-18 rounded-full bg-primary flex items-center justify-center mb-5 elevation-2">
                  <Check size={32} className="text-primary-foreground" strokeWidth={3} />
                </div>
                <p className="text-lg font-bold text-foreground mb-1">Payment successful</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {formatCurrency(displayAmount)} paid to {biller.name}
                </p>

                <div className="w-full space-y-2.5">
                  <button
                      onClick={() => {
                        if (completedTransactionId) {
                          router.push(`/receipt/${completedTransactionId}`)
                        }
                        onClose()
                      }}
                      className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] elevation-1 flex items-center justify-center gap-2"
                  >
                    <ReceiptText size={16} />
                    View receipt
                  </button>
                  <button
                      onClick={onClose}
                      className="w-full h-13 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/70 transition-all active:scale-[0.98]"
                  >
                    Done
                  </button>
                </div>
              </div>
          )}

          {/* ── FAILED (balance path — auto-refunded) ────────────────── */}
          {step === 'failed' && (
              <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center">
                <div className="w-18 h-18 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                  <X size={32} className="text-destructive" strokeWidth={3} />
                </div>
                <p className="text-lg font-bold text-foreground mb-1">Payment failed</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
                  {payError || 'Something went wrong. If you were debited, it has been refunded.'}
                </p>

                <div className="w-full space-y-2.5">
                  <button
                      onClick={() => setStep('confirm')}
                      className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] elevation-1"
                  >
                    Try again
                  </button>
                  <button
                      onClick={onClose}
                      className="w-full h-13 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/70 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
          )}

          {/* ── REDIRECTING (gateway path) ───────────────────────────── */}
          {step === 'redirecting' && (
              <div className="px-5 py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-5">
                  <Loader2 size={28} className="text-primary animate-spin" />
                </div>
                <p className="text-base font-bold text-foreground mb-1">Redirecting to the gateway…</p>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Complete your payment there — you&apos;ll be brought back here automatically
                </p>
              </div>
          )}

        </div>
      </div>
  )
}