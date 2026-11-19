'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Status } from '@/components/ui/Status'

const titles: { prefix: string; title: string; sub: string }[] = [
  { prefix: '/admin/transactions', title: 'Transactions', sub: 'Every payment across all billers' },
  { prefix: '/admin/reconciliation', title: 'Reconciliation', sub: 'Charges and fulfilments that disagree' },
  { prefix: '/admin/billers', title: 'Billers', sub: 'Catalog synced from XpressPay' },
  { prefix: '/admin/accounts', title: 'Accounts', sub: 'Every wallet on PayXpress' },
  { prefix: '/admin', title: 'Overview', sub: 'What is happening across PayXpress' },
]

export function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const current = titles.find((t) => pathname.startsWith(t.prefix)) ?? titles[titles.length - 1]

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary lg:hidden"
          >
            <Menu size={19} />
          </button>
          <div key={current.prefix} className="animate-fade-up">
            <h1 className="text-[15px] leading-tight font-bold tracking-tight text-foreground">
              {current.title}
            </h1>
            <p className="text-xs text-muted-foreground">{current.sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Status tone="warning" dot className="hidden sm:inline-flex">
            Test mode
          </Status>
          <span className="balance-gradient flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white elevation-1">
            OP
          </span>
        </div>
      </div>
    </header>
  )
}
