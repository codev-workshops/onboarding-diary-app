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
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useSnackbar } from 'notistack'
import { feedbackApi } from '../api/feedback'
import type { CreateFeedbackRequest, FeedbackType } from '../types/feedback'

const feedbackTypes: FeedbackType[] = ['Positive', 'Suggestion', 'Concern']
const typeColors: Record<FeedbackType, 'success' | 'info' | 'warning'> = {
  Positive: 'success', Suggestion: 'info', Concern: 'warning',
}

export default function FeedbackPage() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateFeedbackRequest>({
    date: new Date().toISOString().split('T')[0],
    subject: '', type: 'Positive', details: '',
  })

  const { data, isLoading } = useQuery({ queryKey: ['feedback'], queryFn: () => feedbackApi.list() })

  const createMutation = useMutation({
    mutationFn: feedbackApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
      setOpen(false)
      enqueueSnackbar('Feedback submitted', { variant: 'success' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: feedbackApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
      enqueueSnackbar('Feedback deleted', { variant: 'success' })
    },
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Feedback</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Feedback</Button>
      </Box>

      {isLoading ? <Typography>Loading...</Typography> : (
        <Grid container spacing={2}>
          {data?.items.map((fb) => (
            <Grid key={fb.id} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">{fb.subject}</Typography>
                    <Chip label={fb.type} color={typeColors[fb.type]} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{fb.date}</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>{fb.details}</Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" onClick={() => deleteMutation.mutate(fb.id)}><DeleteIcon /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <TextField select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FeedbackType })}>
              {feedbackTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Details" multiline rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
