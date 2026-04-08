import { useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import { removeFromCart, updateQuantity, clearCart } from '../redux/cartSlice'
import { createOrderFromCart, deleteCartItem, saveCartItem } from '../services/cartStorage'
import './Cart.css'

type CartProps = {
  currentUser: User | null
  onViewOrders?: () => void
}

function Cart({ currentUser, onViewOrders }: CartProps) {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const cartItems = useSelector((state: RootState) => state.cart.items)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [error, setError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const { totalItems, totalPrice } = useMemo(() => {
    return {
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }
  }, [cartItems])

  const handleRemoveItem = async (id: string) => {
    dispatch(removeFromCart(id))

    if (currentUser) {
      try {
        await deleteCartItem(currentUser.uid, id)
      } catch (removeError: unknown) {
        setError(
          removeError instanceof Error ? removeError.message : 'Could not update your cart.',
        )
      }
    }
  }

  const handleQuantityChange = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      return
    }

    dispatch(updateQuantity({ id, quantity }))

    if (currentUser) {
      const item = cartItems.find((cartItem) => cartItem.id === id)

      if (item) {
        try {
          await saveCartItem(currentUser.uid, {
            ...item,
            quantity,
          })
        } catch (updateError: unknown) {
          setError(
            updateError instanceof Error ? updateError.message : 'Could not sync your cart.',
          )
        }
      }
    }
  }

  const handleCheckout = async () => {
    try {
      setError('')
      setIsCheckingOut(true)

      if (currentUser) {
        await createOrderFromCart(currentUser.uid, currentUser.email ?? '', cartItems)
        await queryClient.invalidateQueries({ queryKey: ['orders', currentUser.uid] })
        setCheckoutMessage('Your order was placed and saved to Firestore.')
      } else {
        setCheckoutMessage('Your order was placed locally. Sign in next time to save order history.')
      }

      dispatch(clearCart())
      setCheckoutSuccess(true)
      setTimeout(() => setCheckoutSuccess(false), 3000)
    } catch (checkoutError: unknown) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Could not complete checkout right now.',
      )
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (cartItems.length === 0 && !checkoutSuccess) {
    return (
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        {!currentUser && (
          <p className="cart-note">Sign in to sync your cart and save order history in Firestore.</p>
        )}
        <div className="cart-empty">
          <p>Your cart is empty</p>
        </div>
      </div>
    )
  }

  if (checkoutSuccess) {
    return (
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        <div className="checkout-success">
          <h2>✓ Checkout Successful!</h2>
          <p>{checkoutMessage}</p>
          <p>Your cart has been cleared.</p>
          {currentUser && onViewOrders && (
            <button className="secondary-action-button" onClick={onViewOrders}>
              View order history
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      {!currentUser && (
        <p className="cart-note">Sign in to sync your cart and save order history in Firestore.</p>
      )}
      {error && <p className="auth-message auth-error">{error}</p>}

      <div className="cart-items">
        {cartItems.map((item) => (
          <div className="cart-item" key={item.id}>
            <img src={item.image} alt={item.title} className="cart-item-image" />

            <div className="cart-item-details">
              <h3>{item.title}</h3>
              <p className="cart-item-price">${item.price.toFixed(2)} each</p>
            </div>

            <div className="cart-item-quantity">
              <label htmlFor={`qty-${item.id}`}>Quantity:</label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => handleQuantityChange(item.id, Number(event.target.value))}
              />
              <p className="cart-item-subtotal">
                Subtotal: ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>

            <button
              className="cart-item-remove"
              onClick={() => handleRemoveItem(item.id)}
              title="Remove from cart"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Total Items:</span>
          <strong>{totalItems}</strong>
        </div>
        <div className="summary-row total-price">
          <span>Total Price:</span>
          <strong>${totalPrice.toFixed(2)}</strong>
        </div>
        <button className="checkout-button" onClick={handleCheckout} disabled={isCheckingOut}>
          {isCheckingOut ? 'Processing checkout...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  )
}

export default Cart
