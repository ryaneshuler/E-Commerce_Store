import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signInWithEmailAndPassword } from 'firebase/auth'
import Login from './Login'

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}))

jest.mock('../firebaseConfig', () => ({
  auth: { name: 'mock-auth' },
  isFirebaseConfigured: true,
}))

describe('Login', () => {
  const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.Mock

  beforeEach(() => {
    mockSignInWithEmailAndPassword.mockReset()
  })

  it('renders the login form and lets the user switch to registration', async () => {
    const user = userEvent.setup()
    const handleSwitchToRegister = jest.fn()

    render(<Login onSwitchToRegister={handleSwitchToRegister} />)

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Need an account? Register' }))

    expect(handleSwitchToRegister).toHaveBeenCalledTimes(1)
  })

  it('submits credentials, shows a success message, and clears the form', async () => {
    const user = userEvent.setup()
    const handleLoginSuccess = jest.fn()

    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: {
        email: 'shopper@example.com',
      },
    })

    render(<Login onLoginSuccess={handleLoginSuccess} />)

    await user.type(screen.getByLabelText('Email'), 'shopper@example.com')
    await user.type(screen.getByLabelText('Password'), 'super-secret')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        { name: 'mock-auth' },
        'shopper@example.com',
        'super-secret',
      )
    })

    expect(await screen.findByText('Welcome back, shopper@example.com!')).toBeInTheDocument()
    expect(handleLoginSuccess).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })
})