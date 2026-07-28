'use client'

import React from 'react'
import { AppProvider, useApp } from '@/context/AppContext'
import { SplashScreen } from '@/components/auth/SplashScreen'
import { LoginPhoneScreen } from '@/components/auth/LoginPhoneScreen'
import { LoginOTPScreen } from '@/components/auth/LoginOTPScreen'
import { WelcomeBackScreen } from '@/components/auth/WelcomeBackScreen'
import { SignUpBVN } from '@/components/auth/SignUpBVN'
import { SignUpOTP } from '@/components/auth/SignUpOTP'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { BillsScreen } from '@/components/screens/BillsScreen'
import { CardsScreen } from '@/components/screens/CardsScreen'
import { ProfileScreen } from '@/components/screens/ProfileScreen'

function AppContent() {
  const { isAuthenticated, currentTab, authScreen } = useApp()

  if (!isAuthenticated) {
    return (
      <>
        {authScreen === 'splash' && <SplashScreen />}
        {authScreen === 'login-phone' && <LoginPhoneScreen />}
        {authScreen === 'login-otp' && <LoginOTPScreen />}
        {authScreen === 'login-welcome' && <WelcomeBackScreen />}
        {authScreen === 'signup-bvn' && <SignUpBVN />}
        {authScreen === 'signup-otp' && <SignUpOTP />}
      </>
    )
  }

  return (
    <>
      <AppShell>
        {currentTab === 'home' && <HomeScreen />}
        {currentTab === 'pay' && <BillsScreen />}
        {currentTab === 'cards' && <CardsScreen />}
        {currentTab === 'profile' && <ProfileScreen />}
      </AppShell>
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </>
  )
}

export default function AppPage() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
