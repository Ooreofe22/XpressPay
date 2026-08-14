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
    const err = new Error(body.message || `Request failed: ${response.status}`) as Error & { status?: number }
    err.status = response.status
    throw err
  }

  return response.json()
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
}

// ── Email + OTP auth ─────────────────────────────────────────────────────
// Signup: request-otp sends the code, verify-otp creates the account and
// returns tokens. Login: same two-step shape against the login endpoints.
// Error messages come straight from the backend:
//   signup request 409 → "An account with this email already exists"
//   login request  404 → "No account found for this email"
//   verify         400 → "Invalid code" · 410 → "Code expired"

export function requestSignupOtp(email: string): Promise<{ message: string }> {
  return authFetch('/auth/signup/request-otp', { method: 'POST', body: JSON.stringify({ email }) })
}

export function verifySignupOtp(email: string, otp: string): Promise<TokenResponse> {
  return authFetch('/auth/signup/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

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
