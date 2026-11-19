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
import { Status } from '@/components/ui/Status'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Transactions', href: '/admin/transactions', icon: ReceiptText },
  { label: 'Reconciliation', href: '/admin/reconciliation', icon: ScanSearch },
  { label: 'Billers', href: '/admin/billers', icon: Layers },
  { label: 'Accounts', href: '/admin/accounts', icon: Users },
]

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <aside
      className={`splash-gradient fixed inset-y-0 left-0 z-50 flex w-64 flex-col text-white transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="PayXpress admin home">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/12 ring-1 ring-white/20">
            <ArrowUpRight size={18} className="text-white" strokeWidth={2.75} />
          </span>
          <span className="text-[17px] font-bold tracking-tight">PayXpress</span>
          <Status tone="onBrand" size="sm" className="border-l border-white/25 pl-2.5">
            Admin
          </Status>
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
        {navItems.map((item, i) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`animate-fade-up group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'
              }`}
            >
              <span
                className={`absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent transition-all duration-300 ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <Icon
                size={17}
                strokeWidth={2.25}
                className={`transition-transform duration-200 ${active ? '' : 'group-hover:translate-x-0.5'}`}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-white/55 transition-colors hover:text-white"
        >
          Back to site
          <ArrowUpRight size={13} strokeWidth={2.5} />
        </Link>
        <p className="mt-2 text-[11px] text-white/35">Biller Services · v0.1</p>
      </div>
    </aside>
  )
}
