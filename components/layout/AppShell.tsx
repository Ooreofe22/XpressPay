'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
  House,
  ReceiptText,
  CreditCard,
  CircleUserRound,
  Bell,
  Search,
  LogOut,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

 type TabId = 'home' | 'pay' | 'cards' | 'profile'

interface NavItem {
  id: TabId
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'pay', label: 'Pay Bills', icon: ReceiptText },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
]

const PAGE_TITLES: Partial<Record<TabId, string>> = {
  home: 'Overview',
  //  pay: 'Pay Bills',
  //  cards: 'Cards',
  //  profile: 'Profile',
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, currentTab, setCurrentTab, logout } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const firstName = user.name.split(' ')[0]
  const isFullWidth = currentTab === 'home'

  const sidebarWidth = collapsed ? 'w-[76px]' : 'w-64'
  const mainPad = collapsed ? 'md:pl-[76px]' : 'md:pl-64'

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar (tablet + desktop) ──────────────────────────── */}
      <aside
        className={`hidden md:flex fixed inset-y-0 left-0 ${sidebarWidth} flex-col border-r border-card-border bg-card z-30 transition-[width] duration-200 ease-out`}
      >
        {/* Brand + collapse toggle */}
        <div
          className={`h-16 flex items-center border-b border-card-border ${
            collapsed ? 'justify-center px-0' : 'justify-between px-4'
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg balance-gradient flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={18} className="text-white" strokeWidth={2.75} />
              </span>
              <span className="text-base font-bold text-foreground tracking-tight truncate">
                PayXpress
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0"
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5" aria-label="Primary">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
          )}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = currentTab === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentTab(item.id)}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-primary-tint text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon size={19} strokeWidth={active ? 2.25 : 1.9} />
                    {!collapsed && item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User block */}
        <div className="border-t border-card-border p-3">
          <div
            className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span className="w-9 h-9 rounded-full balance-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">{initials}</span>
            </span>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {user.accountNumber}
                  </p>
                </div>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <LogOut size={17} strokeWidth={1.9} />
                </button>
              </>
            )}
          </div>
          {collapsed && (
            <button
              onClick={logout}
              aria-label="Log out"
              className="mt-1 w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <LogOut size={17} strokeWidth={1.9} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className={`${mainPad} flex flex-col min-h-screen transition-[padding] duration-200 ease-out`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-card/85 backdrop-blur-md border-b border-card-border">
          <div className="h-16 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Mobile brand + greeting */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="md:hidden w-8 h-8 rounded-lg balance-gradient flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={17} className="text-white" strokeWidth={2.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground leading-none mb-0.5 hidden sm:block">
                  {greeting()}, {firstName}
                </p>
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate leading-none">
                  {PAGE_TITLES[currentTab]}
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative hidden md:block">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search"
                  aria-label="Search"
                  className="w-56 h-9 pl-9 pr-3 rounded-lg bg-secondary border border-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                />
              </div>
              <button
                aria-label="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-secondary transition-colors"
              >
                <Bell size={19} strokeWidth={1.9} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent ring-2 ring-card" />
              </button>
              <span className="md:hidden w-9 h-9 rounded-full balance-gradient flex items-center justify-center">
                <span className="text-white font-semibold text-xs">{initials}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 pb-24 md:pb-8">
          {isFullWidth || currentTab === 'cards' || currentTab === 'profile' || currentTab === 'pay' ? (
            <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-7 max-w-7xl mx-auto w-full">
              {children}
            </div>
          ) : (
            <div className="max-w-md lg:max-w-2xl mx-auto w-full">{children}</div>
          )}
        </main>
      </div>
    </div>
  )
}
