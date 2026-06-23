import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import theme from '../../theme'
import { AuthProvider } from '../../context/AuthContext'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

export function TestProviders({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode
  initialEntries?: string[]
}) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
