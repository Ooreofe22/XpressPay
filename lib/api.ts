import type { Biller, BillerValidateResult, BillCheckoutResponse, Transaction, BillBeneficiary } from '@/types'

const API_BASE_URL: string = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://xpresspay-backend-production.up.railway.app').replace(/\/+$/,'')

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

export function fetchAllBillers(): Promise<Biller[]> {
  return apiFetch<Biller[]>('/billers')
}

export function fetchBillersByCategory(categoryPath: string): Promise<Biller[]> {
  return apiFetch<Biller[]>(`/billers/${categoryPath}`)
}

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

export function payBillFromWallet(payload: {
  uniqueCode: string
  categoryPath: string
  amount: number
  details: Record<string, unknown>
}): Promise<Transaction> {
  return apiFetch<Transaction>('/wallet/debits/bill-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function toTransaction(raw: any): Transaction {
  return { ...raw, timestamp: new Date(raw.timestamp) }
}

export async function verifyBillerPayment(reference: string): Promise<Transaction> {
  const raw = await apiFetch<Transaction>(`/billers/payments/verify/${reference}`)
  return toTransaction(raw)
}

export async function fetchBillPaymentHistory(): Promise<Transaction[]> {
  const raw = await apiFetch<Transaction[]>('/billers/payments/history')
  return raw.map(toTransaction)
}

export function fetchBillBeneficiaries(): Promise<BillBeneficiary[]> {
  return apiFetch<BillBeneficiary[]>('/billers/beneficiaries')
}

export function createBillBeneficiary(payload: {
  billerUniqueCode: string
  billerCategoryPath: string
  label?: string
  accountNumber?: string
  phoneNumber?: string
  accountType?: string
}): Promise<BillBeneficiary> {
  return apiFetch<BillBeneficiary>('/billers/beneficiaries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteBillBeneficiary(id: string): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/billers/beneficiaries/${id}`, {
    method: 'DELETE',
  })
}
