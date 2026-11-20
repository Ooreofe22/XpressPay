'use client'

import React, { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { Search, Plus, UserRound } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button, EmptyState, ListRow } from '@/components/app/kit'

interface SendStep {
  recipient: string | null
  amount: number | null
  note: string
}

const STEPS = ['select', 'amount', 'confirm'] as const

export function SendMoneyScreen() {
  const { bankContacts, user, addTransaction } = useApp()
  const reduce = useReducedMotion()
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'success'>('select')
  const [sendData, setSendData] = useState<SendStep>({ recipient: null, amount: null, note: '' })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [reference, setReference] = useState('')

  const selected = bankContacts.find((c) => c.id === sendData.recipient)
  const filtered = bankContacts.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.accountNumber.includes(searchQuery),
  )
  const balance = user?.accountBalance ?? 0
  const over = !!sendData.amount && sendData.amount > balance

  const handleConfirm = async () => {
    if (!selected || !sendData.amount) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    const ref = `TXN${Date.now()}`
    addTransaction({
      id: Math.random().toString(),
      type: 'sent',
      recipient: selected.name,
      amount: sendData.amount,
      description: `Transfer to ${selected.name}`,
      timestamp: new Date(),
      status: 'completed',
      reference: ref,
    })
    setReference(ref)
    setLoading(false)
    setStep('success')
  }

  const reset = () => {
    setStep('select')
    setSendData({ recipient: null, amount: null, note: '' })
    setReference('')
  }

  const initialsOf = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-tint font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initialsOf(name)}
    </span>
  )

  const stepNo = STEPS.indexOf(step as (typeof STEPS)[number]) + 1
  const Progress = () =>
    stepNo > 0 ? (
      <div className="flex items-center gap-3 px-6 pt-6">
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < stepNo ? 'bg-primary' : 'bg-secondary'}`}
            />
          ))}
        </div>
        <span className="text-[13px] text-muted-foreground tabular-nums">Step {stepNo} of 3</span>
      </div>
    ) : null

  if (step === 'select') {
    return (
      <div>
        <Progress />
        <div className="px-6 pb-2 pt-5">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-foreground">Who are you paying?</h2>
          <div className="group relative mt-4">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary"
            />
            <input
              type="search"
              placeholder="Name or account number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-[14px] border border-card-border bg-background pl-11 pr-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>
        <div className="divide-y divide-card-border/70 pb-2">
          <ListRow
            onClick={() => {}}
            leading={
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint text-accent">
                <Plus size={18} strokeWidth={2.4} />
              </span>
            }
            title={<span className="text-accent">New recipient</span>}
            detail="Any bank in Nigeria"
          />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<UserRound size={22} strokeWidth={1.75} />}
              title={searchQuery ? 'No one matches that' : 'No saved recipients yet'}
              body={searchQuery ? 'Try a different name or account number.' : 'People you pay will be saved here.'}
            />
          ) : (
            filtered.map((c) => (
              <ListRow
                key={c.id}
                onClick={() => {
                  setSendData({ ...sendData, recipient: c.id })
                  setStep('amount')
                }}
                leading={<Avatar name={c.name} />}
                title={c.name}
                detail={
                  <>
                    {c.bankName} · <span className="font-mono">{c.accountNumber}</span>
                  </>
                }
                trailing={<span className="text-[18px] text-muted-foreground/70">›</span>}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  if (step === 'amount' && selected) {
    return (
      <div>
        <Progress />
        <div className="flex items-center gap-3 px-6 pt-5">
          <Avatar name={selected.name} size={44} />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold text-foreground">{selected.name}</p>
            <p className="truncate text-[13px] text-muted-foreground">
              {selected.bankName} · <span className="font-mono">{selected.accountNumber}</span>
            </p>
          </div>
        </div>

        <div className="px-6 py-10 text-center">
          <label htmlFor="send-amt" className="text-[14px] text-muted-foreground">
            Amount
          </label>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="text-[32px] font-semibold text-muted-foreground">₦</span>
            <input
              id="send-amt"
              inputMode="numeric"
              autoFocus
              value={sendData.amount ? sendData.amount.toLocaleString('en-NG') : ''}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
                setSendData({ ...sendData, amount: Number.isNaN(n) ? null : n })
              }}
              placeholder="0"
              className={`w-full max-w-[16rem] bg-transparent text-center text-[56px] font-bold leading-none tracking-[-0.04em] tabular-nums placeholder:text-muted-foreground/30 focus:outline-none ${
                over ? 'text-destructive' : 'text-foreground'
              }`}
            />
          </div>
          <motion.p
            key={over ? 'over' : 'ok'}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 text-[14px] ${over ? 'text-destructive' : 'text-muted-foreground'}`}
            aria-live="polite"
          >
            {over ? 'More than your balance of ' : 'Balance '}
            <span className="font-semibold tabular-nums">{formatCurrency(balance)}</span>
          </motion.p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[5000, 10000, 20000, 50000].map((v) => (
              <button
                key={v}
                onClick={() => setSendData({ ...sendData, amount: v })}
                className={`h-9 rounded-[10px] px-3.5 text-[14px] font-medium tabular-nums transition-colors ${
                  sendData.amount === v ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-card-border'
                }`}
              >
                {formatCurrency(v)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6">
          <label htmlFor="note" className="mb-2 block text-[14px] font-medium text-foreground">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="note"
            placeholder="What's it for?"
            value={sendData.note}
            onChange={(e) => setSendData({ ...sendData, note: e.target.value })}
            className="h-12 w-full rounded-[14px] border border-card-border bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 p-6">
          <Button variant="secondary" size="lg" onClick={() => setStep('select')}>
            Back
          </Button>
          <Button size="lg" disabled={!sendData.amount || over} onClick={() => setStep('confirm')}>
            Review
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'confirm' && selected && sendData.amount) {
    const rows: [string, React.ReactNode][] = [
      ['To', selected.name],
      ['Bank', selected.bankName],
      ['Account', <span key="a" className="font-mono">{selected.accountNumber}</span>],
      ...(sendData.note ? ([['Note', sendData.note]] as [string, React.ReactNode][]) : []),
      ['Fee', <span key="f" className="text-credit">Free</span>],
    ]
    return (
      <div>
        <Progress />
        <div className="px-6 pb-2 pt-8 text-center">
          <p className="text-[14px] text-muted-foreground">You&apos;re sending</p>
          <p className="mt-1 text-[48px] font-bold leading-none tracking-[-0.04em] text-foreground tabular-nums">
            {formatCurrency(sendData.amount)}
          </p>
        </div>
        <dl className="mx-6 mt-6 divide-y divide-card-border/70 overflow-hidden rounded-[18px] bg-background">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3.5 text-[14px]">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="grid grid-cols-[auto_1fr] gap-3 p-6">
          <Button variant="secondary" size="lg" disabled={loading} onClick={() => setStep('amount')}>
            Edit
          </Button>
          <Button size="lg" loading={loading} onClick={handleConfirm}>
            {loading ? 'Sending' : `Send ${formatCurrency(sendData.amount)}`}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'success' && selected && sendData.amount) {
    return (
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
              transition={{ delay: 0.15, duration: 0.4 }}
            />
          </svg>
        </motion.span>
        <p className="mt-6 text-[24px] font-bold tracking-[-0.025em] text-foreground">Sent</p>
        <p className="mt-1 text-[15px] text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{formatCurrency(sendData.amount)}</span> to{' '}
          {selected.name}
        </p>
        <dl className="mt-8 w-full divide-y divide-card-border/70 overflow-hidden rounded-[18px] bg-background text-left">
          {[
            ['Bank', selected.bankName],
            ['Account', selected.accountNumber],
            ['Reference', reference],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3.5 text-[14px]">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={`font-semibold text-foreground ${k !== 'Bank' ? 'font-mono' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <Button size="lg" className="mt-6 w-full" onClick={reset}>
          Done
        </Button>
      </div>
    )
  }

  return null
}
