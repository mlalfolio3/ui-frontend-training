import type { CartItem, CartSummary } from '../types.ts'

/** 10% off only when the total is above Rs. 5,000. Rs. 5,000 itself is not discounted. */
export function discountFor(totalRupees: number): number {
  return totalRupees > 5000 ? totalRupees * 0.1 : 0
}

export function payableTotal(totalRupees: number): number {
  return totalRupees - discountFor(totalRupees)
}

export function formatRupeesFromCents(cents: number): string {
  const rupees = cents / 100
  return `Rs. ${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function summarizeCart(items: CartItem[]): CartSummary {
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )
  const discountCents = Math.round(discountFor(subtotalCents / 100) * 100)
  return {
    count,
    subtotalCents,
    discountCents,
    payableCents: subtotalCents - discountCents,
  }
}

export function cartSignature(items: CartItem[]): string {
  return items.map((item) => `${item.product.id}:${item.quantity}`).join('|')
}
