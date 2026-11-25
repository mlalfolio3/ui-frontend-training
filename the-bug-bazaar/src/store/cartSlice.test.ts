import { describe, expect, it } from 'vitest'
import type { Product } from '../types.ts'
import { selectCartSummary } from './selectors.ts'
import type { RootState } from './store.ts'
import { addItem, cartReducer, changeQuantity, removeItem } from './cartSlice.ts'

const keyboard: Product = {
  id: 'p-9',
  name: 'Clicky Keyboard',
  price: 600000,
  category: 'keyboards',
  stock: 2,
  rating: 4.4,
  imageUrl: '/images/keyboard.svg',
}

describe('cart reducer', () => {
  it('increases quantity when the same product is added again', () => {
    let state = cartReducer(undefined, addItem(keyboard))
    state = cartReducer(state, addItem(keyboard))
    expect(state.items).toHaveLength(1)
    expect(state.items[0]?.quantity).toBe(2)
  })

  it('does not raise quantity above stock', () => {
    let state = cartReducer(undefined, addItem(keyboard))
    state = cartReducer(state, addItem(keyboard))
    state = cartReducer(state, addItem(keyboard))
    expect(state.items[0]?.quantity).toBe(2)
  })

  it('removes a row and lets decrement remove the last one', () => {
    let state = cartReducer(undefined, addItem(keyboard))
    state = cartReducer(state, changeQuantity({ id: keyboard.id, quantity: 0 }))
    expect(state.items).toEqual([])
    state = cartReducer(state, addItem(keyboard))
    state = cartReducer(state, removeItem(keyboard.id))
    expect(state.items).toEqual([])
  })

  it('derives discount only above Rs. 5,000', () => {
    const state = cartReducer(undefined, addItem(keyboard))
    const summary = selectCartSummary({
      cart: state,
      session: { token: null, user: null },
    } as RootState)
    expect(summary.subtotalCents).toBe(600000)
    expect(summary.discountCents).toBe(60000)
    expect(summary.payableCents).toBe(540000)
    expect(summary.count).toBe(1)
  })
})
