export interface TaskDto {
  id: string
  userId: string
  date: string
  title: string
  description: string
  category: TaskCategory
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
}

export type TaskCategory = 'Setup' | 'Training' | 'Documentation' | 'Meeting' | 'Development' | 'Other'
export type TaskStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Blocked'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface CreateTaskRequest {
  date: string
  title: string
  description: string
  category: TaskCategory
  status: TaskStatus
  priority: TaskPriority
}

export interface UpdateTaskRequest {
  date?: string
  title?: string
  description?: string
  category?: TaskCategory
  status?: TaskStatus
  priority?: TaskPriority
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  perPage: number
}
