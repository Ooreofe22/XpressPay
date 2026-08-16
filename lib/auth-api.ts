const API_BASE_URL: string = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(body.message || `Request failed: ${response.status}`)
  }

  return response.json()
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  balance: number
}

export interface EmailVerifiedResponse {
  message: string
  email: string
}

// ── Signup — step 1 of 2: email + OTP ──────────────────────────────────
export function requestSignupOtp(email: string): Promise<{ message: string }> {
  return authFetch('/auth/signup/request-otp', { method: 'POST', body: JSON.stringify({ email }) })
}

export function verifySignupOtp(email: string, otp: string): Promise<EmailVerifiedResponse> {
  return authFetch('/auth/signup/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

// ── Signup — step 2 of 2: BVN (activates account, seeds wallet, issues tokens) ──
export function submitBvn(email: string, bvn: string): Promise<TokenResponse> {
  return authFetch('/auth/signup/bvn', { method: 'POST', body: JSON.stringify({ email, bvn }) })
}

// ── Login — email + OTP ─────────────────────────────────────────────────
export function requestLoginOtp(email: string): Promise<{ message: string }> {
  return authFetch('/auth/login/request-otp', { method: 'POST', body: JSON.stringify({ email }) })
}

export function verifyLoginOtp(email: string, otp: string): Promise<TokenResponse> {
  return authFetch('/auth/login/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) })
}

export function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  return authFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) })
}

export function fetchWalletBalance(accessToken: string): Promise<{ balance: number; currency: string }> {
  return authFetch('/wallet/balance', { headers: { Authorization: `Bearer ${accessToken}` } })
}

export function fetchWalletAccounts(
    accessToken: string
): Promise<{ bankName: string; accountNumber: string; accountName: string }[]> {
  return authFetch('/wallet/accounts', { headers: { Authorization: `Bearer ${accessToken}` } })
}

// ── Pay with Balance ─────────────────────────────────────────────────────
export interface WalletDebitRequest {
  uniqueCode: string
  categoryPath: string
  amount: number
  details: Record<string, unknown>
}

export interface WalletDebitResponse {
  transactionId: string
  status: string
  xpressReferenceId: string
  billerResponseMessage: string
  amount: number
  newBalance: number
}

export function payBillFromWallet(
    accessToken: string,
    request: WalletDebitRequest
): Promise<WalletDebitResponse> {
  return authFetch('/wallet/debits/bill-payment', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(request),
  })
}
