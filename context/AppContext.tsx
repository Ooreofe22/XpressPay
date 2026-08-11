'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Transaction, BankContact, Card, BillBeneficiary } from '@/types'
import {
  submitBvn as apiSubmitBvn,
  requestSignupOtp as apiRequestSignupOtp,
  verifySignupOtp as apiVerifySignupOtp,
  requestLoginOtp as apiRequestLoginOtp,
  verifyLoginOtp as apiVerifyLoginOtp,
  fetchWalletBalance,
  fetchWalletAccounts,
  refreshAccessToken,
  TokenResponse,
} from '@/lib/auth-api'
import { fetchBillPaymentHistory } from '@/lib/api'
import { setOrValidateLocalPin, isFirstTimePinForPhone } from '@/lib/localPin'

type AuthScreen =
    | 'splash'
    | 'login-phone'
    | 'login-otp'
    | 'login-welcome'
    | 'signup-bvn'
    | 'signup-otp'
    | 'dashboard'

type BillsTab = 'bills' | 'transactions'

interface AppContextType {
  user: User | null
  isAuthenticated: boolean
  authScreen: AuthScreen
  setAuthScreen: (screen: AuthScreen) => void

  // true while we're attempting to restore a session from localStorage on
  // first mount (e.g. after redirecting back from Paystack). Screens that
  // gate on isAuthenticated should wait for this to go false before
  // redirecting to login, or they'll bounce a valid session for a frame.
  rehydrating: boolean

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
  refreshTransactionHistory: () => Promise<void>
  bankContacts: BankContact[]
  addBankContact: (contact: BankContact) => void
  cards: Card[]
  addCard: (card: Card) => void
  currentTab: 'home' | 'pay' | 'cards' | 'profile'
  setCurrentTab: (tab: 'home' | 'pay' | 'cards' | 'profile') => void

  // Bills sub-tab — lets HomeScreen's "See all" deep-link straight into
  // BillsScreen's Transactions tab instead of always landing on Pay Bills
  billsActiveTab: BillsTab
  setBillsActiveTab: (tab: BillsTab) => void

  // Reusable saved recipients for bill payments (meter/smartcard/phone number
  // per biller), separate from BankContact which is for bank transfers
  billerBeneficiaries: BillBeneficiary[]
  addBillerBeneficiary: (beneficiary: BillBeneficiary) => void
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

  // mid-flow state — not persisted, cleared once completeLogin() finishes
  const [pendingPhone, setPendingPhone] = useState<string | null>(null)
  const [pendingBvn, setPendingBvn] = useState<string | null>(null)
  const [pendingTokens, setPendingTokens] = useState<TokenResponse | null>(null)

  // true until the mount-time rehydration attempt below finishes (success,
  // failure, or "nothing to restore") — see rehydrate() effect
  const [rehydrating, setRehydrating] = useState(true)

  const isSettingNewPin = pendingPhone ? isFirstTimePinForPhone(pendingPhone) : true

  // -- Session rehydration --
  //
  // A full-page navigation to Paystack (or any hard reload) wipes all React
  // state, including `user`. Tokens survive in localStorage, but nothing was
  // reading them back out on mount — so the app always came back up as
  // logged-out, even with valid tokens sitting right there. This effect
  // reconstructs `user` from the stored access token (decoding its payload
  // for id/phone, then re-fetching wallet data) and falls back to
  // /auth/refresh if the access token has expired (15 min lifetime).

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
        // token is malformed/unreadable — nothing salvageable
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
        // likely an expired access token — refresh once and retry, otherwise give up
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
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyRehydratedUser = (
      claims: { sub: string; phone: string },
      walletBalance: { balance: number },
      walletAccounts: { accountNumber: string }[]
  ) => {
    const newUser: User = {
      id: claims.sub,
      name: `User ${claims.phone.slice(-4)}`, // placeholder — backend collects no name
      email: `${claims.phone}@payxpress.ng`, // placeholder, matches backend's Paystack email convention
      phone: claims.phone,
      accountNumber: walletAccounts[0]?.accountNumber ?? '—',
      accountBalance: walletBalance.balance,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${claims.phone}`,
      kyc: { verified: true, level: 'bronze' },
    }
    setUser(newUser)
    setAuthScreen('dashboard')
    refreshTransactionHistory()
  }

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

    // Fire-and-forget: populate real bill payment history now that we're
    // authenticated. Not awaited so login doesn't stall on this network call —
    // the dashboard will re-render once it resolves.
    refreshTransactionHistory()
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

  // GET /billers/payments/history — replaces whatever's in `transactions` with
  // the real history from the backend. Safe to call repeatedly (login, after a
  // completed payment, manual refresh) since it's just a read.
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

  const addBillerBeneficiary = (beneficiary: BillBeneficiary) => {
    setBillerBeneficiaries((prev) => {
      // avoid duplicate entries for the same biller + account number
      const exists = prev.some(
          (b) => b.billerUniqueCode === beneficiary.billerUniqueCode && b.accountNumber === beneficiary.accountNumber
      )
      if (exists) return prev
      return [beneficiary, ...prev]
    })
  }

  return (
      <AppContext.Provider
          value={{
            user,
            isAuthenticated: user !== null,
            authScreen,
            setAuthScreen,
            rehydrating,
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
            refreshTransactionHistory,
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

// Reads the payload (2nd segment) of a JWT without verifying its signature.
// Safe here because it's only used to pre-fill display data (id, phone) —
// every real request still goes through the backend's JwtAuthFilter, which
// verifies the signature server-side. Returns null if the token is malformed.
function decodeJwtPayload(token: string): { sub: string; phone: string } | null {
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