'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowDownLeft, ArrowUpRight, Check, RotateCcw } from 'lucide-react'
import { Spinner } from './primitives'

/*
 * Interactive transfer demo: the landing page's main feature.
 * Pure client state, no requests. Every animation here reports something
 * (progress, elapsed time, the balance changing, the new ledger row).
 */

const START_BALANCE = 1_284_500

const recipients = [
  { id: 'amara', name: 'Amara Nwosu', bank: 'GTBank', acct: '6789' },
  { id: 'tunde', name: 'Tunde Bakare', bank: 'Access Bank', acct: '3301' },
  { id: 'zainab', name: 'Zainab Musa', bank: 'Kuda', acct: '0442' },
] as const

const amounts = [5_000, 20_000, 45_000, 100_000]

const steps = ['Recipient verified', 'Debited from balance', 'Delivered']
const STEP_AT = [450, 1100, 1850] // ms after Send

type Phase = 'idle' | 'sending' | 'done'

interface Row {
  id: string
  name: string
  meta: string
  amount: number
}

const initialRows: Row[] = [
  { id: 'r1', name: 'Chidi Okonkwo', meta: 'Opay · Received', amount: 120_000 },
  { id: 'r2', name: 'Ikeja Electric', meta: 'Prepaid meter', amount: -18_500 },
  { id: 'r3', name: 'MTN', meta: 'Airtime', amount: -5_000 },
]

const naira = (n: number) => `₦${Math.abs(n).toLocaleString('en-NG')}`

/** Smoothly counts a number to its new value; jumps instantly under reduced motion. */
function useCountTo(target: number, reduce: boolean | null) {
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    if (reduce) {
      setValue(target)
      from.current = target
      return
    }
    const start = performance.now()
    const a = from.current
    const dur = 700
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = Math.round(a + (target - a) * eased)
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      from.current = target
    }
  }, [target, reduce])

  return value
}

