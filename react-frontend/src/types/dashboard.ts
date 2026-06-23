export interface DashboardDto {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  totalIssues: number
  openIssues: number
  resolvedIssues: number
  totalFeedback: number
  totalNotes: number
  taskCompletionRate: number
  recentActivity: RecentEntryDto[]
}

export interface RecentEntryDto {
  id: string
  type: string
  title: string
  date: string
  createdAt: string
}
