'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { motion, useReducedMotion } from 'motion/react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  House,
  ReceiptText,
  CreditCard,
  CircleUserRound,
  Bell,
  LogOut,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

type TabId = 'home' | 'pay' | 'cards' | 'profile'

const navItems: { id: TabId; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'pay', label: 'Bills', icon: ReceiptText },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
]

const TITLES: Record<TabId, string> = {
  home: 'Home',
  pay: 'Bills',
  cards: 'Cards',
  profile: 'Profile',
}

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center bg-white text-primary-deep"
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
    >
      <ArrowUpRight size={size * 0.55} strokeWidth={2.75} />
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-primary-deep" />
    </span>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, currentTab, setCurrentTab, logout } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const reduce = useReducedMotion()

  if (!user) return null

  const initials = user.name
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const sidebarWidth = collapsed ? 'w-[84px]' : 'w-[248px]'
  const mainPad = collapsed ? 'md:pl-[84px]' : 'md:pl-[248px]'

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar: deep brand green in both themes ───────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-primary-deep text-white transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex ${sidebarWidth}`}
      >
        <div className={`flex h-[72px] items-center ${collapsed ? 'justify-center' : 'justify-between px-5'}`}>
          <div className="flex items-center gap-2.5">
            <BrandMark />
            {!collapsed && (
              <span className="text-[17px] font-semibold tracking-[-0.02em]">PayXpress</span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <PanelLeftClose size={17} strokeWidth={1.9} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpen size={17} strokeWidth={1.9} />
          </button>
        )}

        <nav className="flex-1 px-3 pt-4" aria-label="Primary">
          <ul className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = currentTab === id
              return (
                <li key={id}>
                  <button
                    onClick={() => setCurrentTab(id)}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? label : undefined}
                    className={`relative flex h-11 w-full items-center rounded-[12px] text-[15px] transition-colors duration-200 ${
                      collapsed ? 'justify-center' : 'gap-3 px-3.5'
                    } ${active ? 'font-semibold text-white' : 'font-medium text-white/75 hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                        className="absolute inset-0 rounded-[12px] bg-white/[0.11]"
                        aria-hidden
                      >
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                      </motion.span>
                    )}
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className="relative" />
                    {!collapsed && <span className="relative">{label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-3">
          <div
            className={`flex items-center rounded-[16px] bg-white/[0.07] ${
              collapsed ? 'flex-col gap-2 py-3' : 'gap-3 p-3'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground">
              {initials}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{user.name}</span>
                <span className="block truncate font-mono text-[12px] text-white/70">
                  {user.accountNumber}
                </span>
              </span>
            )}
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main column ───────────────────────────────────────── */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mainPad}`}
      >
        <header className="sticky top-0 z-20 border-b border-transparent bg-background/80 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="md:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary-deep">
                  <ArrowUpRight size={17} className="text-white" strokeWidth={2.75} />
                </span>
              </span>
              <p className="truncate text-[15px] font-semibold text-foreground md:text-muted-foreground md:font-medium">
                {TITLES[currentTab]}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <button
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
              >
                <Bell size={18} strokeWidth={1.9} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
              </button>
              <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground md:hidden">
                {initials}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-28 md:pb-12">
          <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:pt-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
