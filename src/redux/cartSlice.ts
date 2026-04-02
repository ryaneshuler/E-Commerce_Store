import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type CartItem = {
  id: number
  title: string
  price: number
  image: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const loadCartFromSession = (): CartItem[] => {
  try {
    const saved = sessionStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const initialState: CartState = {
  items: loadCartFromSession(),
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>,
    ) => {
      const quantityToAdd = action.payload.quantity ?? 1
      const existingItem = state.items.find((item) => item.id === action.payload.id)
      if (existingItem) {
        existingItem.quantity += quantityToAdd
      } else {
        state.items.push({ ...action.payload, quantity: quantityToAdd })
      }
      sessionStorage.setItem('cart', JSON.stringify(state.items))
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      sessionStorage.setItem('cart', JSON.stringify(state.items))
    },

    updateQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((item) => item.id !== action.payload.id)
        } else {
          item.quantity = action.payload.quantity
        }
        sessionStorage.setItem('cart', JSON.stringify(state.items))
      }
    },

    clearCart: (state) => {
      state.items = []
      sessionStorage.removeItem('cart')
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions
export default cartSlice.reducer
