import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureStore } from '@reduxjs/toolkit'
import { Provider, useSelector } from 'react-redux'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from './Home'
import cartReducer from '../redux/cartSlice'
import type { RootState } from '../redux/store'

const { collection, getDocs, query, where } = vi.hoisted(() => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}))

const { saveCartItem } = vi.hoisted(() => ({
  saveCartItem: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection,
  getDocs,
  query,
  where,
}))

vi.mock('../firebaseConfig', () => ({
  db: { name: 'mock-db' },
}))

vi.mock('../services/cartStorage', () => ({
  saveCartItem,
}))

function CartStatus() {
  const totalItems = useSelector((state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  )

  return <p>Cart items: {totalItems}</p>
}

function renderHomeIntegration() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const store = configureStore({
    reducer: {
      cart: cartReducer,
    },
  })

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartStatus />
        <Home currentUser={null} onOpenCart={vi.fn()} onSelectProduct={vi.fn()} />
      </QueryClientProvider>
    </Provider>,
  )

  return { store, queryClient }
}

describe('Home integration', () => {
  beforeEach(() => {
    collection.mockImplementation((_db, ...segments) => ({ type: 'collection', segments }))
    query.mockImplementation((...args) => ({ type: 'query', args }))
    where.mockImplementation((...args) => ({ type: 'where', args }))
    getDocs.mockReset()
    saveCartItem.mockReset()
    sessionStorage.clear()
  })

  it('updates the cart UI when a shopper adds a product', async () => {
    const user = userEvent.setup()

    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'prod-1',
          data: () => ({
            title: 'Test Backpack',
            price: 79.99,
            description: 'A durable backpack for testing.',
            category: 'bags',
            image: '/test-backpack.png',
            rating: {
              rate: 4.8,
              count: 21,
            },
          }),
        },
      ],
    })

    const { store } = renderHomeIntegration()

    expect(screen.getByText('Cart items: 0')).toBeInTheDocument()

    const productTitle = await screen.findByRole('heading', { name: 'Test Backpack' })
    const productCard = productTitle.closest('article')

    expect(productCard).not.toBeNull()

    const card = within(productCard as HTMLElement)

    await user.selectOptions(card.getByLabelText('Quantity:'), '3')
    expect(card.getByRole('button', { name: 'Add to cart (3)' })).toBeInTheDocument()

    await user.click(card.getByRole('button', { name: 'Add to cart (3)' }))

    await waitFor(() => {
      expect(screen.getByText('Cart items: 3')).toBeInTheDocument()
    })

    expect(store.getState().cart.items).toEqual([
      {
        id: 'prod-1',
        title: 'Test Backpack',
        price: 79.99,
        image: '/test-backpack.png',
        quantity: 3,
      },
    ])
    expect(saveCartItem).not.toHaveBeenCalled()
  })
})