import { useState } from 'react'
import Home from './components/Home'
import Cart from './components/Cart'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'cart'>('home')

  return (
    <div className="app">
      <nav className="app-nav">
        <button
          className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentPage('home')}
        >
          Home
        </button>
      </nav>

      {currentPage === 'home' ? <Home onOpenCart={() => setCurrentPage('cart')} /> : <Cart />}
    </div>
  )
}

export default App
