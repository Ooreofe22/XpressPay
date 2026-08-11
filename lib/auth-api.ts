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
  phone: string
}

// -- Signup --
export function submitBvn(bvn: string): Promise<{ valid: boolean }> {
  return authFetch('/auth/signup/bvn', { method: 'POST', body: JSON.stringify({ bvn }) })
}

export function requestSignupOtp(phone: string): Promise<{ message: string }> {
  return authFetch('/auth/signup/request-otp', { method: 'POST', body: JSON.stringify({ phone }) })
}

export function verifySignupOtp(phone: string, bvn: string, otp: string): Promise<TokenResponse> {
  return authFetch('/auth/signup/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, bvn, otp }),
  })
}

// -- Login --
export function requestLoginOtp(phone: string): Promise<{ message: string }> {
  return authFetch('/auth/login/request-otp', { method: 'POST', body: JSON.stringify({ phone }) })
}

export function verifyLoginOtp(phone: string, otp: string): Promise<TokenResponse> {
  return authFetch('/auth/login/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) })
}

// -- Wallet (used right after PIN confirms, to build the User object for display) --
export function fetchWalletBalance(accessToken: string): Promise<{ balance: number; currency: string }> {
  return authFetch('/wallet/balance', { headers: { Authorization: `Bearer ${accessToken}` } })
}

export function fetchWalletAccounts(
  accessToken: string
): Promise<{ bankName: string; accountNumber: string; accountName: string }[]> {
  return authFetch('/wallet/accounts', { headers: { Authorization: `Bearer ${accessToken}` } })
}
