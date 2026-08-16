'use client'
import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
  Settings,
  Eye,
  EyeOff,
  ChevronRight,
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
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface KYCField {
  id: string
  label: string
  status: 'verified' | 'pending'
}

const kycFields: KYCField[] = [
  { id: 'bvn', label: 'BVN', status: 'verified' },
  { id: 'name', label: 'Full Name', status: 'verified' },
  { id: 'nin', label: 'NIN', status: 'pending' },
  { id: 'address', label: 'Address', status: 'pending' },
  { id: 'phone', label: 'Phone Number', status: 'pending' },
  { id: 'photo', label: 'Profile Photo', status: 'pending' },
  { id: 'email', label: 'Email Address', status: 'pending' },
]

// ─── Shared sub-screen shell ────────────────────────────────────────────────
function SubScreenShell({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="animate-fade-up max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/70 transition-colors active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ComingSoon() {
  return (
    <div className="bg-card border border-card-border rounded-2xl elevation-1 flex items-center justify-center min-h-80 px-8">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary-tint flex items-center justify-center mx-auto mb-4">
          <Rocket size={26} className="text-primary" strokeWidth={2} />
        </div>
        <p className="text-foreground font-bold text-lg mb-1">Feature coming soon</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This feature will be available soon. Please check back later.
        </p>
      </div>
    </div>
  )
}

// ─── ACCOUNT LIMITS SCREEN ──────────────────────────────────────────────────
function AccountLimitsScreen({ onBack }: { onBack: () => void }) {
  const [selectedField, setSelectedField] = useState<string | null>(null)

  if (selectedField) {
    return (
      <SubScreenShell title="Verification" onBack={() => setSelectedField(null)}>
        <ComingSoon />
      </SubScreenShell>
    )
  }

  return (
    <SubScreenShell title="Account Limits" onBack={onBack}>
      {/* Account Tier Card */}
      <div className="p-5 bg-primary-tint border border-primary/20 rounded-2xl flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Account Tier</p>
          <p className="text-xl font-bold text-primary">Tier 1</p>
          <p className="text-xs text-muted-foreground mt-1">Complete KYC to upgrade</p>
        </div>
        <span className="w-14 h-14 rounded-2xl bg-card border border-primary/15 flex items-center justify-center elevation-1">
          <Medal size={26} className="text-accent" strokeWidth={2} />
        </span>
      </div>

      {/* Account Information */}
      <p className="text-sm font-semibold text-foreground mb-3">Account Information</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {kycFields.map((field) => {
          const verified = field.status === 'verified'
          return (
            <button
              key={field.id}
              onClick={() => !verified && setSelectedField(field.id)}
              className={`p-4 flex items-center justify-between bg-card border border-card-border rounded-xl transition-colors text-left ${
                verified ? 'cursor-default' : 'hover:border-primary/30 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {verified ? (
                  <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                ) : (
                  <Clock size={20} className="text-accent flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{field.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {verified ? 'Verified' : 'Pending verification'}
                  </p>
                </div>
              </div>
              {verified ? (
                <span className="text-xs bg-primary-tint text-primary px-2 py-1 rounded-full font-medium">
                  Verified
                </span>
              ) : (
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </SubScreenShell>
  )
}

// ─── MAIN PROFILE SCREEN ─────────────────────────────────────────────────────
export function ProfileScreen() {
  const { user, logout } = useApp()
  const [showBalance, setShowBalance] = useState(false)
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null)

  if (!user) return null

  // Sub-screens
  if (activeSubScreen === 'account-limits') {
    return <AccountLimitsScreen onBack={() => setActiveSubScreen(null)} />
  }
  if (activeSubScreen) {
    return (
      <SubScreenShell title="Coming Soon" onBack={() => setActiveSubScreen(null)}>
        <ComingSoon />
      </SubScreenShell>
    )
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const menuGroups: {
    heading: string
    items: {
      id: string
      icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
      label: string
      subtitle: string | null
      screen: string
    }[]
  }[] = [
    {
      heading: 'Account',
      items: [
        { id: 'history', icon: History, label: 'Transaction History', subtitle: null, screen: 'history' },
        {
          id: 'limits',
          icon: BarChart3,
          label: 'Account Limits',
          subtitle: 'View your transaction limits',
          screen: 'account-limits',
        },
        {
          id: 'card',
          icon: CreditCard,
          label: 'Bank Card / Account',
          subtitle: '1 linked card/account',
          screen: 'card',
        },
        { id: 'security', icon: Shield, label: 'Security Center', subtitle: 'Protect your funds', screen: 'security' },
      ],
    },
    {
      heading: 'Support & more',
      items: [
        { id: 'support', icon: Headphones, label: 'Customer Service Center', subtitle: null, screen: 'support' },
        {
          id: 'referrals',
          icon: Gift,
          label: 'Referrals',
          subtitle: 'Invite friends and earn up to ₦5,600 bonus',
          screen: 'referrals',
        },
        { id: 'ussd', icon: Phone, label: 'PayXpress USSD', subtitle: null, screen: 'ussd' },
        { id: 'rate', icon: Star, label: 'Rate Us', subtitle: null, screen: 'rate' },
      ],
    },
  ]

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, security and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] items-start">
        {/* ── Identity rail — glassmorphic gradient, ethereal moment ─── */}
        <aside className="space-y-4">
          {/* Merged identity + balance card */}
          <div
            className="relative rounded-[1.75rem] p-6 overflow-hidden elevation-1"
            style={{ background: 'linear-gradient(135deg, var(--primary-deep) 0%, var(--primary) 100%)' }}
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-25 blur-2xl"
              style={{ background: 'var(--accent)' }}
            />

            <div className="relative flex items-center justify-between mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{initials}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold text-white truncate">{user.name}</p>
                  <p className="text-xs text-white/60 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubScreen('settings')}
                aria-label="Settings"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
              >
                <Settings size={18} />
              </button>
            </div>

            <span className="relative inline-flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm border border-white/20 text-white px-2.5 py-1 rounded-full font-semibold">
              <Medal size={13} strokeWidth={2.25} />
              Tier 1
            </span>

            <div className="relative mt-6 pt-5 border-t border-white/15">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-white/60">Total Balance</p>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                  className="p-1 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              <p className="text-3xl font-bold text-white tracking-tight mb-4">
                {showBalance ? formatCurrency(user.accountBalance) : '₦ ••••••'}
              </p>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white/80">Account setup</p>
                <p className="text-xs font-semibold" style={{ color: '#ffd7b0' }}>20%</p>
              </div>
              <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full w-1/5 bg-accent rounded-full" />
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-card border border-card-border text-destructive font-semibold text-sm hover:bg-destructive/5 hover:border-destructive/20 transition-colors elevation-1"
          >
            <LogOut size={17} strokeWidth={2} />
            Log out
          </button>

          {/* CBN / NDIC */}
          <div className="flex items-start gap-2.5 px-1">
            <Landmark size={15} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Licensed by the <span className="font-semibold text-foreground">CBN</span> and insured
              by the <span className="font-semibold text-foreground">NDIC</span>.
            </p>
          </div>
        </aside>

        {/* ── Menu ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          {menuGroups.map((group) => (
            <section key={group.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {group.heading}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSubScreen(item.screen)}
                      className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-2xl elevation-1 hover:border-primary/30 hover:-translate-y-0.5 transition-all text-left group"
                    >
                      <span className="w-10 h-10 rounded-xl bg-primary-tint flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                        <Icon
                          size={19}
                          strokeWidth={2}
                          className="text-primary group-hover:text-white transition-colors"
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.label}</p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground leading-snug">{item.subtitle}</p>
                        )}
                      </div>
                      <ChevronRight size={17} className="text-muted-foreground flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
