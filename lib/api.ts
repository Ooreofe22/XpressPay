import type { Biller, BillerValidateResult, BillCheckoutResponse, Transaction } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

/**
 * TODO: this reads a token that nothing currently writes. AppContext's login()
 * is still fully mocked (setTimeout + hardcoded passcode check, no real backend
 * call), so there's no real JWT anywhere yet. Once the auth screens are wired to
 * POST /auth/login/verify-otp and /auth/signup/verify-otp for real, store the
 * returned accessToken here — e.g. localStorage.setItem('payxpress_access_token', token)
 * right after issueTokens() returns. Until then, GET /billers works (public),
 * but /billers/validate, /billers/payments/initiate, and /billers/payments/history
 * will all 401 since they require a real Bearer token.
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('payxpress_access_token')
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(body.message || `Request failed: ${response.status}`)
  }

  return response.json()
}

/** GET /billers — public, no auth needed. Returns every synced biller across all categories. */
export function fetchAllBillers(): Promise<Biller[]> {
  return apiFetch<Biller[]>('/billers')
}

/** GET /billers/{categoryPath} — public. Use if you want a single category instead of fetchAllBillers(). */
export function fetchBillersByCategory(categoryPath: string): Promise<Biller[]> {
  return apiFetch<Biller[]>(`/billers/${categoryPath}`)
}

/**
 * POST /billers/validate — required before checkout for electricity/cable
 * (requiresValidate: true on the Biller). Returns the customer's name/address
 * (electricity) or package price (cable) to confirm before payment.
 */
export function validateBiller(payload: {
  uniqueCode: string
  categoryPath: string
  accountNumber: string
  accountType?: string
  noOfMonth?: number
}): Promise<BillerValidateResult> {
  return apiFetch<BillerValidateResult>('/billers/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * POST /billers/payments/initiate — creates the PaymentTransaction and returns
 * a Paystack authorizationUrl to redirect the user to.
 */
export function initiateBillerCheckout(payload: {
  uniqueCode: string
  categoryPath: string
  amount: number
  details: Record<string, unknown>
}): Promise<BillCheckoutResponse> {
  return apiFetch<BillCheckoutResponse>('/billers/payments/initiate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * GET /billers/payments/verify/{reference} — call this after the Paystack
 * redirect returns. Actively triggers server-side confirmation (safe to call
 * even if the webhook already handled it) and returns the resulting status.
 */
export function verifyBillerPayment(reference: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/billers/payments/verify/${reference}`)
}

/** GET /billers/payments/history — requires auth. */
export function fetchBillPaymentHistory(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>('/billers/payments/history')
}
