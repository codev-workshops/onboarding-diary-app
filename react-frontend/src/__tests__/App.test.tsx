import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

vi.mock('../api/auth', () => ({
  authApi: {
    getMe: vi.fn().mockRejectedValue(new Error('no token')),
  },
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeDefined()
  })

  it('shows login page when not authenticated', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })
})
