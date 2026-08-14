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
import {
  fetchBillPaymentHistory,
  fetchBillBeneficiaries,
  createBillBeneficiary,
  getWalletBalance,
} from '@/lib/api'
import { setOrValidateLocalPin, isFirstTimePinForUser } from '@/lib/localPin'

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

  // true while we're attempting to restore a session from localStorage on
  // first mount (e.g. after redirecting back from Paystack). Screens that
  // gate on isAuthenticated should wait for this to go false before
  // redirecting or they'll bounce a valid session for a frame.
  rehydrating: boolean

  // email currently mid-flow (set by SignUpEmailScreen/LoginEmailScreen, read
  // by the OTP + PIN screens)
  pendingEmail: string | null
  // true if this device has no local PIN saved for pendingEmail yet — lets
  // WelcomeBackScreen show "Create a PIN" instead of "Enter your PIN"
  isSettingNewPin: boolean

  // -- Signup --
  requestSignupOtp: (email: string) => Promise<void>
  resendSignupOtp: () => Promise<void>
  verifySignupOtp: (otp: string) => Promise<void>

  // -- Login --
  requestLoginOtp: (email: string) => Promise<void>
  verifyLoginOtp: (otp: string) => Promise<void>

  // -- Shared final step (WelcomeBackScreen) --
  completeLogin: (pin: string) => Promise<void>

  logout: () => void
  addTransaction: (transaction: Transaction) => void
  transactions: Transaction[]
  refreshTransactionHistory: () => Promise<void>
  // Re-fetch GET /wallet/balance and update user.accountBalance — call after
  // any successful payment (wallet debit or Paystack return).
  refreshWalletBalance: () => Promise<void>
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

  // mid-flow state — not persisted, cleared once completeLogin() finishes
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [pendingTokens, setPendingTokens] = useState<TokenResponse | null>(null)

  // true until the mount-time rehydration attempt below finishes (success,
  // failure, or "nothing to restore") — see rehydrate() effect
  const [rehydrating, setRehydrating] = useState(true)

  const isSettingNewPin = pendingEmail ? isFirstTimePinForUser(pendingEmail) : true

  // -- Session rehydration --
  //
  // A full-page navigation to Paystack (or any hard reload) wipes all React
  // state, including `user`. Tokens survive in localStorage; this effect
  // reconstructs `user` from the stored access token (decoding its payload
  // for id/email, then re-fetching wallet data) and falls back to
  // /auth/refresh if the access token has expired.

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
      claims: { sub: string; email?: string },
      walletBalance: { balance: number },
      walletAccounts: { accountNumber: string }[]
  ) => {
    const email = claims.email ?? ''
    setUser(buildUser(claims.sub, email, walletBalance.balance, walletAccounts))
    setAuthScreen('dashboard')
    refreshTransactionHistory()
    refreshBillerBeneficiaries()
  }

  // -- Signup --

  const requestSignupOtp = async (email: string) => {
    const normalized = normalizeEmail(email)
    await apiRequestSignupOtp(normalized)
    setPendingEmail(normalized)
  }

  // Resend uses whatever email is already in state — does NOT re-collect or
  // overwrite it, unlike requestSignupOtp which is only for the first send.
  const resendSignupOtp = async () => {
    if (!pendingEmail) {
      throw new Error('Missing email address — please start over')
    }
    await apiRequestSignupOtp(pendingEmail)
  }

  const verifySignupOtp = async (otp: string) => {
    if (!pendingEmail) {
      throw new Error('Missing signup details — please start over')
    }
    const tokens = await apiVerifySignupOtp(pendingEmail, otp)
    setPendingTokens(tokens)
    // deliberately does NOT set isAuthenticated yet — WelcomeBackScreen (the
    // exact same screen/component login uses) finishes the job via completeLogin()
  }

  // -- Login --

  const requestLoginOtp = async (email: string) => {
    const normalized = normalizeEmail(email)
    await apiRequestLoginOtp(normalized)
    setPendingEmail(normalized)
  }

  const verifyLoginOtp = async (otp: string) => {
    if (!pendingEmail) {
      throw new Error('Missing email address — please start over')
    }
    const tokens = await apiVerifyLoginOtp(pendingEmail, otp)
    setPendingTokens(tokens)
  }

  // -- Shared final step: WelcomeBackScreen calls this regardless of whether
  // the user arrived via signup or login --

  const completeLogin = async (pin: string) => {
    if (!pendingTokens || !pendingEmail) {
      throw new Error('Session expired — please log in again')
    }

    // throws "Invalid PIN. Try again." on mismatch; silently records it on first use
    await setOrValidateLocalPin(pendingEmail, pin)

    localStorage.setItem('payxpress_access_token', pendingTokens.accessToken)
    localStorage.setItem('payxpress_refresh_token', pendingTokens.refreshToken)

    // Balance/account number are real (from the wallet endpoints); name/avatar
    // are honest placeholders derived from the email — backend collects no name.
    const [walletBalance, walletAccounts] = await Promise.all([
      fetchWalletBalance(pendingTokens.accessToken),
      fetchWalletAccounts(pendingTokens.accessToken),
    ])

    setUser(
        buildUser(
            pendingTokens.userId,
            pendingTokens.email || pendingEmail,
            walletBalance.balance,
            walletAccounts
        )
    )
    setPendingTokens(null)
    setPendingEmail(null)
    setAuthScreen('dashboard')

    // Fire-and-forget: populate real bill payment history and saved
    // beneficiaries now that we're authenticated. Not awaited so login
    // doesn't stall on these network calls — the dashboard re-renders once
    // they resolve.
    refreshTransactionHistory()
    refreshBillerBeneficiaries()
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

  // Re-fetch the wallet balance after any successful payment. Failures are
  // swallowed — the next refresh/history pull will correct the display.
  const refreshWalletBalance = async () => {
    try {
      const { balance } = await getWalletBalance()
      setUser((prev) => (prev ? { ...prev, accountBalance: balance } : null))
    } catch (err) {
      console.error('Could not refresh wallet balance:', err)
    }
  }

  const addBankContact = (contact: BankContact) => {
    setBankContacts((prev) => [contact, ...prev])
  }

  const addCard = (card: Card) => {
    setCards((prev) => [card, ...prev])
  }

  // GET /billers/beneficiaries — replaces local state with what's actually
  // persisted server-side. Called on rehydrate/login so a refresh shows the
  // real saved list instead of an empty array.
  const refreshBillerBeneficiaries = async () => {
    try {
      const beneficiaries = await fetchBillBeneficiaries()
      setBillerBeneficiaries(beneficiaries)
    } catch (err) {
      console.error('Could not refresh beneficiaries:', err)
    }
  }

  // Persists to the backend first, then updates local state from the real
  // server response (real id/createdAt) — no more local-only entries that
  // vanish on reload. Dedup checks both accountNumber (electricity/cable) and
  // phoneNumber (airtime/data), since a given beneficiary only ever has one
  // or the other set.
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
            refreshWalletBalance,
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

function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase()
}

// Backend stores no name/avatar — derive honest placeholders from the email.
function buildUser(
    id: string,
    email: string,
    balance: number,
    walletAccounts: { accountNumber: string }[]
): User {
  const localPart = email.split('@')[0] || 'user'
  const displayName = localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ') || 'PayXpress User'

  return {
    id,
    name: displayName,
    email,
    accountNumber: walletAccounts[0]?.accountNumber ?? '—',
    accountBalance: balance,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    kyc: { verified: true, level: 'bronze' },
  }
}

// Reads the payload (2nd segment) of a JWT without verifying its signature.
// Safe here because it's only used to pre-fill display data (id, email) —
// every real request still goes through the backend's JwtAuthFilter, which
// verifies the signature server-side. Returns null if the token is malformed.
function decodeJwtPayload(token: string): { sub: string; email?: string } | null {
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
