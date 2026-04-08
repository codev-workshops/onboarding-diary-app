export const TaskCategory = {
  TRAINING: 'training',
  DOCUMENTATION: 'documentation',
  MEETING: 'meeting',
  SETUP: 'setup',
  DEVELOPMENT: 'development',
  OTHER: 'other',
} as const;
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

export const TaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export interface Task {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  date: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskUpdate {
  date?: string;
  title?: string;
  description?: string | null;
  category?: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface PaginatedTaskResponse {
  items: Task[];
  total: number;
  page: number;
  per_page: number;
}
