import { summarizeCart } from '../domain/pricing.ts'
import type { RootState } from './store.ts'

export const selectCartItems = (state: RootState) => state.cart.items

export const selectCartSummary = (state: RootState) => summarizeCart(state.cart.items)

export const selectCartCount = (state: RootState) => selectCartSummary(state).count

export const selectSubtotalCents = (state: RootState) => selectCartSummary(state).subtotalCents

export const selectDiscountCents = (state: RootState) => selectCartSummary(state).discountCents

export const selectPayableCents = (state: RootState) => selectCartSummary(state).payableCents
