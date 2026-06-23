import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Login from '../../pages/Login'
import { TestProviders } from '../helpers/TestProviders'

vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn().mockRejectedValue(new Error('no token')),
  },
}))

describe('Login', () => {
  it('renders sign in form', () => {
    render(
      <TestProviders initialEntries={['/login']}>
        <Login />
      </TestProviders>
    )
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation error when email is empty', async () => {
    const user = userEvent.setup()
    render(
      <TestProviders initialEntries={['/login']}>
        <Login />
      </TestProviders>
    )

    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  })

  it('shows validation error when password is empty', async () => {
    const user = userEvent.setup()
    render(
      <TestProviders initialEntries={['/login']}>
        <Login />
      </TestProviders>
    )

    await user.type(screen.getByLabelText(/email/i), 'user@test.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('has link to register page', () => {
    render(
      <TestProviders initialEntries={['/login']}>
        <Login />
      </TestProviders>
    )
    expect(screen.getByText(/register/i)).toBeInTheDocument()
  })
})
