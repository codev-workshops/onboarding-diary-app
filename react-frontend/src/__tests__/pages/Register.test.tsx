import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Register from '../../pages/Register'
import { TestProviders } from '../helpers/TestProviders'

vi.mock('../../api/auth', () => ({
  authApi: {
    register: vi.fn(),
    getMe: vi.fn().mockRejectedValue(new Error('no token')),
  },
}))

describe('Register', () => {
  it('renders registration form', () => {
    render(
      <TestProviders initialEntries={['/register']}>
        <Register />
      </TestProviders>
    )
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(
      <TestProviders initialEntries={['/register']}>
        <Register />
      </TestProviders>
    )

    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'user@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.click(screen.getByRole('button', { name: /register/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows validation error when name is too short', async () => {
    const user = userEvent.setup()
    render(
      <TestProviders initialEntries={['/register']}>
        <Register />
      </TestProviders>
    )

    await user.type(screen.getByLabelText(/full name/i), 'A')
    await user.type(screen.getByLabelText(/email/i), 'user@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'P@ssw0rd!')
    await user.click(screen.getByRole('button', { name: /register/i }))
    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument()
  })

  it('has link to sign in page', () => {
    render(
      <TestProviders initialEntries={['/register']}>
        <Register />
      </TestProviders>
    )
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})
