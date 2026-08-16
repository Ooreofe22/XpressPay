const PIN_STORAGE_PREFIX = 'payxpress_local_pin_'

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** True if this email has never set a local PIN on this device before. */
export function isFirstTimePinForEmail(email: string): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(PIN_STORAGE_PREFIX + email) === null
}

/**
 * First call for an email on this device sets the PIN. Every call after that
 * validates against the stored hash. Throws on mismatch.
 */
export async function setOrValidateLocalPin(email: string, pin: string): Promise<void> {
  const key = PIN_STORAGE_PREFIX + email
  const hash = await sha256(pin)
  const existing = localStorage.getItem(key)

  if (existing === null) {
    localStorage.setItem(key, hash)
    return
  }

  if (existing !== hash) {
    throw new Error('Invalid PIN. Try again.')
  }
}
