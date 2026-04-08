export type Role = "recruit" | "manager" | "admin";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  department: string | null;
  startDate: string | null;
  managerId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type TaskCategory = "training" | "documentation" | "meeting" | "setup" | "development" | "other";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "on_hold";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type Task = {
  id: string;
  userId: string;
  date: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  date: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
};

export type UpdateTaskInput = {
  date?: string;
  title?: string;
  description?: string | null;
  category?: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
};

export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";

export type Issue = {
  id: string;
  userId: string;
  date: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateIssueInput = {
  date: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status?: IssueStatus;
  resolutionNotes?: string;
};

export type UpdateIssueInput = {
  date?: string;
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  resolutionNotes?: string | null;
};

// Feedback types
export type FeedbackType = "positive" | "suggestion" | "concern";

export type Feedback = {
  id: string;
  userId: string;
  date: string;
  subject: string;
  type: FeedbackType;
  details: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFeedbackInput = {
  date: string;
  subject: string;
  type: FeedbackType;
  details: string;
};

export type UpdateFeedbackInput = {
  date?: string;
  subject?: string;
  type?: FeedbackType;
  details?: string;
};

// Note types
export type Note = {
  id: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateNoteInput = {
  date: string;
  title: string;
  content: string;
  tags?: string[];
};

export type UpdateNoteInput = {
  date?: string;
  title?: string;
  content?: string;
  tags?: string[];
};

// Dashboard types
export type DashboardSummary = {
  totalTasks: number;
  completedTasks: number;
  openIssues: number;
  totalFeedback: number;
  totalNotes: number;
  taskCompletionRate: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  recentTasks: Array<{
    id: string;
    date: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    category: TaskCategory;
  }>;
  recentIssues: Array<{
    id: string;
    date: string;
    title: string;
    status: IssueStatus;
    severity: IssueSeverity;
  }>;
  recentFeedback: Array<{
    id: string;
    date: string;
    subject: string;
    type: FeedbackType;
  }>;
  recentNotes: Array<{
    id: string;
    date: string;
    title: string;
    tags: string[];
  }>;
};
