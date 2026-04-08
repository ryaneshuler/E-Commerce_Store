import { useState } from 'react'
import type { FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebaseConfig'

type LoginProps = {
  onLoginSuccess?: () => void
  onSwitchToRegister?: () => void
}

function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!isFirebaseConfigured || !auth) {
      setError('Firebase Authentication is not configured yet.')
      return
    }

    try {
      setIsSubmitting(true)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      setSuccessMessage(`Welcome back, ${userCredential.user.email ?? email}!`)
      setEmail('')
      setPassword('')
      onLoginSuccess?.()
    } catch (loginError: unknown) {
      setError(
        loginError instanceof Error ? loginError.message : 'Login failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* <p className="auth-eyebrow">Firebase Authentication</p> */}
        <h1>Log in</h1>
        <p className="auth-subtitle">Sign in with your registered email and password.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <div className="auth-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
            {onSwitchToRegister && (
              <button
                type="button"
                className="auth-secondary-button"
                onClick={onSwitchToRegister}
              >
                Need an account? Register
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

export default Login
