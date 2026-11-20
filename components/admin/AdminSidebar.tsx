'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowUpRight,
  LayoutDashboard,
  Layers,
  ReceiptText,
  ScanSearch,
  Users,
  X,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Transactions', href: '/admin/transactions', icon: ReceiptText },
  { label: 'Reconciliation', href: '/admin/reconciliation', icon: ScanSearch },
  { label: 'Billers', href: '/admin/billers', icon: Layers },
  { label: 'Accounts', href: '/admin/accounts', icon: Users },
]

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[248px] bg-primary-deep flex-col text-white transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="flex h-[72px] items-center justify-between px-5">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="PayXpress admin home">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-[9px] bg-white text-primary-deep">
            <ArrowUpRight size={18} strokeWidth={2.75} />
            <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-primary-deep" />
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.02em]">PayXpress</span>
          <span className="border-l border-white/25 pl-2.5 text-[13px] font-medium text-white/80">Admin</span>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-11 items-center gap-3 rounded-[12px] px-3.5 text-[15px] transition-colors duration-200 ${
                active ? 'font-semibold text-white' : 'font-medium text-white/75 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                  className="absolute inset-0 rounded-[12px] bg-white/[0.11]"
                  aria-hidden
                >
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                </motion.span>
              )}
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} className="relative" />
              <span className="relative">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[14px] font-medium text-white/80 transition-colors hover:text-white"
        >
          Back to site
          <ArrowUpRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    </aside>
  )
}
