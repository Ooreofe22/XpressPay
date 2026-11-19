'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import {
  Plus,
  Wifi,
  Snowflake,
  Settings2,
  FileText,
  ShieldCheck,
  Globe,
  Lock,
  ChevronRight,
} from 'lucide-react'
import { Status } from '@/components/ui/Status'

/** Realistic bank card visual */
function BankCard({
  masked,
  holder,
  expiry,
  badge,
}: {
  masked: string
  holder: string
  expiry: string
  badge?: string
}) {
  return (
    <div className="relative w-full max-w-sm aspect-[1.586] rounded-2xl bank-card-gradient elevation-3 p-6 flex flex-col justify-between overflow-hidden">
      {/* Sheen */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />

      {/* Top row: brand + contactless */}
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-white font-bold text-sm tracking-tight">PayXpress</p>
          <p className="text-white/50 text-[10px]">Digital Banking</p>
        </div>
        <Wifi size={18} className="text-white/70 rotate-90" />
      </div>

      {/* Chip */}
      <div className="relative">
        <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border border-amber-500/40">
          <div className="w-full h-full grid grid-cols-2 gap-px p-1">
            <div className="border border-amber-500/40 rounded-sm" />
            <div className="border border-amber-500/40 rounded-sm" />
            <div className="border border-amber-500/40 rounded-sm" />
            <div className="border border-amber-500/40 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Number */}
      <p className="text-white font-mono text-lg tracking-[0.18em] relative">{masked}</p>

      {/* Bottom row */}
      <div className="flex items-end justify-between relative">
        <div>
          <p className="text-white/50 text-[9px] uppercase tracking-wider mb-0.5">Card Holder</p>
          <p className="text-white text-xs font-semibold tracking-wide">{holder}</p>
        </div>
        <div>
          <p className="text-white/50 text-[9px] uppercase tracking-wider mb-0.5">Expires</p>
          <p className="text-white text-xs font-semibold">{expiry}</p>
        </div>
        <p className="text-white font-bold text-sm italic tracking-tight">VERVE</p>
      </div>

      {badge && (
        <Status tone="onBrand" size="sm" className="absolute top-5 right-14">
          {badge}
        </Status>
      )}
    </div>
  )
}

const cardActions = [
  { id: 'freeze', label: 'Freeze', icon: Snowflake },
  { id: 'settings', label: 'Controls', icon: Settings2 },
  { id: 'statement', label: 'Statement', icon: FileText },
]

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Protected spending',
    desc: 'Every transaction is monitored and secured.',
  },
  { icon: Globe, title: 'Works everywhere', desc: 'Use online and in-store, wherever Verve is accepted.' },
  { icon: Lock, title: 'You stay in control', desc: 'Freeze, set limits, or block your card instantly.' },
]

export function CardsScreen() {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual'>('physical')

  if (!user) return null

  const isVirtual = activeTab === 'virtual'
  const holder = user.name.toUpperCase()

  return (
    <div className="animate-fade-up space-y-6">
      {/* Section header: title + segmented control + add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Your cards</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your physical and virtual cards in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-secondary p-1" role="tablist">
            {(
              [
                { id: 'physical', label: 'Physical' },
                { id: 'virtual', label: 'Virtual' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-card text-primary elevation-1'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors active:scale-[0.98] elevation-1">
            <Plus size={17} strokeWidth={2.25} />
            <span className="hidden sm:inline">Add card</span>
          </button>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        {/* Card display panel */}
        <section className="bg-card border border-card-border rounded-2xl p-6 lg:p-10 elevation-1 flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center w-full mb-8">
            {!isVirtual && (
              <div className="absolute w-full max-w-sm aspect-[1.586] rounded-2xl bg-primary-tint border border-primary/15 -rotate-3 translate-y-2 scale-95" />
            )}
            <BankCard
              masked={isVirtual ? '**** **** **** 4567' : '**** **** **** 0123'}
              holder={holder}
              expiry={isVirtual ? '12/25' : '12/26'}
              badge={isVirtual ? 'NEW' : undefined}
            />
          </div>

          <h3 className="text-lg font-bold text-foreground tracking-tight text-balance max-w-sm">
            {isVirtual ? 'Spend globally with a virtual card' : 'A better way to spend your money'}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-sm text-pretty">
            {isVirtual
              ? 'Get a virtual card and live a global lifestyle with secure online payments.'
              : 'Link your physical cards to manage your lifestyle and track spending better.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-7 w-full max-w-sm">
            <button
              disabled={isVirtual}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] elevation-1 disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {isVirtual ? 'Coming soon' : 'Link your bank card'}
            </button>
            <button className="w-full sm:w-auto whitespace-nowrap px-4 h-12 text-primary text-sm font-semibold hover:underline">
              How do I get one?
            </button>
          </div>
        </section>

        {/* Details + actions */}
        <aside className="space-y-4">
          {/* Balance breakdown */}
          <div className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
            <p className="text-xs font-medium text-muted-foreground">Card balance</p>
            <p className="text-3xl font-bold text-foreground tracking-tight mt-1">
              {formatCurrency(user.accountBalance)}
            </p>
            <div className="mt-4 space-y-3 border-t border-card-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {isVirtual ? 'Not activated' : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly spend limit</span>
                <span className="font-semibold text-foreground">{formatCurrency(500000)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Card type</span>
                <span className="font-semibold text-foreground capitalize">{activeTab}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {cardActions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-card border border-card-border elevation-1 hover:border-primary/30 transition-all active:scale-95 group"
              >
                <span className="w-10 h-10 rounded-full bg-primary-tint flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className="text-primary group-hover:text-white transition-colors"
                  />
                </span>
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-card border border-card-border rounded-2xl p-5 elevation-1">
            <p className="text-sm font-bold text-foreground mb-4">Why you&apos;ll love it</p>
            <ul className="space-y-4">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl border border-card-border bg-background flex items-center justify-center flex-shrink-0">
                    <Icon size={17} className="text-primary" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
