import { useState } from 'react'
import type { FormEvent } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebaseConfig'
import { createUserProfileDocument } from '../services/userProfile'

type RegisterProps = {
  onRegisterSuccess?: () => void
  onSwitchToLogin?: () => void
}

function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!isFirebaseConfigured || !auth) {
      setError('Add your Firebase app settings to the Vite environment variables before registering users.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      })

      await createUserProfileDocument(userCredential.user.uid, {
        email,
        name,
        address,
      })

      const welcomeName = name.trim() || userCredential.user.email || email
      setSuccessMessage(`Welcome, ${welcomeName}! Your account has been created.`)
      setName('')
      setAddress('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      onRegisterSuccess?.()
    } catch (registrationError: unknown) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : 'Registration failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* <p className="auth-eyebrow">Firebase Authentication</p> */}
        <h1>Create an account</h1>
        <p className="auth-subtitle">
          Register with your email and password to start saving carts and checking out faster.
        </p>

        {!isFirebaseConfigured && (
          <div className="auth-message auth-warning">
            Add your Firebase credentials in <code>.env</code> using the <code>VITE_FIREBASE_*</code>{' '}
            variables first.
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />

          <label htmlFor="register-address">Address</label>
          <input
            id="register-address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="123 Main St"
            autoComplete="street-address"
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
          />

          <label htmlFor="register-confirm-password">Confirm password</label>
          <input
            id="register-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
          />

          <div className="auth-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Register'}
            </button>
            {onSwitchToLogin && (
              <button type="button" className="auth-secondary-button" onClick={onSwitchToLogin}>
                Already have an account? Log in
              </button>
            )}
          </div>
        </form>

        {error && <p className="auth-message auth-error">{error}</p>}
        {successMessage && <p className="auth-message auth-success">{successMessage}</p>}
      </section>
    </main>
  )
}

export default Register
