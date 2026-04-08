import { useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { useQueryClient } from '@tanstack/react-query'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type CreateProductProps = {
  currentUser: User | null
}

const normalizeCategory = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-')

function CreateProduct({ currentUser }: CreateProductProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState('')
  const [rating, setRating] = useState('5')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    const parsedPrice = Number(price)
    const parsedRating = Number(rating)

    if (!currentUser) {
      setError('Please log in before adding a product.')
      return
    }

    if (!title.trim() || !description.trim() || !category.trim() || !image.trim()) {
      setError('Please fill out all product fields before submitting.')
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
      setIsSubmitting(true)

      await addDoc(collection(db, 'products'), {
        title: title.trim(),
        price: parsedPrice,
        description: description.trim(),
        category: normalizeCategory(category),
        image: image.trim(),
        rating: {
          rate: parsedRating,
          count: 1,
        },
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email ?? '',
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ])

      setSuccessMessage(`"${title.trim()}" was added to Firestore.`)
      setTitle('')
      setPrice('')
      setDescription('')
      setCategory('')
      setImage('')
      setRating('5')
    } catch (productError: unknown) {
      setError(
        productError instanceof Error
          ? productError.message
          : 'Could not create the product. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card product-form-card">
        <h1>Create a new product</h1>
        <p className="auth-subtitle">
          Add a Firestore product with a title, price, description, category, image URL, and
          starting rating.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="product-title">Title</label>
          <input
            id="product-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add title"
            required
          />

          <label htmlFor="product-price">Price</label>
          <input
            id="product-price"
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Add price"
            required
          />

          <label htmlFor="product-description">Description</label>
          <textarea
            id="product-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the product"
            rows={4}
            required
          />

          <label htmlFor="product-category">Category</label>
          <input
            id="product-category"
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Add category (e.g. electronics, clothing, etc.)"
            required
          />

          <label htmlFor="product-image">Image URL</label>
          <input
            id="product-image"
            type="url"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="https://example.com/product.jpg"
            required
          />

          {image.trim() !== '' && (
            <img className="product-preview-image" src={image} alt={title || 'Product preview'} />
          )}

          <label htmlFor="product-rating">Rating</label>
          <input
            id="product-rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            placeholder="4.5"
            required
          />
          {/* <p className="form-helper-text">
            This value is saved as <code>rating.rate</code> in Firestore and starts with{' '}
            <code>rating.count = 1</code>.
          </p> */}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving product...' : 'Create product'}
          </button>
        </form>

        {error && <p className="auth-message auth-error">{error}</p>}
        {successMessage && <p className="auth-message auth-success">{successMessage}</p>}
      </section>
    </main>
  )
}

export default CreateProduct
