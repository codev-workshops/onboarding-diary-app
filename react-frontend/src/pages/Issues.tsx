import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useSnackbar } from 'notistack'
import { issueApi } from '../api/issues'
import type { CreateIssueRequest, IssueSeverity, IssueStatus } from '../types/issue'

const severities: IssueSeverity[] = ['Low', 'Medium', 'High', 'Critical']
const issueStatuses: IssueStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed']

const severityColors: Record<IssueSeverity, 'default' | 'warning' | 'error' | 'error'> = {
  Low: 'default', Medium: 'warning', High: 'error', Critical: 'error',
}

export default function Issues() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateIssueRequest>({
    date: new Date().toISOString().split('T')[0],
    title: '', description: '', severity: 'Medium', status: 'Open',
  })

  const { data, isLoading } = useQuery({ queryKey: ['issues'], queryFn: () => issueApi.list() })

  const createMutation = useMutation({
    mutationFn: issueApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      setOpen(false)
      enqueueSnackbar('Issue created', { variant: 'success' })
    },
    onError: () => enqueueSnackbar('Failed to create issue', { variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: issueApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      enqueueSnackbar('Issue deleted', { variant: 'success' })
    },
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Issues</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Issue</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
            ) : data?.items.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.date}</TableCell>
                <TableCell>{issue.title}</TableCell>
                <TableCell><Chip label={issue.severity} color={severityColors[issue.severity]} size="small" /></TableCell>
                <TableCell>{issue.status}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => deleteMutation.mutate(issue.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Issue</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Description" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as IssueSeverity })}>
              {severities.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as IssueStatus })}>
              {issueStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
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
