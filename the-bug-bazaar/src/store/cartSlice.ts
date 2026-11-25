import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CartItem, Product, StockTick } from '../types.ts'

type CartState = { items: CartItem[] }

const initialState: CartState = { items: [] }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<Product>) {
      const product = action.payload
      if (product.stock <= 0) return
      const existing = state.items.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= existing.product.stock) return
        existing.quantity += 1
        return
      }
      state.items.push({ product, quantity: 1 })
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.product.id !== action.payload)
    },
    changeQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const item = state.items.find((entry) => entry.product.id === action.payload.id)
      if (!item) return
      if (action.payload.quantity <= 0) {
        state.items = state.items.filter((entry) => entry.product.id !== action.payload.id)
        return
      }
      const raising = action.payload.quantity > item.quantity
      if (raising && action.payload.quantity > item.product.stock) return
      item.quantity = action.payload.quantity
    },
    syncStock(state, action: PayloadAction<StockTick>) {
      const item = state.items.find((entry) => entry.product.id === action.payload.id)
      if (!item) return
      item.product.stock = action.payload.stock
    },
    clearCart(state) {
      state.items = []
    },
    replaceCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload
    },
  },
})

export const { addItem, removeItem, changeQuantity, syncStock, clearCart, replaceCart } = cartSlice.actions
export const cartReducer = cartSlice.reducer