export function TransferDemo() {
  const reduce = useReducedMotion()
  const [to, setTo] = useState<(typeof recipients)[number]['id']>('amara')
  const [amount, setAmount] = useState(45_000)
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState(-1)
  const [elapsed, setElapsed] = useState(0)
  const [balance, setBalance] = useState(START_BALANCE)
  const [rows, setRows] = useState<Row[]>(initialRows)
  const timers = useRef<number[]>([])

  const shownBalance = useCountTo(balance, reduce)
  const recipient = recipients.find((r) => r.id === to)!
  const insufficient = amount > balance

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Live elapsed timer while sending
  useEffect(() => {
    if (phase !== 'sending') return
    const t0 = performance.now()
    let raf = 0
    const tick = () => {
      setElapsed((performance.now() - t0) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  function resetIfDone() {
    if (phase === 'done') {
      setPhase('idle')
      setStep(-1)
    }
  }

  function send() {
    if (phase !== 'idle' || insufficient) return
    setPhase('sending')
    setStep(-1)
    setElapsed(0)

    STEP_AT.forEach((ms, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setStep(i)
          if (i === 1) setBalance((b) => b - amount)
          if (i === steps.length - 1) {
            setElapsed(ms / 1000)
            setPhase('done')
            setRows((r) => [
              {
                id: `t${Date.now()}`,
                name: recipient.name,
                meta: `${recipient.bank} · Just now`,
                amount: -amount,
              },
              ...r.slice(0, 3),
            ])
          }
        }, ms),
      )
    })
  }

  function startOver() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('idle')
    setStep(-1)
    setElapsed(0)
    setBalance(START_BALANCE)
    setRows(initialRows)
  }

  const locked = phase === 'sending'

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card elevation-3">
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        {/* ── Compose ─────────────────────────────────────────── */}
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="type-title-2 whitespace-nowrap text-foreground">New transfer</h2>
            <p className="text-[13px] text-muted-foreground">Demo, no money moves</p>
          </div>

          <fieldset className="mt-8" disabled={locked}>
            <legend className="text-[13px] font-medium text-muted-foreground">To</legend>
            <div className="mt-3 grid gap-2">
              {recipients.map((r) => {
                const active = r.id === to
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setTo(r.id)
                      resetIfDone()
                    }}
                    aria-pressed={active}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed ${
                      active
                        ? 'border-primary bg-primary-tint/60 ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-foreground">
                      {r.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-foreground">
                        {r.name}
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {r.bank} <span className="font-mono">•••• {r.acct}</span>
                      </span>
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                        active ? 'bg-primary text-primary-foreground' : 'border border-border'
                      }`}
                    >
                      {active && <Check size={12} strokeWidth={3.5} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="mt-8" disabled={locked}>
            <legend className="text-[13px] font-medium text-muted-foreground">Amount</legend>
            <p className="mt-2 text-[2.75rem] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums sm:text-[3.25rem]">
              {naira(amount)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {amounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(a)
                    resetIfDone()
                  }}
                  aria-pressed={a === amount}
                  className={`h-9 rounded-full px-4 text-[14px] font-medium tabular-nums transition-colors duration-200 disabled:cursor-not-allowed ${
                    a === amount
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-foreground hover:bg-border'
                  }`}
                >
                  {naira(a)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8">
            {phase === 'done' ? (
              <button
                type="button"
                onClick={() => {
                  setPhase('idle')
                  setStep(-1)
                }}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-secondary text-[17px] font-semibold text-foreground transition-colors hover:bg-border"
              >
                Send another
              </button>
            ) : (
              <button
                type="button"
                onClick={send}
                disabled={locked || insufficient}
                aria-busy={locked}
                className="relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-primary text-[17px] font-semibold text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:hover:bg-primary [&:disabled:not([aria-busy=true])]:opacity-40"
              >
                {locked ? (
                  <>
                    <Spinner size={18} />
                    Sending
                  </>
                ) : (
                  <>Send {naira(amount)}</>
                )}
              </button>
            )}
            <p
              className={`mt-3 text-center text-[13px] ${
                insufficient && phase === 'idle' ? 'text-destructive' : 'text-muted-foreground'
              }`}
              aria-live="polite"
            >
              {insufficient && phase === 'idle'
                ? `Not enough balance. You have ${naira(balance)}.`
                : `To ${recipient.name} at ${recipient.bank}`}
            </p>
          </div>
        </div>

        {/* ── Result ──────────────────────────────────────────── */}
        <div className="border-t border-border bg-background/60 p-6 sm:p-10 lg:border-l lg:border-t-0">
          <p className="text-[13px] font-medium text-muted-foreground">Available balance</p>
          <p className="mt-1 text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums sm:text-[2.25rem]">
            {naira(shownBalance)}
          </p>

          {/* Progress */}
          <ol className="mt-8 space-y-3" aria-label="Transfer progress">
            {steps.map((label, i) => {
              const doneStep = step >= i
              const current = phase === 'sending' && step === i - 1
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                      doneStep
                        ? 'bg-primary text-primary-foreground'
                        : current
                          ? 'text-primary'
                          : 'border border-border text-transparent'
                    }`}
                  >
                    {doneStep ? (
                      <motion.span
                        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                        className="flex"
                      >
                        <Check size={13} strokeWidth={3.5} />
                      </motion.span>
                    ) : current ? (
                      <Spinner size={22} />
                    ) : null}
                  </span>
                  <span
                    className={`text-[15px] transition-colors duration-300 ${
                      doneStep || current ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {i === steps.length - 1 ? `Delivered to ${recipient.bank}` : label}
                  </span>
                </li>
              )
            })}
          </ol>

          <div className="mt-5 h-6" aria-live="polite">
            <AnimatePresence mode="wait">
              {phase !== 'idle' && (
                <motion.p
                  key={phase}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`text-[15px] font-semibold tabular-nums ${
                    phase === 'done' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {phase === 'done'
                    ? `${naira(amount)} delivered in ${elapsed.toFixed(1)}s`
                    : `${elapsed.toFixed(1)}s`}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Ledger */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">Recent activity</p>
            {balance !== START_BALANCE && phase !== 'sending' && (
              <button
                type="button"
                onClick={startOver}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw size={12} strokeWidth={2.5} />
                Reset
              </button>
            )}
          </div>
          <ul className="mt-2 divide-y divide-border">
            <AnimatePresence initial={false}>
              {rows.map((row) => {
                const credit = row.amount > 0
                return (
                  <motion.li
                    key={row.id}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3 py-3"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        credit ? 'bg-primary-tint text-credit' : 'bg-secondary text-foreground'
                      }`}
                    >
                      {credit ? (
                        <ArrowDownLeft size={15} strokeWidth={2.25} />
                      ) : (
                        <ArrowUpRight size={15} strokeWidth={2.25} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-foreground">
                        {row.name}
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {row.meta}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[15px] font-semibold tabular-nums ${
                        credit ? 'text-credit' : 'text-foreground'
                      }`}
                    >
                      {credit ? '+' : '−'}
                      {naira(row.amount)}
                    </span>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </div>
  )
}
