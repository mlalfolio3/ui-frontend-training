import { describe, expect, it } from 'vitest'
import type { CartItem, Product } from '../types.ts'
import { discountFor, payableTotal, summarizeCart } from './pricing.ts'

const duck: Product = {
  id: 'p-1',
  name: 'Rubber Duck',
  price: 25000,
  category: 'ducks',
  stock: 5,
  rating: 4.2,
  imageUrl: '/images/duck.svg',
}

describe('discountFor', () => {
  it('returns 0 at and below Rs. 5,000', () => {
    expect(discountFor(0)).toBe(0)
    expect(discountFor(5000)).toBe(0)
  })

  it('returns 10% above Rs. 5,000', () => {
    expect(discountFor(5001)).toBeCloseTo(500.1)
    expect(discountFor(10000)).toBe(1000)
  })

  it('subtracts the discount from the payable total', () => {
    expect(payableTotal(5000)).toBe(5000)
    expect(payableTotal(10000)).toBe(9000)
  })
})

describe('summarizeCart', () => {
  it('counts quantity and keeps the 5000 boundary', () => {
    const cheap: CartItem = { product: { ...duck, price: 500000 }, quantity: 1 }
    const over: CartItem = { product: { ...duck, price: 500100 }, quantity: 1 }
    expect(summarizeCart([cheap]).discountCents).toBe(0)
    expect(summarizeCart([over]).discountCents).toBe(50010)
    expect(summarizeCart([{ product: duck, quantity: 2 }]).count).toBe(2)
  })

  it('returns zeros for an empty cart', () => {
    expect(summarizeCart([])).toEqual({
      count: 0,
      subtotalCents: 0,
      discountCents: 0,
      payableCents: 0,
    })
  })
})
