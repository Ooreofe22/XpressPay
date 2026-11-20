'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useApp } from '@/context/AppContext'
import { House, ReceiptText, CreditCard, CircleUserRound } from 'lucide-react'

const tabs = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'pay', label: 'Bills', icon: ReceiptText },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
] as const

export function BottomNavigation() {
  const { currentTab, setCurrentTab } = useApp()
  const reduce = useReducedMotion()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-card-border bg-card/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="mx-auto flex max-w-md items-stretch px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = currentTab === id
          return (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 pb-2.5 pt-3 transition-colors duration-200 ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tab-marker"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute top-0 h-[3px] w-8 rounded-b-full bg-accent"
                  aria-hidden
                />
              )}
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
