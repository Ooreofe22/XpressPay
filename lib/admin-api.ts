import type { AdminAccount, AdminBiller, AdminStats, AdminTransaction } from '@/types/admin'

/**
 * Admin API client for xpressPay-backend.
 *
 * Auth model: every /admin/** route is permitAll() at the Spring Security
 * layer (see SecurityConfig.java) — the only gate is the X-Admin-Key header,
 * checked inside AdminController/BillerSyncController against admin.api-key.
 * This is intentionally basic, shared-secret auth, not per-admin JWT roles.
 * See lib/admin-auth.ts for where the key is stored client-side.
 *
 * Unlike the rest of the app, requests here do NOT fall back to mock data on
 * failure — an admin silently looking at fake data is worse than an admin
 * seeing an error. Callers should catch and surface `AdminApiError`.
 */

const API_BASE_URL: string = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://xpresspay-backend-production.up.railway.app'
).replace(/\/+$/, '')

export class AdminApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'AdminApiError'
  }
}

function getAdminKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('payxpress_admin_key')
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const key = getAdminKey()
  if (!key) throw new AdminApiError(401, 'No admin key set — sign in again.')

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': key,
      ...(init?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    throw new AdminApiError(401, 'Admin key rejected by the server.')
  }
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      /* non-JSON error body, keep default message */
    }
    throw new AdminApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ---- Accounts ------------------------------------------------------------

export function listAccounts(): Promise<AdminAccount[]> {
  return request<AdminAccount[]>('/admin/accounts')
}

export function getAccount(id: string): Promise<{ account: AdminAccount; flaggedTransactions: AdminTransaction[] }> {
  return request(`/admin/accounts/${id}`)
}

export function deactivateAccount(id: string): Promise<{ status: string }> {
  return request(`/admin/accounts/${id}/deactivate`, { method: 'POST' })
}

export function reactivateAccount(id: string): Promise<{ status: string }> {
  return request(`/admin/accounts/${id}/reactivate`, { method: 'POST' })
}

export function deleteAccount(id: string): Promise<void> {
  return request(`/admin/accounts/${id}`, { method: 'DELETE' })
}

// ---- Transactions ----------------------------------------------------------

export function listTransactions(): Promise<AdminTransaction[]> {
  return request<AdminTransaction[]>('/admin/transactions')
}

export function listFlaggedTransactions(): Promise<AdminTransaction[]> {
  return request<AdminTransaction[]>('/admin/transactions/flagged')
}

export function listReconciliationTransactions(): Promise<AdminTransaction[]> {
  return request<AdminTransaction[]>('/admin/transactions/reconciliation')
}

/**
 * GET /billers/payments/verify/{reference} — permitAll(), re-runs
 * confirmPayment() server-side. Safe to call twice; doubles as the admin
 * "re-verify with Paystack" action. Does NOT need the admin key.
 */
export async function requeryTransaction(reference: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/billers/payments/verify/${reference}`)
  if (!res.ok) throw new AdminApiError(res.status, `Verify failed: ${res.status}`)
  return res.json()
}

// ---- Billers ---------------------------------------------------------------

export function listBillers(): Promise<AdminBiller[]> {
  return request<AdminBiller[]>('/admin/billers')
}

export function setBillerActive(id: string, active: boolean): Promise<AdminBiller> {
  return request(`/admin/billers/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) })
}

export function syncBillers(): Promise<{ message: string }> {
  return request('/admin/billers/sync', { method: 'POST' })
}

// ---- Stats -------------------------------------------------------------

export function getStats(): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats')
}
