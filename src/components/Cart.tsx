import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import { removeFromCart, updateQuantity, clearCart } from '../redux/cartSlice'
import './Cart.css'

function Cart() {
  const dispatch = useDispatch()
  const cartItems = useSelector((state: RootState) => state.cart.items)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  const { totalItems, totalPrice } = useMemo(() => {
    return {
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }
  }, [cartItems])

  const handleRemoveItem = (id: number) => {
    dispatch(removeFromCart(id))
  }

  const handleQuantityChange = (id: number, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ id, quantity }))
    }
  }

  const handleCheckout = () => {
    dispatch(clearCart())
    setCheckoutSuccess(true)
    setTimeout(() => setCheckoutSuccess(false), 3000)
  }

  if (cartItems.length === 0 && !checkoutSuccess) {
    return (
      <div className="cart-container">
        <h1>Shopping Cart</h1>
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
          <p>Your order has been placed successfully.</p>
          <p>Your cart has been cleared.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>

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
                onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
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
        <button className="checkout-button" onClick={handleCheckout}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}

export default Cart
