'use client'

import React from 'react'
import { useApp } from '@/context/AppContext'
import { Bell } from 'lucide-react'

const TAB_TITLES: Record<string, string> = {
  pay: 'Pay Bills',
  cards: 'Cards',
  profile: 'Me',
}

export function Header() {
  const { user, currentTab } = useApp()

  if (!user) return null

  return (
    <header className="bg-card/95 backdrop-blur-md border-b border-card-border px-4 py-3 sticky top-0 z-10">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          {TAB_TITLES[currentTab] ?? ''}
        </h1>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative p-2.5 hover:bg-secondary rounded-full transition-colors"
          >
            <Bell size={19} className="text-foreground" strokeWidth={1.75} />
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-accent ring-2 ring-card" />
          </button>
        </div>
      </div>
    </header>
  )
}
