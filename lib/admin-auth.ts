/**
 * Client-side admin gate. Two things are required to reach /admin:
 *   1. The logged-in user's email (from their regular session JWT) is on
 *      ADMIN_EMAIL_ALLOWLIST below.
 *   2. A valid X-Admin-Key is stored in localStorage (entered once at
 *      /admin/login, checked against admin.api-key on the backend).
 *
 * This is NOT real authorization — it's a client-side speed bump. The actual
 * security boundary is the X-Admin-Key check on the server; anyone with the
 * key can call /admin/** endpoints directly regardless of this allowlist.
 * Swap for a real admin role on the User entity + JWT claim before this goes
 * anywhere beyond internal/demo use.
 */
export const ADMIN_EMAIL_ALLOWLIST: string[] = [
  'ooreofepopoola@gmail.com'
]

const ADMIN_KEY_STORAGE = 'payxpress_admin_key'
const USER_TOKEN_STORAGE = 'payxpress_access_token'

export function getAdminKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_KEY_STORAGE)
}

export function setAdminKey(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_KEY_STORAGE, key)
}

export function clearAdminKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_KEY_STORAGE)
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(USER_TOKEN_STORAGE)
  if (!token) return null
  const claims = decodeJwtPayload(token)
  const email = claims?.email ?? claims?.sub
  return typeof email === 'string' ? email : null
}

export function isAllowlistedAdminEmail(email: string | null): boolean {
  if (!email) return false
  return ADMIN_EMAIL_ALLOWLIST.map((e) => e.toLowerCase()).includes(email.toLowerCase())
}

/** True only when both the allowlist and the stored admin key check out. */
export function hasAdminAccess(): boolean {
  return isAllowlistedAdminEmail(getCurrentUserEmail()) && !!getAdminKey()
}
