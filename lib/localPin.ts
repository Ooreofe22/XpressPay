const PIN_STORAGE_PREFIX = 'payxpress_local_pin_'

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function keyFor(identity: string): string {
  // Identity is the account email (post phone→email migration). Normalised so
  // casing differences can't fork a user's PIN into two storage keys.
  return PIN_STORAGE_PREFIX + identity.trim().toLowerCase()
}

/** True if this account has never set a local PIN on this device before. */
export function isFirstTimePinForUser(identity: string): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(keyFor(identity)) === null
}

/**
 * First call for an account on this device sets the PIN. Every call after
 * that validates against the stored hash. Throws on mismatch.
 */
export async function setOrValidateLocalPin(identity: string, pin: string): Promise<void> {
  const key = keyFor(identity)
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
