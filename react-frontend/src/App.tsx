import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import theme from './theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <BrowserRouter>
            <Container maxWidth="lg" sx={{ mt: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom>
                Onboarding Diary
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome to the Onboarding Diary application.
              </Typography>
            </Container>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
