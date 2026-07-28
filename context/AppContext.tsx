'use client'

import React, { createContext, useContext, useState } from 'react'
import { User, Transaction, BankContact, Card } from '@/types'
import {
  submitBvn as apiSubmitBvn,
  requestSignupOtp as apiRequestSignupOtp,
  verifySignupOtp as apiVerifySignupOtp,
  requestLoginOtp as apiRequestLoginOtp,
  verifyLoginOtp as apiVerifyLoginOtp,
  fetchWalletBalance,
  fetchWalletAccounts,
  TokenResponse,
} from '@/lib/auth-api'
import { setOrValidateLocalPin, isFirstTimePinForPhone } from '@/lib/localPin'

type AuthScreen =
  | 'splash'
  | 'login-phone'
  | 'login-otp'
  | 'login-welcome'
  | 'signup-bvn'
  | 'signup-otp'
  | 'dashboard'

interface AppContextType {
  user: User | null
  isAuthenticated: boolean
  authScreen: AuthScreen
  setAuthScreen: (screen: AuthScreen) => void

  // phone currently mid-flow (set by SignUpBVN/LoginPhoneScreen, read by the OTP + PIN screens)
  pendingPhone: string | null
  // true if this device has no local PIN saved for pendingPhone yet — lets WelcomeBackScreen
  // show "Create a PIN" instead of "Enter your PIN"
  isSettingNewPin: boolean

  // -- Signup --
  requestSignupOtp: (bvn: string, phone: string) => Promise<void>
  resendSignupOtp: () => Promise<void>
  verifySignupOtp: (otp: string) => Promise<void>

  // -- Login --
  requestLoginOtp: (phone: string) => Promise<void>
  verifyLoginOtp: (otp: string) => Promise<void>

  // -- Shared final step (WelcomeBackScreen) --
  completeLogin: (pin: string) => Promise<void>

  logout: () => void
  addTransaction: (transaction: Transaction) => void
  transactions: Transaction[]
  bankContacts: BankContact[]
  addBankContact: (contact: BankContact) => void
  cards: Card[]
  addCard: (card: Card) => void
  currentTab: 'home' | 'pay' | 'cards' | 'profile'
  setCurrentTab: (tab: 'home' | 'pay' | 'cards' | 'profile') => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'sent',
    recipient: 'Amara Nwosu',
    amount: 5000,
    description: 'Transfer to Amara',
    timestamp: new Date(Date.now() - 3600000),
    status: 'completed',
    reference: 'TX001',
  },
  {
    id: '2',
    type: 'payment',
    amount: 2500,
    description: 'MTN Airtime Purchase',
    timestamp: new Date(Date.now() - 86400000),
    status: 'completed',
    reference: 'TX002',
  },
  {
    id: '3',
    type: 'received',
    recipient: 'Blessing Okoro',
    amount: 15000,
    description: 'Payment received',
    timestamp: new Date(Date.now() - 172800000),
    status: 'completed',
    reference: 'TX003',
  },
]

const mockCards: Card[] = [
  {
    id: '1',
    cardNumber: '****0123',
    cardHolder: 'CHUKWU OKAFOR',
    expiryDate: '12/26',
    cvv: '***',
    type: 'debit',
    isActive: true,
    balance: 450000,
  },
]

