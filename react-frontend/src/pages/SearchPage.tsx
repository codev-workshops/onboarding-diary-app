import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import SearchIcon from '@mui/icons-material/Search'
import apiClient from '../api/client'

interface SearchResult {
  id: string
  type: string
  title: string
  snippet: string
  date: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const response = await apiClient.get<SearchResponse>('/search', { params: { q: query } })
      setResults(response.data)
    } catch {
      setResults({ results: [], total: 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Search</Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth label="Search across all entries" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
        />
        <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>Search</Button>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}

      {results && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{results.total} results</Typography>
          {results.results.map((result) => (
            <Card key={result.id} sx={{ mb: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{result.title}</Typography>
                  <Chip label={result.type} size="small" variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary">{result.date}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{result.snippet}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}
