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
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { useSnackbar } from 'notistack'
import { taskApi } from '../api/tasks'
import type { CreateTaskRequest, TaskCategory, TaskStatus, TaskPriority } from '../types/task'

const categories: TaskCategory[] = ['Setup', 'Training', 'Documentation', 'Meeting', 'Development', 'Other']
const statuses: TaskStatus[] = ['NotStarted', 'InProgress', 'Completed', 'Blocked']
const priorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical']

const statusColors: Record<TaskStatus, 'default' | 'primary' | 'success' | 'error'> = {
  NotStarted: 'default', InProgress: 'primary', Completed: 'success', Blocked: 'error',
}

export default function Tasks() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateTaskRequest>({
    date: new Date().toISOString().split('T')[0],
    title: '', description: '', category: 'Setup', status: 'NotStarted', priority: 'Medium',
  })

  const { data, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => taskApi.list() })

  const createMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setOpen(false)
      setForm({ date: new Date().toISOString().split('T')[0], title: '', description: '', category: 'Setup', status: 'NotStarted', priority: 'Medium' })
      enqueueSnackbar('Task created', { variant: 'success' })
    },
    onError: () => enqueueSnackbar('Failed to create task', { variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      enqueueSnackbar('Task deleted', { variant: 'success' })
    },
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New Task</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
            ) : data?.items.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.date}</TableCell>
                <TableCell>{task.title}</TableCell>
                <TableCell>{task.category}</TableCell>
                <TableCell><Chip label={task.status} color={statusColors[task.status]} size="small" /></TableCell>
                <TableCell>{task.priority}</TableCell>
                <TableCell>
                  <IconButton size="small"><EditIcon /></IconButton>
                  <IconButton size="small" onClick={() => deleteMutation.mutate(task.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Description" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}>
              {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
              {priorities.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
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
