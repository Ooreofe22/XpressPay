
export const ADMIN_EMAIL_ALLOWLIST: string[] = [
  'ooreofepopoola@gmail.com',
    'ooreofepopoola2@gmail.com'
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
