import { useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useDispatch, useSelector } from 'react-redux'
import Home from './components/Home'
import Cart from './components/Cart'
import Register from './components/Register'
import Login from './components/Login'
import Profile from './components/Profile'
import CreateProduct from './components/CreateProduct'
import ProductDetails from './components/ProductDetails'
import Orders from './components/Orders'
import OrderDetails from './components/OrderDetails'
import { auth } from './firebaseConfig'
import { clearCart, setCart } from './redux/cartSlice'
import type { RootState } from './redux/store'
import { loadCartItems } from './services/cartStorage'
import './App.css'

type Page =
  | 'home'
  | 'register'
  | 'login'
  | 'cart'
  | 'profile'
  | 'create-product'
  | 'product-details'
  | 'orders'
  | 'order-details'

function App() {
  const dispatch = useDispatch()
  const cartItems = useSelector((state: RootState) => state.cart.items)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const displayName = currentUser?.displayName ?? currentUser?.email?.split('@')[0] ?? 'shopper'
  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)

      if (user) {
        void loadCartItems(user.uid)
          .then((items) => {
            dispatch(setCart(items))
          })
          .catch(() => {
            dispatch(clearCart())
          })
      } else {
        dispatch(clearCart())
      }
    })

    return unsubscribe
  }, [dispatch])

  const handleLogout = async () => {
    await signOut(auth)
    setCurrentPage('home')
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-links">
          <button
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            Home
          </button>
          {currentUser ? (
            <>
              <button
                className={`nav-button ${currentPage === 'create-product' ? 'active' : ''}`}
                onClick={() => setCurrentPage('create-product')}
              >
                Add Product
              </button>
              <button className="nav-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-button ${currentPage === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentPage('login')}
              >
                Login
              </button>
              <button
                className={`nav-button ${currentPage === 'register' ? 'active' : ''}`}
                onClick={() => setCurrentPage('register')}
              >
                Register
              </button>
            </>
          )}
        </div>

        <div className="nav-auth">
          {currentUser && (
            <>
              <button
                className={`nav-user nav-user-button ${currentPage === 'profile' ? 'active' : ''}`}
                onClick={() => setCurrentPage('profile')}
              >
                Hi, {displayName}
              </button>
              <button
                className={`nav-button ${currentPage === 'orders' ? 'active' : ''}`}
                onClick={() => setCurrentPage('orders')}
              >
                Orders
              </button>
            </>
          )}
          <button
            className={`nav-button ${currentPage === 'cart' ? 'active' : ''}`}
            onClick={() => setCurrentPage('cart')}
          >
            Cart
            {cartItemCount > 0 && <span className="header-cart-count">{cartItemCount}</span>}
          </button>
        </div>
      </nav>

      {currentPage === 'home' ? (
        <Home
          currentUser={currentUser}
          onOpenCart={() => setCurrentPage('cart')}
          onSelectProduct={(productId) => {
            setSelectedProductId(productId)
            setCurrentPage('product-details')
          }}
        />
      ) : currentPage === 'register' ? (
        <Register
          onRegisterSuccess={() => setCurrentPage('profile')}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      ) : currentPage === 'login' ? (
        <Login
          onLoginSuccess={() => setCurrentPage('profile')}
          onSwitchToRegister={() => setCurrentPage('register')}
        />
      ) : currentPage === 'create-product' ? (
        <CreateProduct currentUser={currentUser} />
      ) : currentPage === 'product-details' && selectedProductId ? (
        <ProductDetails
          productId={selectedProductId}
          currentUser={currentUser}
          onBack={() => setCurrentPage('home')}
          onDeleted={() => {
            setSelectedProductId(null)
            setCurrentPage('home')
          }}
        />
      ) : currentPage === 'orders' ? (
        <Orders
          currentUser={currentUser}
          onSelectOrder={(orderId) => {
            setSelectedOrderId(orderId)
            setCurrentPage('order-details')
          }}
        />
      ) : currentPage === 'order-details' && selectedOrderId ? (
        <OrderDetails
          currentUser={currentUser}
          orderId={selectedOrderId}
          onBack={() => setCurrentPage('orders')}
        />
      ) : currentPage === 'profile' && currentUser ? (
        <Profile
          currentUser={currentUser}
          onDeleteAccount={() => setCurrentPage('home')}
          onViewOrders={() => setCurrentPage('orders')}
          onSelectOrder={(orderId) => {
            setSelectedOrderId(orderId)
            setCurrentPage('order-details')
          }}
        />
      ) : (
        <Cart currentUser={currentUser} onViewOrders={() => setCurrentPage('orders')} />
      )}
    </div>
  )
}

export default App
