import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import { addToCart } from '../redux/cartSlice'

type Product = {
  id: number
  title: string
  price: number
  description: string
  category: string
  image: string
  rating: {
    rate: number
    count: number
  }
}

type DummyJsonProduct = {
  id: number
  title: string
  price: number
  description: string
  category: string
  thumbnail: string
  rating: number
  stock: number
}

type DummyJsonCategory = {
  slug: string
  name: string
  url: string
}

type DummyJsonResponse = {
  products: DummyJsonProduct[]
}

const mapProducts = (products: DummyJsonProduct[]): Product[] => {
  return products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    description: product.description,
    category: product.category,
    image: product.thumbnail,
    rating: {
      rate: product.rating,
      count: product.stock,
    },
  }))
}

const getProducts = async (category: string): Promise<Product[]> => {
  const endpoint =
    category === 'all'
      ? 'https://dummyjson.com/products?limit=100'
      : `https://dummyjson.com/products/category/${encodeURIComponent(category)}?limit=100`

  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error('Could not fetch products. Please try again.')
  }

  const data: DummyJsonResponse = await response.json()
  return mapProducts(data.products)
}

const getCategories = async (): Promise<DummyJsonCategory[]> => {
  const response = await fetch('https://dummyjson.com/products/categories')

  if (!response.ok) {
    throw new Error('Could not fetch categories. Please try again.')
  }

  return response.json()
}

type HomeProps = {
  onOpenCart: () => void
}

function Home({ onOpenCart }: HomeProps) {
  const dispatch = useDispatch()
  const cartItems = useSelector((state: RootState) => state.cart.items)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [quantityByProduct, setQuantityByProduct] = useState<Record<number, number>>({})

  const {
    data: products = [],
    isPending: isProductsPending,
    isError: isProductsError,
    error: productsError,
  } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => getProducts(selectedCategory),
  })

  const {
    data: categories = [],
    isPending: isCategoriesPending,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )

  const filteredProducts = useMemo(() => {
    const min = minPrice === '' ? undefined : Number(minPrice)
    const max = maxPrice === '' ? undefined : Number(maxPrice)

    return products.filter((product) => {
      const isMinValid = min === undefined || (!Number.isNaN(min) && product.price >= min)
      const isMaxValid = max === undefined || (!Number.isNaN(max) && product.price <= max)
      const isRatingValid = product.rating.rate >= minRating
      return isMinValid && isMaxValid && isRatingValid
    })
  }, [products, minPrice, maxPrice, minRating])

  const handleAddToCart = (product: Product) => {
    const quantity = quantityByProduct[product.id] ?? 1

    dispatch(
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity,
      }),
    )
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    setQuantityByProduct((current) => ({
      ...current,
      [productId]: quantity,
    }))
  }

  const resetFilters = () => {
    setSelectedCategory('all')
    setMinPrice('')
    setMaxPrice('')
    setMinRating(0)
  }

  return (
    <main className="store-page">
      <header className="store-header">
        <button className="store-title-button" onClick={resetFilters}>
          Not Fake Store
        </button>
        <button className="header-cart-button" onClick={onOpenCart}>
          Cart
          {cartItemCount > 0 && <span className="header-cart-count">{cartItemCount}</span>}
        </button>
      </header>

      <div className="store-layout">
        <aside className="store-sidebar">
          <h2>Filters</h2>

          <div className="filter-group">
            <label htmlFor="category-select">Category</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              disabled={isCategoriesPending}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            {isCategoriesError && (
              <p className="filter-note error">Could not load categories. Showing all.</p>
            )}
          </div>

          <div className="filter-group">
            <p className="filter-title">Price range</p>
            <label htmlFor="min-price">Minimum price</label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="0"
            />

            <label htmlFor="max-price">Maximum price</label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="500"
            />
          </div>

          <div className="filter-group">
            <p className="filter-title">Minimum reviews</p>
            <div className="rating-buttons">
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className={`rating-button ${minRating === rating ? 'active' : ''}`}
                  onClick={() => setMinRating(rating)}
                >
                  {rating === 0 ? 'All' : `${rating}★`}
                </button>
              ))}
            </div>
          </div>

          <p className="results-count">Showing {filteredProducts.length} products</p>
        </aside>

        <section className="products-panel">
          {isProductsPending ? (
            <p className="loading-message">Loading products...</p>
          ) : isProductsError ? (
            <p className="loading-message error">{productsError.message}</p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <img src={product.image} alt={product.title} className="product-image" />
                  <h2>{product.title}</h2>
                  <p className="category">Category: {product.category}</p>
                  <p className="description">{product.description}</p>
                  <p className="price">Price: ${product.price.toFixed(2)}</p>
                  <p className="rate">Reviews: {product.rating.rate} / 5</p>
                  <label className="quantity-label" htmlFor={`quantity-${product.id}`}>
                    Quantity:
                  </label>
                  <select
                    id={`quantity-${product.id}`}
                    className="quantity-select"
                    value={quantityByProduct[product.id] ?? 1}
                    onChange={(event) =>
                      handleQuantityChange(product.id, Number(event.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                      <option key={qty} value={qty}>
                        {qty}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => handleAddToCart(product)}>
                    Add to cart ({quantityByProduct[product.id] ?? 1})
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Home
