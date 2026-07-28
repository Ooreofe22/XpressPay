'use client'

import React, { useState } from 'react'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Biller } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { validateBiller, initiateBillerCheckout } from '@/lib/api'

interface BillPaymentFlowProps {
  biller: Biller
  onClose: () => void
}

type FlowStep = 'details' | 'confirm' | 'redirecting'

export function BillPaymentFlow({ biller, onClose }: BillPaymentFlowProps) {
  const [step, setStep] = useState<FlowStep>('details')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountType, setAccountType] = useState<'prepaid' | 'postpaid'>('prepaid')
  const [noOfMonth, setNoOfMonth] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [validating, setValidating] = useState(false)
  const [validateError, setValidateError] = useState<string | null>(null)
  const [validatedName, setValidatedName] = useState<string | null>(null)
  const [validatedAddress, setValidatedAddress] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const isElectricity = biller.categoryPath === 'electricity'
  const isCable = biller.categoryPath === 'cable'
  const isAirtimeOrData = biller.categoryPath === 'airtime' || biller.categoryPath === 'data'
  const needsValidate = biller.requiresValidate

  // for cable, the amount is fixed by the package and returned from validate()
  const [validatedCableAmount, setValidatedCableAmount] = useState<string>('0')
  const displayAmount = isCable && validatedName ? Number(validatedCableAmount) : Number(amount || 0)

  const identifierLabel = isElectricity ? 'Meter number' : isCable ? 'Smartcard number' : 'Phone number'

  const canSubmitDetails = isAirtimeOrData
    ? phoneNumber.length >= 10 && Number(amount) > 0
    : accountNumber.length >= 5

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

  const handlePay = async () => {
    setPaying(true)
    setPayError(null)
    try {
      const details: Record<string, unknown> = isElectricity
        ? { accountNumber, accountType, name: validatedName, address: validatedAddress }
        : isCable
          ? { accountNumber, accountType: 'smartcard', noOfMonth, name: validatedName, phoneNumber }
          : { phoneNumber }

      const result = await initiateBillerCheckout({
        uniqueCode: biller.uniqueCode,
        categoryPath: biller.categoryPath,
        amount: displayAmount,
        details,
      })

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
                  <span className="font-semibold font-mono text-foreground">{accountNumber || phoneNumber}</span>
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

              <div className="pt-4 border-t border-dashed border-card-border flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(displayAmount)}</span>
              </div>

              {payError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{payError}</span>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying || !displayAmount}
                className="w-full h-13 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed elevation-1 flex items-center justify-center gap-2"
              >
                {paying && <Loader2 size={16} className="animate-spin" />}
                {paying ? 'Starting payment…' : `Pay ${formatCurrency(displayAmount)}`}
              </button>
              <p className="text-xs text-muted-foreground text-center -mt-2">
                You&apos;ll be redirected to Paystack to complete payment
              </p>
            </div>
          </div>
        )}

        {/* ── REDIRECTING ───────────────────────────────────────── */}
        {step === 'redirecting' && (
          <div className="px-5 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-5">
              <Loader2 size={28} className="text-primary animate-spin" />
            </div>
            <p className="text-base font-bold text-foreground mb-1">Redirecting to Paystack…</p>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Complete your payment there — you&apos;ll be brought back here automatically
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
