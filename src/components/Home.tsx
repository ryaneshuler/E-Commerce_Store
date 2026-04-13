import { useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import { addToCart } from '../redux/cartSlice'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { saveCartItem } from '../services/cartStorage'

type Product = {
  id: string
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

type CategoryOption = {
  slug: string
  name: string
}

const formatCategoryName = (value: string) =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

const getProducts = async (category: string): Promise<Product[]> => {
  const productsRef = collection(db, 'products')
  const productsQuery =
    category === 'all'
      ? query(productsRef)
      : query(productsRef, where('category', '==', category))

  const snapshot = await getDocs(productsQuery)

  return snapshot.docs.map((productDoc) => {
    const data = productDoc.data()
    const rawRating = data.rating
    const rate =
      typeof rawRating === 'number' ? Number(rawRating) : Number(rawRating?.rate ?? 0)
    const count =
      typeof rawRating === 'number' ? 1 : Number(rawRating?.count ?? 0)

    return {
      id: productDoc.id,
      title: data.title ?? 'Untitled product',
      price: Number(data.price ?? 0),
      description: data.description ?? 'No description available.',
      category: data.category ?? 'uncategorized',
      image: data.image ?? 'https://via.placeholder.com/300x300?text=No+Image',
      rating: {
        rate,
        count,
      },
    }
  })
}

const getCategories = async (): Promise<CategoryOption[]> => {
  const snapshot = await getDocs(collection(db, 'products'))
  const categories = new Map<string, CategoryOption>()

  snapshot.docs.forEach((productDoc) => {
    const category = productDoc.data().category

    if (typeof category === 'string' && category.trim() !== '' && !categories.has(category)) {
      categories.set(category, {
        slug: category,
        name: formatCategoryName(category),
      })
    }
  })

  return Array.from(categories.values()).sort((left, right) => left.name.localeCompare(right.name))
}

type HomeProps = {
  onOpenCart: () => void
  onSelectProduct: (productId: string) => void
  currentUser: User | null
}

function Home({ onSelectProduct, currentUser }: HomeProps) {
  const dispatch = useDispatch()
  const cartItems = useSelector((state: RootState) => state.cart.items)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [quantityByProduct, setQuantityByProduct] = useState<Record<string, number>>({})

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
    const existingQuantity = cartItems.find((item) => item.id === product.id)?.quantity ?? 0
    const nextQuantity = existingQuantity + quantity

    dispatch(
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity,
      }),
    )

    if (currentUser) {
      void saveCartItem(currentUser.uid, {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: nextQuantity,
      })
    }
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
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
                <article
                  className="product-card"
                  key={product.id}
                  onClick={() => onSelectProduct(product.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelectProduct(product.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <img src={product.image} alt={product.title} className="product-image" />
                  <h2>{product.title}</h2>
                  <p className="category">Category: {product.category}</p>
                  <p className="description">{product.description}</p>
                  <p className="price">Price: ${product.price.toFixed(2)}</p>
                  <p className="rate">
                    Rating: {product.rating.rate.toFixed(1)} / 5 ({product.rating.count} review
                    {product.rating.count === 1 ? '' : 's'})
                  </p>
                  <label
                    className="quantity-label"
                    htmlFor={`quantity-${product.id}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Quantity:
                  </label>
                  <select
                    id={`quantity-${product.id}`}
                    className="quantity-select"
                    value={quantityByProduct[product.id] ?? 1}
                    onClick={(event) => event.stopPropagation()}
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
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      handleAddToCart(product)
                    }}
                  >
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
