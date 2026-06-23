import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders the application title', () => {
    render(<App />)
    expect(screen.getByText('Onboarding Diary')).toBeInTheDocument()
  })

  it('renders the welcome message', () => {
    render(<App />)
    expect(
      screen.getByText('Welcome to the Onboarding Diary application.')
    ).toBeInTheDocument()
  })
})
