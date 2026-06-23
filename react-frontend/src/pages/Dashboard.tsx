import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { dashboardApi } from '../api/dashboard'

function StatCard({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4">{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get })

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
  }

  if (!data) return null

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Dashboard</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard title="Total Tasks" value={data.totalTasks} subtitle={`${data.completedTasks} completed`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard title="Open Issues" value={data.openIssues} subtitle={`${data.totalIssues} total`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard title="Feedback" value={data.totalFeedback} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard title="Notes" value={data.totalNotes} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Task Completion</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress variant="determinate" value={data.taskCompletionRate} sx={{ height: 10, borderRadius: 5 }} />
                </Box>
                <Typography variant="body2">{data.taskCompletionRate}%</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {data.completedTasks} of {data.totalTasks} tasks completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Recent Activity</Typography>
              <List dense>
                {data.recentActivity.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemText
                      primary={item.title}
                      secondary={item.date}
                    />
                    <Chip label={item.type} size="small" variant="outlined" />
                  </ListItem>
                ))}
                {data.recentActivity.length === 0 && (
                  <ListItem><ListItemText primary="No recent activity" /></ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
