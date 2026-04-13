import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Register from './Register'

const { createUserWithEmailAndPassword, updateProfile, createUserProfileDocument } = vi.hoisted(
  () => ({
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    createUserProfileDocument: vi.fn(),
  }),
)

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword,
  updateProfile,
}))

vi.mock('../firebaseConfig', () => ({
  auth: { name: 'mock-auth' },
  isFirebaseConfigured: true,
}))

vi.mock('../services/userProfile', () => ({
  createUserProfileDocument,
}))

describe('Register', () => {
  beforeEach(() => {
    createUserWithEmailAndPassword.mockReset()
    updateProfile.mockReset()
    createUserProfileDocument.mockReset()
  })

  it('shows a validation error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<Register />)

    await user.type(screen.getByLabelText('Name'), 'Casey Shopper')
    await user.type(screen.getByLabelText('Email'), 'casey@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.type(screen.getByLabelText('Confirm password'), 'secret2')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled()
    expect(updateProfile).not.toHaveBeenCalled()
    expect(createUserProfileDocument).not.toHaveBeenCalled()
  })

  it('creates an account, persists the profile, and clears the form on success', async () => {
    const user = userEvent.setup()
    const handleRegisterSuccess = vi.fn()
    const firebaseUser = {
      uid: 'user-123',
      email: 'casey@example.com',
    }

    createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })
    updateProfile.mockResolvedValue(undefined)
    createUserProfileDocument.mockResolvedValue(undefined)

    render(<Register onRegisterSuccess={handleRegisterSuccess} />)

    await user.type(screen.getByLabelText('Name'), 'Casey Shopper')
    await user.type(screen.getByLabelText('Address'), '123 Market St')
    await user.type(screen.getByLabelText('Email'), 'casey@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.type(screen.getByLabelText('Confirm password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        { name: 'mock-auth' },
        'casey@example.com',
        'secret1',
      )
    })

    expect(updateProfile).toHaveBeenCalledWith(firebaseUser, {
      displayName: 'Casey Shopper',
    })
    expect(createUserProfileDocument).toHaveBeenCalledWith('user-123', {
      email: 'casey@example.com',
      name: 'Casey Shopper',
      address: '123 Market St',
    })
    expect(
      await screen.findByText('Welcome, Casey Shopper! Your account has been created.'),
    ).toBeInTheDocument()
    expect(handleRegisterSuccess).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Address')).toHaveValue('')
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByLabelText('Confirm password')).toHaveValue('')
  })
})