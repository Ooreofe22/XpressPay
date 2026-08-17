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
import { setOrValidateLocalPin, isFirstTimePinForEmail } from '@/lib/localPin'

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

  // -- Signup — ONE screen collects email + BVN together, then OTP finishes
  // everything (account creation, wallet seed, tokens) in one call --
  requestSignupOtp: (email: string, bvn: string) => Promise<void>
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
  // Re-fetches the real wallet balance from the backend — call after any
  // successful payment (balance debit or Paystack redirect) so the UI never
  // shows a stale number.
  refreshBalance: () => Promise<void>
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
  const [pendingBvn, setPendingBvn] = useState<string | null>(null)
  const [pendingTokens, setPendingTokens] = useState<TokenResponse | null>(null)

  // true until the mount-time rehydration attempt below finishes (success,
  // failure, or "nothing to restore") — see rehydrate() effect
  const [rehydrating, setRehydrating] = useState(true)

  const isSettingNewPin = pendingEmail ? isFirstTimePinForEmail(pendingEmail) : true

  // -- Session rehydration --
  //
  // A full-page navigation to Paystack (or any hard reload) wipes all React
  // state, including `user`. Tokens survive in localStorage, but nothing was
  // reading them back out on mount — so the app always came back up as
  // logged-out, even with valid tokens sitting right there. This effect
  // reconstructs `user` from the stored access token (decoding its payload
  // for id/email, then re-fetching wallet data) and falls back to
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
      claims: { sub: string; email: string },
      walletBalance: { balance: number },
      walletAccounts: { accountNumber: string }[]
  ) => {
    const newUser: User = {
      id: claims.sub,
      name: claims.email.split('@')[0], // placeholder — backend collects no display name
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

  // -- Signup — email + BVN collected together on ONE screen. request-otp
  // format-checks both and sends the code; the account isn't created until
  // verify-otp succeeds, so a typo'd email never leaves a half-made account.

  const requestSignupOtp = async (email: string, bvn: string) => {
    const normalizedEmail = normalizeEmail(email)
    await apiRequestSignupOtp(normalizedEmail, bvn)
    setPendingEmail(normalizedEmail)
    setPendingBvn(bvn)
  }

  // Resend uses whatever email + BVN are already in state — does NOT re-collect them.
  const resendSignupOtp = async () => {
    if (!pendingEmail || !pendingBvn) {
      throw new Error('Missing details — please start over')
    }
    await apiRequestSignupOtp(pendingEmail, pendingBvn)
  }

  // Verify OTP — this is now the ONE step that finishes signup: creates +
  // activates the account, seeds the wallet bonus, generates virtual
  // accounts, and issues tokens, all server-side in a single call. Does NOT
  // set isAuthenticated yet — WelcomeBackScreen (shared with login) finishes
  // the job via completeLogin() once the local PIN is set/confirmed.
  const verifySignupOtp = async (otp: string) => {
    if (!pendingEmail || !pendingBvn) {
      throw new Error('Missing details — please start over')
    }
    const tokens = await apiVerifySignupOtp(pendingEmail, pendingBvn, otp)
    setPendingTokens(tokens)
  }

  // -- Login --

  const requestLoginOtp = async (email: string) => {
    const normalizedEmail = normalizeEmail(email)
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

    // Backend stores { id, email, bvn, balance, status } — no display name/avatar
    // exist server-side. Balance/account number are real (from the wallet
    // endpoints); name/avatar here are honest placeholders, not real backend data.
    const [walletBalance, walletAccounts] = await Promise.all([
      fetchWalletBalance(pendingTokens.accessToken),
      fetchWalletAccounts(pendingTokens.accessToken),
    ])

    const newUser: User = {
      id: pendingTokens.userId,
      name: pendingTokens.email.split('@')[0],
      email: pendingTokens.email,
      accountNumber: walletAccounts[0]?.accountNumber ?? '—',
      accountBalance: walletBalance.balance,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pendingTokens.email}`,
      kyc: { verified: true, level: 'bronze' },
    }

    setUser(newUser)
    setPendingTokens(null)
    setPendingEmail(null)
    setPendingBvn(null)
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

  // GET /wallet/balance — call after ANY successful payment (balance debit or
  // Paystack redirect) so the displayed number is always real, never stale.
  const refreshBalance = async () => {
    const accessToken = localStorage.getItem('payxpress_access_token')
    if (!accessToken) return
    try {
      const { balance } = await fetchWalletBalance(accessToken)
      setUser((prev) => (prev ? { ...prev, accountBalance: balance } : null))
    } catch (err) {
      console.error('Could not refresh balance:', err)
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

function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase()
}

// Reads the payload (2nd segment) of a JWT without verifying its signature.
// Safe here because it's only used to pre-fill display data (id, email) —
// every real request still goes through the backend's JwtAuthFilter, which
// verifies the signature server-side. Returns null if the token is malformed.
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
