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
  Search,
  LogOut,
  ArrowUpRight,
  ChevronsLeft,
  ChevronsRight,
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
  const reduce = useReducedMotion()

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
            className={`hidden md:flex fixed inset-y-0 left-0 ${sidebarWidth} z-30 flex-col bg-card transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[12px_0_32px_-18px_rgba(6,56,42,0.14),1px_0_0_0_rgba(6,56,42,0.06)]`}
        >
          {/* Collapse handle straddles the sidebar edge */}
          <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="absolute -right-3 top-[72px] z-40 flex h-6 w-6 items-center justify-center rounded-full border border-card-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            {collapsed ? <ChevronsRight size={13} strokeWidth={2.5} /> : <ChevronsLeft size={13} strokeWidth={2.5} />}
          </button>

          {/* Brand */}
          <div
              className={`flex h-16 flex-shrink-0 items-center ${
                  collapsed ? 'justify-center px-0' : 'px-5'
              }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
            <span className="balance-gradient relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]">
              <ArrowUpRight size={18} className="text-white" strokeWidth={2.75} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
            </span>
              {!collapsed && (
                  <span className="truncate text-base font-bold tracking-tight text-foreground">
                PayXpress
              </span>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-2 pt-4" aria-label="Primary">
            {!collapsed && (
                <p className="px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Menu
                </p>
            )}
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = currentTab === item.id
                return (
                    <li key={item.id} className="relative">
                      <button
                          onClick={() => setCurrentTab(item.id)}
                          aria-current={active ? 'page' : undefined}
                          title={collapsed ? item.label : undefined}
                          className={`relative w-full items-center rounded-xl text-sm transition-colors duration-200 ${
                              collapsed ? 'flex justify-center py-1.5' : 'flex gap-3 px-3 py-2.5'
                          } ${
                              active
                                  ? 'font-semibold text-primary'
                                  : 'font-medium text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                          }`}
                      >
                        {/* Expanded active state: shared-layout tint that slides
                        between items, carrying a left rail with it */}
                        {active && !collapsed && (
                            <motion.span
                                layoutId="sidebar-active"
                                transition={
                                  reduce
                                      ? { duration: 0 }
                                      : { type: 'spring', stiffness: 400, damping: 34 }
                                }
                                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-tint via-primary-tint/60 to-transparent"
                                aria-hidden
                            >
                              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                            </motion.span>
                        )}

                        {/* Collapsed active state: the icon itself becomes a
                        brand-gradient chip instead of a flat tint row */}
                        <span
                            className={`relative z-10 flex items-center justify-center transition-all duration-200 ${
                                collapsed
                                    ? `h-10 w-10 rounded-xl ${
                                        active
                                            ? 'balance-gradient text-white shadow-[0_4px_12px_-4px_rgba(6,56,42,0.5)]'
                                            : ''
                                    }`
                                    : ''
                            }`}
                        >
                      <Icon size={19} strokeWidth={active ? 2.25 : 1.9} />
                    </span>

                        {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
                      </button>
                    </li>
                )
              })}
            </ul>
          </nav>

          {/* User block */}
          <div className="flex-shrink-0 p-3">
            <div
                className={`rounded-2xl border border-card-border/70 bg-secondary/40 ${
                    collapsed ? 'flex flex-col items-center gap-1 px-1.5 py-2' : 'p-3'
                }`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              <span className="balance-gradient relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ring-2 ring-card">
                <span className="text-xs font-semibold text-white">{initials}</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
              </span>
                {!collapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {user.accountNumber}
                        </p>
                      </div>
                      <button
                          onClick={logout}
                          aria-label="Log out"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <LogOut size={16} strokeWidth={1.9} />
                      </button>
                    </>
                )}
              </div>
              {collapsed && (
                  <button
                      onClick={logout}
                      aria-label="Log out"
                      className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut size={16} strokeWidth={1.9} />
                  </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main column ─────────────────────────────────────────── */}
        <div className={`${mainPad} flex flex-col min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
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
                <ThemeToggle />
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
