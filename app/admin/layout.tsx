'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { hasAdminAccess } from '@/lib/admin-auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true)
      return
    }
    if (!hasAdminAccess()) {
      router.replace('/admin/login')
      return
    }
    setChecked(true)
  }, [isLoginPage, pathname, router])

  // Login page renders its own full-screen layout, no sidebar/topbar shell.
  if (isLoginPage) return <div className="app-surface min-h-screen bg-background">{children}</div>

  // Avoid flashing admin content before the access check resolves.
  if (!checked) return null

  return (
    <div className="app-surface min-h-screen bg-background text-foreground lg:flex">
      {/* Mobile overlay */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-primary-deep/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 pt-4 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
