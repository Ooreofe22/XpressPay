'use client'

import React, { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { SplashScreen } from '@/components/auth/SplashScreen'
import { LoginEmailScreen } from '@/components/auth/LoginEmailScreen'
import { LoginOTPScreen } from '@/components/auth/LoginOTPScreen'
import { WelcomeBackScreen } from '@/components/auth/WelcomeBackScreen'
import { SignUpEmailScreen } from '@/components/auth/SignUpEmailScreen'
import { SignUpOTP } from '@/components/auth/SignUpOTP'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { BillsScreen } from '@/components/screens/BillsScreen'
import { CardsScreen } from '@/components/screens/CardsScreen'
import { ProfileScreen } from '@/components/screens/ProfileScreen'

function ScreenParamHandler() {
    const { setAuthScreen } = useApp()
    const searchParams = useSearchParams()

    useEffect(() => {
        const screen = searchParams.get('screen')
        if (screen === 'login-email') {
            setAuthScreen('login-email')
        }
    }, [searchParams, setAuthScreen])

    return null
}

function AppContent() {
    const { isAuthenticated, currentTab, authScreen, rehydrating } = useApp()

    // Wait for the mount-time session check to finish before deciding whether
    // to show login or dashboard — otherwise this renders the login screen for
    // a frame on every reload (or every redirect back from Paystack), even
    // when the stored token is still valid.
    if (rehydrating) {
        return <SplashScreen />
    }

    if (!isAuthenticated) {
        return (
            <>
                {authScreen === 'splash' && <SplashScreen />}
                {authScreen === 'login-email' && <LoginEmailScreen />}
                {authScreen === 'login-otp' && <LoginOTPScreen />}
                {authScreen === 'login-welcome' && <WelcomeBackScreen />}
                {authScreen === 'signup-email' && <SignUpEmailScreen />}
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
        <>
            <Suspense fallback={null}>
                <ScreenParamHandler />
            </Suspense>
            <AppContent />
        </>
    )
}