const mockBankContacts: BankContact[] = [
  {
    id: '1',
    name: 'Amara Nwosu',
    accountNumber: '1234567891',
    bankName: 'Zenith Bank',
    bankCode: '011',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amara',
  },
  {
    id: '2',
    name: 'Blessing Okoro',
    accountNumber: '1234567892',
    bankName: 'First Bank',
    bankCode: '011',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=blessing',
  },
]

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('splash')
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [bankContacts, setBankContacts] = useState<BankContact[]>(mockBankContacts)
  const [cards, setCards] = useState<Card[]>(mockCards)
  const [currentTab, setCurrentTab] = useState<'home' | 'pay' | 'cards' | 'profile'>('home')

  // mid-flow state — not persisted, cleared once completeLogin() finishes
  const [pendingPhone, setPendingPhone] = useState<string | null>(null)
  const [pendingBvn, setPendingBvn] = useState<string | null>(null)
  const [pendingTokens, setPendingTokens] = useState<TokenResponse | null>(null)

  const isSettingNewPin = pendingPhone ? isFirstTimePinForPhone(pendingPhone) : true

  // -- Signup --

  const requestSignupOtp = async (bvn: string, phone: string) => {
    await apiSubmitBvn(bvn) // format-check only, throws on invalid shape (11 digits)
    const normalizedPhone = normalizePhone(phone)
    await apiRequestSignupOtp(normalizedPhone)
    setPendingBvn(bvn)
    setPendingPhone(normalizedPhone)
  }

  // Resend uses whatever bvn/phone are already in state — does NOT re-collect
  // or overwrite them, unlike requestSignupOtp which is only for the first send.
  const resendSignupOtp = async () => {
    if (!pendingPhone) {
      throw new Error('Missing phone number — please start over')
    }
    await apiRequestSignupOtp(pendingPhone)
  }

  const verifySignupOtp = async (otp: string) => {
    if (!pendingPhone || !pendingBvn) {
      throw new Error('Missing signup details — please start over')
    }
    const tokens = await apiVerifySignupOtp(pendingPhone, pendingBvn, otp)
    setPendingTokens(tokens)
    // deliberately does NOT set isAuthenticated yet — WelcomeBackScreen (the
    // exact same screen/component login uses) finishes the job via completeLogin()
  }

  // -- Login --

  const requestLoginOtp = async (phone: string) => {
    const normalizedPhone = normalizePhone(phone)
    await apiRequestLoginOtp(normalizedPhone)
    setPendingPhone(normalizedPhone)
  }

  const verifyLoginOtp = async (otp: string) => {
    if (!pendingPhone) {
      throw new Error('Missing phone number — please start over')
    }
    const tokens = await apiVerifyLoginOtp(pendingPhone, otp)
    setPendingTokens(tokens)
  }

  // -- Shared final step: WelcomeBackScreen calls this regardless of whether
  // the user arrived via signup or login --

  const completeLogin = async (pin: string) => {
    if (!pendingTokens || !pendingPhone) {
      throw new Error('Session expired — please log in again')
    }

    // throws "Invalid PIN. Try again." on mismatch; silently records it on first use
    await setOrValidateLocalPin(pendingPhone, pin)

    localStorage.setItem('payxpress_access_token', pendingTokens.accessToken)
    localStorage.setItem('payxpress_refresh_token', pendingTokens.refreshToken)

    // Backend only stores { id, phone, status } — no name/email/avatar exist server-side.
    // Balance/account number are real (from the wallet endpoints); everything else here
    // is an honest placeholder, not real backend data.
    const [walletBalance, walletAccounts] = await Promise.all([
      fetchWalletBalance(pendingTokens.accessToken),
      fetchWalletAccounts(pendingTokens.accessToken),
    ])

    const newUser: User = {
      id: pendingTokens.userId,
      name: `User ${pendingTokens.phone.slice(-4)}`, // placeholder — backend collects no name
      email: `${pendingTokens.phone}@payxpress.ng`, // placeholder, matches backend's Paystack email convention
      phone: pendingTokens.phone,
      accountNumber: walletAccounts[0]?.accountNumber ?? '—',
      accountBalance: walletBalance.balance,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pendingTokens.phone}`,
      kyc: { verified: true, level: 'bronze' },
    }

    setUser(newUser)
    setPendingTokens(null)
    setPendingPhone(null)
    setPendingBvn(null)
    setAuthScreen('dashboard')
  }

  const logout = () => {
    localStorage.removeItem('payxpress_access_token')
    localStorage.removeItem('payxpress_refresh_token')
    setUser(null)
    setAuthScreen('splash')
  }

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev])
    if (transaction.type === 'sent') {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              accountBalance: prev.accountBalance - transaction.amount,
            }
          : null
      )
    }
  }

  const addBankContact = (contact: BankContact) => {
    setBankContacts((prev) => [contact, ...prev])
  }

  const addCard = (card: Card) => {
    setCards((prev) => [card, ...prev])
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        authScreen,
        setAuthScreen,
        pendingPhone,
        isSettingNewPin,
        requestSignupOtp,
        resendSignupOtp,
        verifySignupOtp,
        requestLoginOtp,
        verifyLoginOtp,
        completeLogin,
        logout,
        addTransaction,
        transactions,
        bankContacts,
        addBankContact,
        cards,
        addCard,
        currentTab,
        setCurrentTab,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

function normalizePhone(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits.startsWith('234') ? `+${digits}` : `+234${digits}`
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
