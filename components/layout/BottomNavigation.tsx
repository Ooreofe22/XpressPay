'use client'

import React from 'react'
import { useApp } from '@/context/AppContext'
import { House, ReceiptText, CreditCard, CircleUserRound } from 'lucide-react'

interface NavTab {
  id: 'home' | 'pay' | 'cards' | 'profile'
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

const tabs: NavTab[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'pay', label: 'Bills', icon: ReceiptText },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
]

export function BottomNavigation() {
  const { currentTab, setCurrentTab } = useApp()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-card-border safe-bottom elevation-2 z-20"
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center pt-2.5 pb-3 gap-1 transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                className={`flex items-center justify-center h-8 w-14 rounded-full transition-colors duration-200 ${
                  isActive ? 'bg-primary-tint' : 'bg-transparent'
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.25 : 1.75} />
              </span>
              <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
