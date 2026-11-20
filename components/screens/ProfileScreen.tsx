'use client'

import React, { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { useTheme } from '@/components/theme/ThemeProvider'
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ArrowLeft,
  History,
  CreditCard,
  Shield,
  Headphones,
  Gift,
  Phone,
  Star,
  BarChart3,
  Medal,
  Landmark,
  Rocket,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Status } from '@/components/ui/Status'
import { EmptyState, IconTile, ListRow, Panel, SectionTitle, type TileTone } from '@/components/app/kit'

const kycFields = [
  { id: 'bvn', label: 'BVN', verified: true },
  { id: 'name', label: 'Full name', verified: true },
  { id: 'nin', label: 'NIN', verified: false },
  { id: 'address', label: 'Home address', verified: false },
  { id: 'phone', label: 'Phone number', verified: false },
  { id: 'photo', label: 'Profile photo', verified: false },
  { id: 'email', label: 'Email address', verified: false },
]
const verifiedCount = kycFields.filter((f) => f.verified).length

function Back({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button
      onClick={onBack}
      className="mb-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-primary transition-colors hover:text-primary-dark"
    >
      <ArrowLeft size={17} />
      {label}
    </button>
  )
}

function SubScreen({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <Back onBack={onBack} label="Profile" />
      <h1 className="type-title-2 mb-7 text-foreground">{title}</h1>
      {children}
    </div>
  )
}

function ComingSoon() {
  return (
    <Panel>
      <EmptyState
        icon={<Rocket size={22} strokeWidth={1.9} />}
        title="On the way"
        body="We're still building this. It will appear here as soon as it's ready."
      />
    </Panel>
  )
}

/** Seven segments, one per verification step. */
function VerificationBar() {
  const reduce = useReducedMotion()
  return (
    <div className="flex gap-1.5" aria-label={`${verifiedCount} of ${kycFields.length} verified`}>
      {kycFields.map((f, i) => (
        <motion.span
          key={f.id}
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`h-2 flex-1 origin-left rounded-full ${f.verified ? 'bg-primary' : 'bg-secondary'}`}
        />
      ))}
    </div>
  )
}

function AccountLimitsScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)

  if (selected) {
    return (
      <SubScreen title={kycFields.find((f) => f.id === selected)?.label ?? 'Verification'} onBack={() => setSelected(null)}>
        <ComingSoon />
      </SubScreen>
    )
  }

  return (
    <SubScreen title="Limits and verification" onBack={onBack}>
      <Panel className="p-6">
        <div className="flex items-center gap-4">
          <IconTile tone="orange" size={52} icon={<Medal size={24} strokeWidth={2} />} />
          <div>
            <p className="text-[14px] text-muted-foreground">Current tier</p>
            <p className="text-[24px] font-bold tracking-[-0.025em] text-foreground">Tier 1</p>
          </div>
        </div>
        <div className="mt-6">
          <VerificationBar />
          <p className="mt-2.5 text-[14px] text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {verifiedCount} of {kycFields.length}
            </span>{' '}
            verified. Finish the rest to move to Tier 2.
          </p>
        </div>
      </Panel>

      <SectionTitle title="Your details" className="mt-8" />
      <Panel className="overflow-hidden">
        <div className="divide-y divide-card-border/70">
          {kycFields.map((f) => (
            <ListRow
              key={f.id}
              onClick={f.verified ? undefined : () => setSelected(f.id)}
              leading={
                <IconTile
                  tone={f.verified ? 'green' : 'orange'}
                  icon={f.verified ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                />
              }
              title={f.label}
              trailing={
                f.verified ? (
                  <Status tone="positive" size="sm" dot>
                    Verified
                  </Status>
                ) : (
                  <span className="flex items-center gap-2 text-[14px] font-medium text-primary">
                    Verify <span aria-hidden>›</span>
                  </span>
                )
              }
            />
          ))}
        </div>
      </Panel>
    </SubScreen>
  )
}

