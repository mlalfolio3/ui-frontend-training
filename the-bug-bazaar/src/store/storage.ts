import { isProduct } from '../domain/products.ts'
import type { CartItem, SessionUser } from '../types.ts'

export const CART_KEY = 'bug-bazaar-cart'
export const SESSION_KEY = 'bug-bazaar-session'

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return isProduct(item.product) && typeof item.quantity === 'number' && item.quantity > 0
}

function isUser(value: unknown): value is SessionUser {
  if (typeof value !== 'object' || value === null) return false
  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    user.role === 'customer'
  )
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    return []
  }
}

export function loadSession(): { token: string | null; user: SessionUser | null } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return { token: null, user: null }
    const parsed: unknown = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return { token: null, user: null }
    const record = parsed as Record<string, unknown>
    if (typeof record.token !== 'string' || !isUser(record.user)) return { token: null, user: null }
    return { token: record.token, user: record.user }
  } catch {
    return { token: null, user: null }
  }
}
