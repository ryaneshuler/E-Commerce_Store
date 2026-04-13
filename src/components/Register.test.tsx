import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { createUserProfileDocument } from '../services/userProfile'
import Register from './Register'

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}))

jest.mock('../firebaseConfig', () => ({
  auth: { name: 'mock-auth' },
  isFirebaseConfigured: true,
}))

jest.mock('../services/userProfile', () => ({
  createUserProfileDocument: jest.fn(),
}))

describe('Register', () => {
  const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.Mock
  const mockUpdateProfile = updateProfile as jest.Mock
  const mockCreateUserProfileDocument = createUserProfileDocument as jest.Mock

  beforeEach(() => {
    mockCreateUserWithEmailAndPassword.mockReset()
    mockUpdateProfile.mockReset()
    mockCreateUserProfileDocument.mockReset()
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
    expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled()
    expect(mockUpdateProfile).not.toHaveBeenCalled()
    expect(mockCreateUserProfileDocument).not.toHaveBeenCalled()
  })

  it('creates an account, persists the profile, and clears the form on success', async () => {
    const user = userEvent.setup()
    const handleRegisterSuccess = jest.fn()
    const firebaseUser = {
      uid: 'user-123',
      email: 'casey@example.com',
    }

    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser })
    mockUpdateProfile.mockResolvedValue(undefined)
    mockCreateUserProfileDocument.mockResolvedValue(undefined)

    render(<Register onRegisterSuccess={handleRegisterSuccess} />)

    await user.type(screen.getByLabelText('Name'), 'Casey Shopper')
    await user.type(screen.getByLabelText('Address'), '123 Market St')
    await user.type(screen.getByLabelText('Email'), 'casey@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret1')
    await user.type(screen.getByLabelText('Confirm password'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        { name: 'mock-auth' },
        'casey@example.com',
        'secret1',
      )
    })

    expect(mockUpdateProfile).toHaveBeenCalledWith(firebaseUser, {
      displayName: 'Casey Shopper',
    })
    expect(mockCreateUserProfileDocument).toHaveBeenCalledWith('user-123', {
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