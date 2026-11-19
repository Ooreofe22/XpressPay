'use client'

import React from 'react'
import { useApp } from '@/context/AppContext'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Settings,
  HelpCircle,
  FileText,
  Shield,
  Bell,
  Download,
  Share2,
  LogOut,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { Status } from '@/components/ui/Status'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  description?: string
  action?: () => void
  badge?: string
}

export function MoreScreen() {
  const { user, logout } = useApp()

  const handleLogout = () => {
    logout()
  }

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'Edit Profile',
      icon: <Settings size={20} />,
      description: 'Update your personal information',
    },
    {
      id: 'kyc',
      label: 'Complete KYC',
      icon: <Eye size={20} />,
      description: 'Upgrade your account level',
      badge: 'Premium',
    },
    {
      id: 'statements',
      label: 'Account Statements',
      icon: <FileText size={20} />,
      description: 'Download transaction history',
    },
    {
      id: 'security',
      label: 'Security Settings',
      icon: <Shield size={20} />,
      description: 'Manage security and privacy',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={20} />,
      description: 'Manage your notification preferences',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircle size={20} />,
      description: 'Get help with your account',
    },
    {
      id: 'legal',
      label: 'Terms & Conditions',
      icon: <FileText size={20} />,
      description: 'Read our legal documents',
    },
  ]

  return (
    <div className="flex-1 pb-24">
      {/* User Profile Summary */}
      {user && (
        <div className="px-4 pt-4 pb-6">
          <Card className="card-gradient border-border/50">
            <CardContent className="py-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-primary font-medium mt-1">
                    {user.kyc.level.toUpperCase()} KYC Level
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 pb-6">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <Status tone="positive" dot>{item.badge}</Status>
                )}
                <ChevronRight size={18} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Utility Buttons */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-muted transition-colors">
            <Download size={24} className="text-primary" />
            <p className="text-xs font-medium text-foreground">Share App</p>
          </button>
          <button className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-muted transition-colors">
            <Share2 size={24} className="text-primary" />
            <p className="text-xs font-medium text-foreground">Referral</p>
          </button>
        </div>
      </div>

      {/* App Version */}
      <div className="px-4 pb-6 text-center">
        <p className="text-xs text-muted-foreground">PayXpress v1.0.0</p>
        <p className="text-xs text-muted-foreground mt-1">© 2025 PayXpress Nigeria</p>
      </div>

      {/* Logout Button */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="w-full bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors group"
        >
          <LogOut size={20} className="text-destructive" />
          <span className="font-medium text-destructive">Logout</span>
        </button>
      </div>
    </div>
  )
}
