'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Transaction, BankContact, Card, BillBeneficiary } from '@/types'
import {
  requestSignupOtp as apiRequestSignupOtp,
  verifySignupOtp as apiVerifySignupOtp,
  requestLoginOtp as apiRequestLoginOtp,
  verifyLoginOtp as apiVerifyLoginOtp,
  fetchWalletBalance,
  fetchWalletAccounts,
  refreshAccessToken,
  TokenResponse,
} from '@/lib/auth-api'
import { fetchBillPaymentHistory, fetchBillBeneficiaries, createBillBeneficiary } from '@/lib/api'
import { setOrValidateLocalPin, isFirstTimePinForIdentity } from '@/lib/localPin'

type AuthScreen =
  | 'splash'
  | 'login-email'
  | 'login-otp'
  | 'login-welcome'
  | 'signup-email'
  | 'signup-otp'
  | 'dashboard'

type BillsTab = 'bills' | 'transactions'

interface AppContextType {
  user: User | null
  isAuthenticated: boolean
  authScreen: AuthScreen
  setAuthScreen: (screen: AuthScreen) => void
  rehydrating: boolean
  pendingEmail: string | null
  isSettingNewPin: boolean
  requestSignupOtp: (email: string) => Promise<void>
  resendSignupOtp: () => Promise<void>
  verifySignupOtp: (otp: string) => Promise<void>
  requestLoginOtp: (email: string) => Promise<void>
  verifyLoginOtp: (otp: string) => Promise<void>
  completeLogin: (pin: string) => Promise<void>
  logout: () => void
  addTransaction: (transaction: Transaction) => void
  transactions: Transaction[]
  refreshTransactionHistory: () => Promise<void>
  refreshBalance: () => Promise<void>
  bankContacts: BankContact[]
  addBankContact: (contact: BankContact) => void
  cards: Card[]
  addCard: (card: Card) => void
  currentTab: 'home' | 'pay' | 'cards' | 'profile'
  setCurrentTab: (tab: 'home' | 'pay' | 'cards' | 'profile') => void
  billsActiveTab: BillsTab
  setBillsActiveTab: (tab: BillsTab) => void
  billerBeneficiaries: BillBeneficiary[]
  addBillerBeneficiary: (beneficiary: BillBeneficiary) => Promise<void>
  refreshBillerBeneficiaries: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('splash')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bankContacts, setBankContacts] = useState<BankContact[]>([])
  const [cards, setCards] = useState<Card[]>(mockCards)
  const [currentTab, setCurrentTab] = useState<'home' | 'pay' | 'cards' | 'profile'>('home')
  const [billsActiveTab, setBillsActiveTab] = useState<BillsTab>('bills')
  const [billerBeneficiaries, setBillerBeneficiaries] = useState<BillBeneficiary[]>([])

  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [pendingTokens, setPendingTokens] = useState<TokenResponse | null>(null)

  const [rehydrating, setRehydrating] = useState(true)

  const isSettingNewPin = pendingEmail ? isFirstTimePinForIdentity(pendingEmail) : true

  // -- Session rehydration --
  useEffect(() => {
    const rehydrate = async () => {
      let accessToken = localStorage.getItem('payxpress_access_token')
      const refreshToken = localStorage.getItem('payxpress_refresh_token')

      if (!accessToken || !refreshToken) {
        setRehydrating(false)
        return
      }

      const claims = decodeJwtPayload(accessToken)
      if (!claims) {
        localStorage.removeItem('payxpress_access_token')
        localStorage.removeItem('payxpress_refresh_token')
        setRehydrating(false)
        return
      }

      try {
        const [walletBalance, walletAccounts] = await Promise.all([
          fetchWalletBalance(accessToken),
          fetchWalletAccounts(accessToken),
        ])
        applyRehydratedUser(claims, walletBalance, walletAccounts)
      } catch {
        try {
          const refreshed = await refreshAccessToken(refreshToken)
          accessToken = refreshed.accessToken
          localStorage.setItem('payxpress_access_token', accessToken)
          const [walletBalance, walletAccounts] = await Promise.all([
            fetchWalletBalance(accessToken),
            fetchWalletAccounts(accessToken),
          ])
          applyRehydratedUser(claims, walletBalance, walletAccounts)
        } catch {
          localStorage.removeItem('payxpress_access_token')
          localStorage.removeItem('payxpress_refresh_token')
        }
      }

      setRehydrating(false)
    }

    rehydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyRehydratedUser = (
    claims: { sub: string; email: string },
    walletBalance: { balance: number },
    walletAccounts: { accountNumber: string }[]
  ) => {
    const newUser: User = {
      id: claims.sub,
      name: `User ${claims.email.split('@')[0]}`,
      email: claims.email,
      accountNumber: walletAccounts[0]?.accountNumber ?? '—',
      accountBalance: walletBalance.balance,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${claims.email}`,
      kyc: { verified: true, level: 'bronze' },
    }
    setUser(newUser)
    setAuthScreen('dashboard')
    refreshTransactionHistory()
    refreshBillerBeneficiaries()
  }

  // -- Signup --
  const requestSignupOtp = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    await apiRequestSignupOtp(normalizedEmail)
    setPendingEmail(normalizedEmail)
  }

  const resendSignupOtp = async () => {
    if (!pendingEmail) {
      throw new Error('Missing email — please start over')
    }
    await apiRequestSignupOtp(pendingEmail)
  }

  const verifySignupOtp = async (otp: string) => {
    if (!pendingEmail) {
      throw new Error('Missing signup details — please start over')
    }
    const tokens = await apiVerifySignupOtp(pendingEmail, otp)
    setPendingTokens(tokens)
  }

  // -- Login --
  const requestLoginOtp = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    await apiRequestLoginOtp(normalizedEmail)
    setPendingEmail(normalizedEmail)
  }

  const verifyLoginOtp = async (otp: string) => {
    if (!pendingEmail) {
      throw new Error('Missing email — please start over')
    }
    const tokens = await apiVerifyLoginOtp(pendingEmail, otp)
    setPendingTokens(tokens)
  }

  // -- Shared final step --
  const completeLogin = async (pin: string) => {
    if (!pendingTokens || !pendingEmail) {
      throw new Error('Session expired — please log in again')
    }

    await setOrValidateLocalPin(pendingEmail, pin)

    localStorage.setItem('payxpress_access_token', pendingTokens.accessToken)
    localStorage.setItem('payxpress_refresh_token', pendingTokens.refreshToken)

    const [walletBalance, walletAccounts] = await Promise.all([
      fetchWalletBalance(pendingTokens.accessToken),
      fetchWalletAccounts(pendingTokens.accessToken),
    ])

    const newUser: User = {
      id: pendingTokens.userId,
      name: `User ${pendingTokens.email.split('@')[0]}`,
      email: pendingTokens.email,
      accountNumber: walletAccounts[0]?.accountNumber ?? '—',
      accountBalance: walletBalance.balance,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pendingTokens.email}`,
      kyc: { verified: true, level: 'bronze' },
    }

    setUser(newUser)
    setPendingTokens(null)
    setPendingEmail(null)
    setAuthScreen('dashboard')

    refreshTransactionHistory()
    refreshBillerBeneficiaries()
  }

  const refreshBalance = async () => {
    const token = localStorage.getItem('payxpress_access_token')
    if (!token || !user) return
    try {
      const { balance } = await fetchWalletBalance(token)
      setUser((prev) => (prev ? { ...prev, accountBalance: balance } : null))
    } catch {
      // silently fail — balance will refresh on next meaningful interaction
    }
  }

  const logout = () => {
    localStorage.removeItem('payxpress_access_token')
    localStorage.removeItem('payxpress_refresh_token')
    setUser(null)
    setAuthScreen('splash')
  }

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev])
    if (transaction.type === 'sent' || transaction.type === 'payment') {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              accountBalance: Math.max(0, prev.accountBalance - transaction.amount),
            }
          : null
      )
    }
  }

  const refreshTransactionHistory = async () => {
    try {
      const history = await fetchBillPaymentHistory()
      setTransactions(history)
    } catch (err) {
      console.error('Could not refresh transaction history:', err)
    }
  }

  const addBankContact = (contact: BankContact) => {
    setBankContacts((prev) => [contact, ...prev])
  }

  const addCard = (card: Card) => {
    setCards((prev) => [card, ...prev])
  }

  const refreshBillerBeneficiaries = async () => {
    try {
      const beneficiaries = await fetchBillBeneficiaries()
      setBillerBeneficiaries(beneficiaries)
    } catch (err) {
      console.error('Could not refresh beneficiaries:', err)
    }
  }

  const addBillerBeneficiary = async (beneficiary: BillBeneficiary) => {
    const exists = billerBeneficiaries.some(
      (b) =>
        b.billerUniqueCode === beneficiary.billerUniqueCode &&
        (b.accountNumber === beneficiary.accountNumber || b.phoneNumber === beneficiary.phoneNumber)
    )
    if (exists) return

    const saved = await createBillBeneficiary(beneficiary)
    setBillerBeneficiaries((prev) => [saved, ...prev])
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        authScreen,
        setAuthScreen,
        rehydrating,
        pendingEmail,
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
        refreshTransactionHistory,
        refreshBalance,
        bankContacts,
        addBankContact,
        cards,
        addCard,
        currentTab,
        setCurrentTab,
        billsActiveTab,
        setBillsActiveTab,
        billerBeneficiaries,
        addBillerBeneficiary,
        refreshBillerBeneficiaries,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

function decodeJwtPayload(token: string): { sub: string; email: string } | null {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
