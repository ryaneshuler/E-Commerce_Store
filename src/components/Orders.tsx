import { useQuery } from '@tanstack/react-query'
import type { User } from 'firebase/auth'
import { loadOrders } from '../services/cartStorage'
import './Cart.css'

type OrdersProps = {
  currentUser: User | null
  onSelectOrder: (orderId: string) => void
}

function Orders({ currentUser, onSelectOrder }: OrdersProps) {
  const {
    data: orders = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['orders', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) {
        return []
      }

      return loadOrders(currentUser.uid)
    },
    enabled: !!currentUser,
  })

  if (!currentUser) {
    return (
      <div className="cart-container">
        <h1>Order History</h1>
        <div className="cart-empty">
          <p>Log in to view your saved Firestore orders.</p>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="cart-container">
        <h1>Order History</h1>
        <p className="loading-message">Loading your orders...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="cart-container">
        <h1>Order History</h1>
        <p className="loading-message error">
          {error instanceof Error ? error.message : 'Could not load your order history.'}
        </p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="cart-container">
        <h1>Order History</h1>
        <div className="cart-empty">
          <p>No saved orders yet. Complete checkout to create your first order.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h1>Order History</h1>

      <div className="orders-list">
        {orders.map((order) => (
          <article
            className="order-card order-card-clickable"
            key={order.id}
            onClick={() => onSelectOrder(order.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectOrder(order.id)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="order-card-header">
              <div>
                <h2>Order #{order.id.slice(0, 8)}</h2>
                <p className="order-meta">Placed: {order.createdAtLabel}</p>
                <p className="order-meta">
                  {order.items.length} product{order.items.length === 1 ? '' : 's'} · Total: ${order.totalPrice.toFixed(2)}
                </p>
              </div>
              <span className="order-status">{order.status}</span>
            </div>

            <ul className="order-product-list">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.id}`}>
                  {item.title} × {item.quantity}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}

export default Orders
