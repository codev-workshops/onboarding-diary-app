import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useSnackbar } from 'notistack'
import { noteApi } from '../api/notes'
import type { CreateNoteRequest } from '../types/note'

export default function Notes() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateNoteRequest>({
    date: new Date().toISOString().split('T')[0],
    title: '', content: '', tags: [],
  })
  const [tagInput, setTagInput] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['notes'], queryFn: () => noteApi.list() })

  const createMutation = useMutation({
    mutationFn: noteApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setOpen(false)
      setForm({ date: new Date().toISOString().split('T')[0], title: '', content: '', tags: [] })
      enqueueSnackbar('Note created', { variant: 'success' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: noteApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      enqueueSnackbar('Note deleted', { variant: 'success' })
    },
  })

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Notes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Note</Button>
      </Box>

      {isLoading ? <Typography>Loading...</Typography> : (
        <Grid container spacing={2}>
          {data?.items.map((note) => (
            <Grid key={note.id} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{note.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{note.date}</Typography>
                  <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {note.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton size="small" onClick={() => deleteMutation.mutate(note.id)}><DeleteIcon /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Note</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Content" multiline rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Add tag" size="small" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
              <Button onClick={addTag}>Add</Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {form.tags.map((tag) => (
                <Chip key={tag} label={tag} onDelete={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })} size="small" />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
