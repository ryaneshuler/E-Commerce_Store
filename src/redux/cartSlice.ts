import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type CartItem = {
  id: string
  title: string
  price: number
  image: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const persistCartToSession = (items: CartItem[]) => {
  if (items.length === 0) {
    sessionStorage.removeItem('cart')
    return
  }

  sessionStorage.setItem('cart', JSON.stringify(items))
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
      persistCartToSession(state.items)
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      persistCartToSession(state.items)
    },

    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((item) => item.id !== action.payload.id)
        } else {
          item.quantity = action.payload.quantity
        }
        persistCartToSession(state.items)
      }
    },

    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
      persistCartToSession(state.items)
    },

    clearCart: (state) => {
      state.items = []
      persistCartToSession(state.items)
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, setCart, clearCart } = cartSlice.actions
export default cartSlice.reducer