export function ProfileScreen() {
  const { user, logout } = useApp()
  const { theme, setTheme } = useTheme()
  const reduce = useReducedMotion()
  const [showBalance, setShowBalance] = useState(false)
  const [sub, setSub] = useState<string | null>(null)

  if (!user) return null

  if (sub === 'account-limits') return <AccountLimitsScreen onBack={() => setSub(null)} />
  if (sub) {
    return (
      <SubScreen title={sub} onBack={() => setSub(null)}>
        <ComingSoon />
      </SubScreen>
    )
  }

  const initials = user.name
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const groups: { heading: string; items: { id: string; icon: typeof History; tone: TileTone; label: string; detail?: string }[] }[] = [
    {
      heading: 'Account',
      items: [
        { id: 'Transaction history', icon: History, tone: 'green', label: 'Transaction history' },
        { id: 'account-limits', icon: BarChart3, tone: 'orange', label: 'Limits and verification', detail: `Tier 1 · ${verifiedCount} of ${kycFields.length} verified` },
        { id: 'Linked cards', icon: CreditCard, tone: 'green', label: 'Linked cards', detail: '1 card' },
        { id: 'Security', icon: Shield, tone: 'green', label: 'Security', detail: 'PIN and devices' },
      ],
    },
    {
      heading: 'Help and more',
      items: [
        { id: 'Support', icon: Headphones, tone: 'orange', label: 'Contact support' },
        { id: 'Referrals', icon: Gift, tone: 'orange', label: 'Invite friends', detail: 'Earn up to ₦5,600' },
        { id: 'USSD banking', icon: Phone, tone: 'green', label: 'USSD banking' },
        { id: 'Rate PayXpress', icon: Star, tone: 'orange', label: 'Rate PayXpress' },
      ],
    },
  ]

  return (
    <div className="animate-fade-up">
      <div className="grid items-start gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Identity */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-[32px] font-semibold tracking-[-0.02em] text-accent-foreground elevation-2">
              {initials}
            </span>
            <h1 className="type-title-2 mt-5 text-foreground">{user.name}</h1>
            <p className="mt-1 text-[15px] text-muted-foreground">{user.email}</p>
            <Status tone="warning" icon={<Medal />} className="mt-3">
              Tier 1
            </Status>
          </div>

          <Panel className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-[14px] text-muted-foreground">Balance</p>
              <button
                onClick={() => setShowBalance((v) => !v)}
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <p className="mt-1 text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground tabular-nums">
              {showBalance ? formatCurrency(user.accountBalance) : '₦••••••'}
            </p>
            <p className="mt-2 font-mono text-[13px] text-muted-foreground">{user.accountNumber}</p>

            <div className="mt-6 border-t border-card-border/70 pt-5">
              <div className="mb-2.5 flex justify-between text-[14px]">
                <span className="font-medium text-foreground">Verification</span>
                <span className="text-muted-foreground tabular-nums">
                  {verifiedCount} of {kycFields.length}
                </span>
              </div>
              <VerificationBar />
              <button
                onClick={() => setSub('account-limits')}
                className="mt-4 text-[14px] font-medium text-primary transition-colors hover:text-primary-dark"
              >
                Continue verification ›
              </button>
            </div>
          </Panel>
        </aside>

        {/* Settings */}
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.heading}>
              <SectionTitle title={g.heading} />
              <Panel className="overflow-hidden">
                <div className="divide-y divide-card-border/70">
                  {g.items.map(({ id, icon: Icon, tone, label, detail }) => (
                    <ListRow
                      key={id}
                      onClick={() => setSub(id)}
                      leading={<IconTile tone={tone} size={36} icon={<Icon size={17} strokeWidth={2} />} />}
                      title={label}
                      detail={detail}
                      trailing={<span className="text-[18px] text-muted-foreground/70">›</span>}
                    />
                  ))}
                </div>
              </Panel>
            </section>
          ))}

          <section>
            <SectionTitle title="Appearance" />
            <Panel className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="flex items-center gap-3.5">
                <IconTile tone="neutral" size={36} icon={theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />} />
                <span className="text-[15px] font-medium text-foreground">Theme</span>
              </span>
              <div role="radiogroup" className="grid grid-cols-2 rounded-[12px] bg-secondary p-1">
                {(['light', 'dark'] as const).map((t) => {
                  const sel = theme === t
                  return (
                    <button
                      key={t}
                      role="radio"
                      aria-checked={sel}
                      onClick={() => setTheme(t)}
                      className={`relative h-9 rounded-[9px] px-4 text-[14px] font-medium capitalize ${
                        sel ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sel && (
                        <motion.span
                          layoutId="theme-seg"
                          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                          className="absolute inset-0 rounded-[9px] bg-card elevation-1"
                          aria-hidden
                        />
                      )}
                      <span className="relative">{t}</span>
                    </button>
                  )
                })}
              </div>
            </Panel>
          </section>

          <Panel className="overflow-hidden">
            <ListRow
              onClick={logout}
              leading={<IconTile tone="neutral" size={36} icon={<LogOut size={17} className="text-destructive" />} />}
              title={<span className="text-destructive">Log out</span>}
            />
          </Panel>

          <p className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground lg:justify-start">
            <Landmark size={15} />
            Licensed by the CBN. Deposits insured by the NDIC.
          </p>
        </div>
      </div>
    </div>
  )
}
