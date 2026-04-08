import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type ProductDetailsProps = {
  productId: string
  currentUser: User | null
  onBack: () => void
  onDeleted: () => void
}

type ProductRecord = {
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

const getProductById = async (productId: string): Promise<ProductRecord> => {
  const snapshot = await getDoc(doc(db, 'products', productId))

  if (!snapshot.exists()) {
    throw new Error('This product could not be found.')
  }

  const data = snapshot.data()
  const rawRating = data.rating

  return {
    id: snapshot.id,
    title: data.title ?? 'Untitled product',
    price: Number(data.price ?? 0),
    description: data.description ?? 'No description available.',
    category: data.category ?? 'uncategorized',
    image: data.image ?? 'https://via.placeholder.com/600x400?text=No+Image',
    rating: {
      rate: typeof rawRating === 'number' ? Number(rawRating) : Number(rawRating?.rate ?? 0),
      count: typeof rawRating === 'number' ? 1 : Number(rawRating?.count ?? 0),
    },
  }
}

function ProductDetails({ productId, currentUser, onBack, onDeleted }: ProductDetailsProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState('')
  const [rating, setRating] = useState('0')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    data: product,
    isPending,
    isError,
    error: productError,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductById(productId),
  })

  useEffect(() => {
    if (!product) {
      return
    }

    setTitle(product.title)
    setPrice(product.price.toString())
    setDescription(product.description)
    setCategory(product.category)
    setImage(product.image)
    setRating(product.rating.rate.toString())
  }, [product])

  const handleSave = async () => {
    if (!currentUser) {
      setError('Please log in to edit products.')
      return
    }

    const parsedPrice = Number(price)
    const parsedRating = Number(rating)

    if (!title.trim() || !description.trim() || !category.trim() || !image.trim()) {
      setError('Please fill out all product fields before saving.')
      return
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a number greater than 0.')
      return
    }

    if (Number.isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      setError('Rating must be between 0 and 5.')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      setSuccessMessage('')

      await updateDoc(doc(db, 'products', productId), {
        title: title.trim(),
        price: parsedPrice,
        description: description.trim(),
        category: category.trim().toLowerCase().replace(/\s+/g, '-'),
        image: image.trim(),
        rating: {
          rate: parsedRating,
          count: product?.rating.count ?? 1,
        },
        updatedAt: serverTimestamp(),
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['product', productId] }),
      ])

      setSuccessMessage('Product updated successfully.')
    } catch (updateError: unknown) {
      setError(
        updateError instanceof Error ? updateError.message : 'Could not update the product.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUser) {
      setError('Please log in to delete products.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this product from Firestore?',
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setError('')
      setSuccessMessage('')

      await deleteDoc(doc(db, 'products', productId))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ])

      onDeleted()
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Could not delete the product.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isPending) {
    return (
      <main className="auth-page">
        <section className="auth-card product-detail-card">
          <button type="button" className="back-button" onClick={onBack}>
            ← Back to store
          </button>
          <p className="loading-message">Loading product...</p>
        </section>
      </main>
    )
  }

  if (isError || !product) {
    return (
      <main className="auth-page">
        <section className="auth-card product-detail-card">
          <button type="button" className="back-button" onClick={onBack}>
            ← Back to store
          </button>
          <p className="auth-message auth-error">
            {productError instanceof Error ? productError.message : 'Could not load this product.'}
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card product-detail-card">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back to store
        </button>

        <div className="product-detail-layout">
          <img className="product-detail-image" src={image} alt={title || product.title} />

          <div className="product-detail-summary">
            <h1>{product.title}</h1>
            <p className="price">Price: ${product.price.toFixed(2)}</p>
            <p className="rate">
              Rating: {product.rating.rate.toFixed(1)} / 5 ({product.rating.count} review
              {product.rating.count === 1 ? '' : 's'})
            </p>
            <p className="category">Category: {product.category}</p>
            <p className="description">{product.description}</p>
          </div>
        </div>

        {!currentUser && (
          <p className="auth-message auth-warning">
            Log in to edit or delete this product.
          </p>
        )}

        <div className="auth-form">
          <label htmlFor="detail-title">Title</label>
          <input
            id="detail-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!currentUser}
          />

          <label htmlFor="detail-price">Price</label>
          <input
            id="detail-price"
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            disabled={!currentUser}
          />

          <label htmlFor="detail-description">Description</label>
          <textarea
            id="detail-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!currentUser}
          />

          <label htmlFor="detail-category">Category</label>
          <input
            id="detail-category"
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={!currentUser}
          />

          <label htmlFor="detail-image">Image URL</label>
          <input
            id="detail-image"
            type="url"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            disabled={!currentUser}
          />

          <label htmlFor="detail-rating">Rating</label>
          <input
            id="detail-rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            disabled={!currentUser}
          />

          {currentUser && (
            <div className="auth-actions">
              <button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving changes...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="auth-danger-button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting product...' : 'Delete product'}
              </button>
            </div>
          )}
        </div>

        {error && <p className="auth-message auth-error">{error}</p>}
        {successMessage && <p className="auth-message auth-success">{successMessage}</p>}
      </section>
    </main>
  )
}

export default ProductDetails
