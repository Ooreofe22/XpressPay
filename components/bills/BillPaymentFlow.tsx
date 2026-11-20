'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, CheckCircle2, AlertCircle, Wallet, CreditCard, Check, X, ReceiptText } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button, Spinner } from '@/components/app/kit'
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

  // Pay with Balance: resolves synchronously, no redirect
  const handlePayWithBalance = async () => {
    setPaying(true)
    setPayError(null)
    setStep('processing')
    try {
      const accessToken = localStorage.getItem('payxpress_access_token')
      if (!accessToken) throw new Error('Session expired. Please log in again.')

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

  // Pay with Gateway: Paystack redirect flow
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

      // Must await this: it fires a POST to the backend. Without awaiting,
      // the window.location.href redirect below fires immediately and cancels
      // the in-flight request before the server ever receives it.
      await persistBeneficiaryIfNeeded()

      setStep('redirecting')
      // Paystack's checkout page: the user leaves the app here and comes back via
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
  const reduce = useReducedMotion()
  const stepIndex = step === 'details' ? 1 : step === 'confirm' ? 2 : 0

  const fieldCls =
    'h-14 w-full rounded-[14px] border border-card-border bg-background px-4 text-[17px] text-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10'

  const Seg = <T extends string | number>({
    value,
    options,
    onChange,
    id,
  }: {
    value: T
    options: { v: T; label: string }[]
    onChange: (v: T) => void
    id: string
  }) => (
    <div
      className="grid rounded-[12px] bg-secondary p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
    >
      {options.map((o) => {
        const sel = o.v === value
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onChange(o.v)}
            className={`relative h-10 rounded-[9px] text-[14px] font-medium tabular-nums transition-colors ${
              sel ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {sel && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-[9px] bg-card elevation-1"
                aria-hidden
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )

  const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
    <div className="flex items-center gap-3 px-6 pb-2 pt-6">
      {onBack ? (
        <button
          onClick={onBack}
          disabled={paying}
          aria-label="Back"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <ArrowLeft size={19} />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-muted-foreground">
          {biller.name}
          {stepIndex > 0 && <span className="tabular-nums"> · Step {stepIndex} of 2</span>}
        </p>
        <h2 className="truncate text-[22px] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
      </div>
      <button
        onClick={onClose}
        disabled={paying}
        aria-label="Close"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <X size={17} />
      </button>
    </div>
  )

  const ErrorNote = ({ text }: { text: string }) => (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="flex items-start gap-2.5 rounded-[14px] bg-destructive-tint p-3.5 text-[14px] text-destructive"
    >
      <AlertCircle size={17} className="mt-px shrink-0" />
      <span>{text}</span>
    </motion.div>
  )

  // Render into the app root so the overlay covers the whole window. Page
  // wrappers keep a transform from their entrance animation, which would
  // otherwise turn `fixed` into "fixed to that wrapper".
  const [host, setHost] = useState<Element | null>(null)
  useEffect(() => {
    setHost(document.querySelector('.app-surface') ?? document.body)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  if (!host) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center">
      <motion.div
        initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label={`Pay ${biller.name}`}
        className="max-h-[90dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-card elevation-3 sm:max-w-[440px] sm:rounded-[28px]"
      >
        {/* DETAILS */}
        {step === 'details' && (
          <div>
            <Header title={isAirtimeOrData ? 'Who are you topping up?' : `Enter your ${identifierLabel.toLowerCase()}`} />
            <div className="space-y-6 px-6 pb-6 pt-4">
              {isElectricity && (
                <Seg
                  id="meter"
                  value={accountType}
                  onChange={setAccountType}
                  options={[
                    { v: 'prepaid', label: 'Prepaid' },
                    { v: 'postpaid', label: 'Postpaid' },
                  ]}
                />
              )}

              <div>
                <label htmlFor="bill-id" className="mb-2 flex justify-between text-[14px] font-medium text-foreground">
                  {identifierLabel}
                  <span className="font-normal text-muted-foreground tabular-nums">
                    {(isAirtimeOrData ? phoneNumber : accountNumber).length} of 11
                  </span>
                </label>
                <input
                  id="bill-id"
                  value={isAirtimeOrData ? phoneNumber : accountNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                    isAirtimeOrData ? setPhoneNumber(v) : setAccountNumber(v)
                  }}
                  maxLength={11}
                  inputMode="numeric"
                  autoFocus
                  placeholder={isAirtimeOrData ? '0803 000 0000' : 'Digits only'}
                  className={`${fieldCls} font-mono tracking-[0.08em] placeholder:font-sans placeholder:tracking-normal`}
                />
              </div>

              {isCable && (
                <div>
                  <p className="mb-2 text-[14px] font-medium text-foreground">How long</p>
                  <Seg
                    id="months"
                    value={noOfMonth}
                    onChange={setNoOfMonth}
                    options={[1, 2, 3, 6].map((m) => ({ v: m, label: `${m} ${m === 1 ? 'month' : 'mo'}` }))}
                  />
                </div>
              )}

              {isAirtimeOrData && (
                <div>
                  <p className="mb-2 text-[14px] font-medium text-foreground">Amount</p>
                  <Seg
                    id="amt"
                    value={['100', '500', '1000', '2000'].includes(amount) ? amount : ''}
                    onChange={setAmount}
                    options={['100', '500', '1000', '2000'].map((v) => ({ v, label: `₦${Number(v).toLocaleString('en-NG')}` }))}
                  />
                  <div className="relative mt-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-muted-foreground">₦</span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                      inputMode="numeric"
                      placeholder="Another amount"
                      className={`${fieldCls} pl-9 tabular-nums`}
                    />
                  </div>
                </div>
              )}

              <AnimatePresence>{validateError && <ErrorNote text={validateError} />}</AnimatePresence>

              <Button
                size="lg"
                className="w-full"
                loading={validating}
                disabled={!canSubmitDetails}
                onClick={handleDetailsSubmit}
              >
                {validating ? 'Checking account' : needsValidate ? 'Check account' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div>
            <Header title="Review and pay" onBack={() => setStep('details')} />
            <div className="space-y-6 px-6 pb-6 pt-4">
              {isElectricity ? (
                <div>
                  <label htmlFor="bill-amt" className="mb-2 block text-[14px] font-medium text-foreground">
                    How much
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[28px] font-semibold text-muted-foreground">
                      ₦
                    </span>
                    <input
                      id="bill-amt"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                      inputMode="numeric"
                      autoFocus
                      placeholder="0"
                      className="h-20 w-full rounded-[18px] border border-card-border bg-background pl-12 pr-5 text-[34px] font-bold tracking-[-0.03em] text-foreground tabular-nums focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[14px] text-muted-foreground">You&apos;re paying</p>
                  <p className="mt-1 text-[44px] font-bold leading-none tracking-[-0.04em] text-foreground tabular-nums">
                    {formatCurrency(displayAmount)}
                  </p>
                </div>
              )}

              <dl className="divide-y divide-card-border/70 overflow-hidden rounded-[18px] bg-background">
                {needsValidate && validatedName && (
                  <div className="flex items-start justify-between gap-4 px-4 py-3.5">
                    <dt className="text-[14px] text-muted-foreground">Account name</dt>
                    <dd className="text-right">
                      <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
                        <CheckCircle2 size={15} className="text-primary" />
                        {validatedName}
                      </span>
                      {validatedAddress && (
                        <span className="mt-0.5 block text-[13px] text-muted-foreground">{validatedAddress}</span>
                      )}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 px-4 py-3.5 text-[14px]">
                  <dt className="text-muted-foreground">{identifierLabel}</dt>
                  <dd className="font-mono font-semibold text-foreground">{identifier}</dd>
                </div>
                {isCable && (
                  <div className="flex justify-between gap-4 px-4 py-3.5 text-[14px]">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="font-semibold text-foreground">
                      {noOfMonth} month{noOfMonth > 1 ? 's' : ''}
                    </dd>
                  </div>
                )}
              </dl>

              <div>
                <p className="mb-2 text-[14px] font-medium text-foreground">Pay with</p>
                <div className="grid grid-cols-2 gap-3" role="radiogroup">
                  {(
                    [
                      {
                        id: 'balance' as const,
                        icon: Wallet,
                        title: 'Balance',
                        detail: formatCurrency(user?.accountBalance ?? 0),
                        warn: !hasEnoughBalance && displayAmount > 0 ? 'Not enough' : null,
                      },
                      { id: 'gateway' as const, icon: CreditCard, title: 'Card', detail: 'Bank card or transfer', warn: null },
                    ]
                  ).map(({ id, icon: Icon, title, detail, warn }) => {
                    const sel = method === id
                    return (
                      <button
                        key={id}
                        role="radio"
                        aria-checked={sel}
                        onClick={() => setMethod(id)}
                        className={`relative rounded-[18px] border p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 ${
                          sel ? 'border-primary bg-primary-tint/50 ring-1 ring-primary' : 'border-card-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <Icon size={20} className={sel ? 'text-primary' : 'text-muted-foreground'} />
                        <p className="mt-3 text-[15px] font-semibold text-foreground">{title}</p>
                        <p className={`mt-0.5 text-[13px] tabular-nums ${warn ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {warn ? `${warn}: ${detail}` : detail}
                        </p>
                        <span
                          className={`absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                            sel ? 'bg-primary text-primary-foreground' : 'border border-card-border'
                          }`}
                        >
                          {sel && <Check size={12} strokeWidth={3.5} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 select-none">
                <span className="text-[14px] text-foreground">Save as beneficiary</span>
                <span className="relative">
                  <input
                    type="checkbox"
                    checked={saveAsBeneficiary}
                    onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="block h-[30px] w-[50px] rounded-full bg-secondary transition-colors peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20" />
                  <span className="absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white elevation-1 transition-transform duration-200 peer-checked:translate-x-5" />
                </span>
              </label>

              <AnimatePresence>{payError && <ErrorNote text={payError} />}</AnimatePresence>

              <div>
                <Button
                  size="lg"
                  className="w-full"
                  loading={paying}
                  disabled={!displayAmount || (method === 'balance' && !hasEnoughBalance)}
                  onClick={handlePay}
                >
                  {paying ? 'Starting payment' : `Pay ${formatCurrency(displayAmount)}`}
                </Button>
                {method === 'gateway' && (
                  <p className="mt-3 text-center text-[13px] text-muted-foreground">
                    You&apos;ll finish on our secure payment page and come straight back.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROCESSING / REDIRECTING */}
        {(step === 'processing' || step === 'redirecting') && (
          <div className="flex flex-col items-center px-6 py-16 text-center" aria-live="polite">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint text-primary">
              <Spinner size={30} />
            </span>
            <p className="mt-5 text-[19px] font-semibold tracking-[-0.015em] text-foreground">
              {step === 'processing' ? 'Paying ' + biller.name : 'Opening secure payment'}
            </p>
            <p className="mt-1.5 max-w-[17rem] text-[14px] leading-[1.45] text-muted-foreground">
              {step === 'processing'
                ? 'Taking it from your balance and confirming with the biller. This usually takes a few seconds.'
                : 'Complete your payment there and you will come back here automatically.'}
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="flex flex-col items-center px-6 pb-6 pt-12 text-center" aria-live="polite">
            <motion.span
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 20 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground elevation-2"
            >
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </motion.span>
            <p className="mt-6 text-[24px] font-bold tracking-[-0.025em] text-foreground">Paid</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{formatCurrency(displayAmount)}</span> to{' '}
              {biller.name}
            </p>
            <div className="mt-8 grid w-full gap-2.5">
              <Button
                size="lg"
                icon={<ReceiptText />}
                onClick={() => {
                  if (completedTransactionId) router.push(`/receipt/${completedTransactionId}`)
                  onClose()
                }}
              >
                View receipt
              </Button>
              <Button size="lg" variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* FAILED */}
        {step === 'failed' && (
          <div className="flex flex-col items-center px-6 pb-6 pt-12 text-center" role="alert">
            <motion.span
              initial={reduce ? false : { x: -8 }}
              animate={{ x: [-8, 8, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive-tint text-destructive"
            >
              <X size={34} strokeWidth={3} />
            </motion.span>
            <p className="mt-6 text-[24px] font-bold tracking-[-0.025em] text-foreground">Payment didn&apos;t go through</p>
            <p className="mt-1.5 max-w-[19rem] text-[15px] leading-[1.45] text-muted-foreground">
              {payError || 'Something went wrong. If you were debited, the money has been returned.'}
            </p>
            <div className="mt-8 grid w-full gap-2.5">
              <Button size="lg" onClick={() => setStep('confirm')}>
                Try again
              </Button>
              <Button size="lg" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    host,
  )
}
