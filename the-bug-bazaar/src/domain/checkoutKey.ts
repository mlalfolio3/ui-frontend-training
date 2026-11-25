const STORAGE_KEY = 'bug-bazaar-checkout-key'

export function checkoutKeyFor(signature: string): string {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw) as unknown
      if (typeof parsed === 'object' && parsed !== null) {
        const record = parsed as Record<string, unknown>
        if (record.signature === signature && typeof record.key === 'string') return record.key
      }
    } catch {
      // A broken saved key is replaced below.
    }
  }
  const key = crypto.randomUUID()
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ signature, key }))
  return key
}

export function clearCheckoutKey(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
