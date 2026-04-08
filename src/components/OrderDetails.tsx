import { useQuery } from '@tanstack/react-query'
import type { User } from 'firebase/auth'
import { loadOrders } from '../services/cartStorage'
import './Cart.css'

type OrderDetailsProps = {
  currentUser: User | null
  orderId: string
  onBack: () => void
}

function OrderDetails({ currentUser, orderId, onBack }: OrderDetailsProps) {
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

  const order = orders.find((entry) => entry.id === orderId)

  if (!currentUser) {
    return (
      <div className="cart-container">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back to orders
        </button>
        <div className="cart-empty">
          <p>Log in to view order details.</p>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="cart-container">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back to orders
        </button>
        <p className="loading-message">Loading order details...</p>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="cart-container">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back to orders
        </button>
        <p className="loading-message error">
          {error instanceof Error ? error.message : 'Could not load that order.'}
        </p>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to orders
      </button>
      <h1>Order #{order.id.slice(0, 8)}</h1>
      <p className="order-meta">Placed: {order.createdAtLabel}</p>
      <span className="order-status">{order.status}</span>

      <div className="order-items">
        {order.items.map((item) => (
          <div className="order-item order-item-card" key={`${order.id}-${item.id}`}>
            <img src={item.image} alt={item.title} className="order-item-image" />
            <div>
              <h3>{item.title}</h3>
              <p>
                Qty {item.quantity} · ${item.price.toFixed(2)} each
              </p>
              <p>Subtotal: ${(item.quantity * item.price).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary order-summary">
        <div className="summary-row">
          <span>Total Items:</span>
          <strong>{order.totalItems}</strong>
        </div>
        <div className="summary-row total-price">
          <span>Total Price:</span>
          <strong>${order.totalPrice.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
