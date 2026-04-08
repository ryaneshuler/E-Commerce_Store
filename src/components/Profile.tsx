import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { deleteUser, updateProfile } from 'firebase/auth'
import { useQuery } from '@tanstack/react-query'
import { loadOrders } from '../services/cartStorage'
import {
  deleteUserProfileDocument,
  getUserProfileDocument,
  updateUserProfileDocument,
} from '../services/userProfile'

type ProfileProps = {
  currentUser: User
  onDeleteAccount?: () => void
  onViewOrders?: () => void
  onSelectOrder?: (orderId: string) => void
}

function Profile({ currentUser, onDeleteAccount, onViewOrders, onSelectOrder }: ProfileProps) {
  const [name, setName] = useState(currentUser.displayName ?? '')
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { data: recentOrders = [], isPending: areOrdersPending } = useQuery({
    queryKey: ['orders', currentUser.uid],
    queryFn: () => loadOrders(currentUser.uid),
  })

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        setIsLoading(true)
        setError('')
        const profile = await getUserProfileDocument(currentUser.uid)

        if (!isMounted) {
          return
        }

        setName(profile?.name ?? currentUser.displayName ?? '')
        setAddress(profile?.address ?? '')
      } catch (profileError: unknown) {
        if (!isMounted) {
          return
        }

        setError(
          profileError instanceof Error
            ? profileError.message
            : 'Could not load your profile right now.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [currentUser])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError('')
      setSuccessMessage('')

      await updateUserProfileDocument(currentUser.uid, {
        email: currentUser.email ?? '',
        name,
        address,
      })

      await updateProfile(currentUser, {
        displayName: name.trim(),
      })

      setSuccessMessage('Profile updated successfully.')
    } catch (profileError: unknown) {
      setError(
        profileError instanceof Error ? profileError.message : 'Could not update your profile.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account and profile data?',
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setError('')
      setSuccessMessage('')

      await deleteUserProfileDocument(currentUser.uid)
      await deleteUser(currentUser)
      onDeleteAccount?.()
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete your account right now.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="profile-page-layout">
        <section className="auth-card profile-card">
          <h1>Your profile</h1>
          <p className="auth-subtitle">View and manage the profile details stored in Firestore.</p>

          {isLoading ? (
            <p className="auth-message">Loading your profile...</p>
          ) : (
            <div className="auth-form">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" type="email" value={currentUser.email ?? ''} readOnly />

              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />

              <label htmlFor="profile-address">Address</label>
              <input
                id="profile-address"
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="123 Main St"
              />

              <div className="auth-actions">
                <button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save profile'}
                </button>
                <button
                  type="button"
                  className="auth-danger-button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting account...' : 'Delete account'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="auth-message auth-error">{error}</p>}
          {successMessage && <p className="auth-message auth-success">{successMessage}</p>}
        </section>

        <aside
          className="auth-card recent-orders-card"
          onClick={() => onViewOrders?.()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onViewOrders?.()
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="recent-orders-header">
            <div>
              <h2>Recent orders</h2>
              <p className="auth-subtitle">Your 3 most recent Firestore orders.</p>
            </div>
            <span className="recent-orders-link">View all</span>
          </div>

          {areOrdersPending ? (
            <p className="auth-message">Loading recent orders...</p>
          ) : recentOrders.length === 0 ? (
            <p className="auth-message">No orders yet. Once you check out, they will appear here.</p>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.slice(0, 3).map((order) => (
                <button
                  type="button"
                  className="recent-order-button"
                  key={order.id}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectOrder?.(order.id)
                  }}
                >
                  <strong>Order #{order.id.slice(0, 8)}</strong>
                  <ul className="recent-order-products">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.id}`}>{item.title}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default Profile
