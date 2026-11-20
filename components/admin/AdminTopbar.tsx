'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Status } from '@/components/ui/Status'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

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
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary lg:hidden"
          >
            <Menu size={19} />
          </button>
          <div key={current.prefix} className="animate-fade-up">
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
              {current.title}
            </h1>
            <p className="text-[13px] text-muted-foreground">{current.sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Status tone="warning" dot className="hidden sm:inline-flex">
            Test mode
          </Status>
          <ThemeToggle />
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground">
            OP
          </span>
        </div>
      </div>
    </header>
  )
}
