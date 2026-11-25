import { configureStore } from '@reduxjs/toolkit'
import { cartReducer } from './cartSlice.ts'
import { CART_KEY, loadCart, loadSession, SESSION_KEY } from './storage.ts'
import { sessionReducer } from './sessionSlice.ts'

const session = loadSession()

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    session: sessionReducer,
  },
  preloadedState: {
    cart: { items: loadCart() },
    session,
  },
})

store.subscribe(() => {
  const state = store.getState()
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart.items))
  if (state.session.token && state.session.user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session))
  } else {
    sessionStorage.removeItem(SESSION_KEY)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
