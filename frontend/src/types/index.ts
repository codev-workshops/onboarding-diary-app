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

// Report types
export type ReportCategory = "tasks" | "issues" | "feedback" | "combined";
export type ReportFormat = "pdf" | "csv";

// Manager types
export type RecruitStats = {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  startDate: string | null;
  isActive: boolean;
  createdAt: string;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  openIssues: number;
  totalEntries: number;
};

export type ManagerDashboardData = {
  recruits: RecruitStats[];
  aggregate: {
    totalRecruits: number;
    avgTaskCompletionRate: number;
    totalOpenIssues: number;
  };
};

export type RecruitListItem = {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  startDate: string | null;
  isActive: boolean;
  createdAt: string;
};

// Admin types
export type AdminUser = {
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
  manager: { id: string; fullName: string; email: string } | null;
};

export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  department?: string;
  startDate?: string;
};

export type UpdateUserInput = {
  fullName?: string;
  role?: Role;
  department?: string;
  startDate?: string;
};

export type AdminDashboardData = {
  users: {
    total: number;
    byRole: { recruit: number; manager: number; admin: number };
    active: number;
    inactive: number;
  };
  entries: {
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    totalIssues: number;
    openIssues: number;
    totalFeedback: number;
    totalNotes: number;
  };
};

export type ManagerOption = {
  id: string;
  fullName: string;
  email: string;
};

// Checklist types
export type ChecklistTemplateItem = {
  id: string;
  label: string;
  sortOrder: number;
};

export type ChecklistTemplate = {
  id: string;
  title: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; fullName: string };
  items: ChecklistTemplateItem[];
  assignments?: Array<{
    id: string;
    recruitId: string;
    recruit: { id: string; fullName: string; email: string };
    createdAt: string;
  }>;
};

export type RecruitChecklistItem = {
  id: string;
  isCompleted: boolean;
  completedAt: string | null;
  templateItem: ChecklistTemplateItem;
};

export type RecruitChecklist = {
  id: string;
  createdAt: string;
  template: {
    id: string;
    title: string;
    description: string | null;
  };
  items: RecruitChecklistItem[];
  totalItems: number;
  completedItems: number;
  progressPercent: number;
};

export type ChecklistProgress = {
  totalChecklists: number;
  totalItems: number;
  completedItems: number;
  overallPercent: number;
  checklists: Array<{
    title: string;
    total: number;
    completed: number;
    percent: number;
  }>;
};

// Analytics types
export type TaskOverTimePoint = {
  date: string;
  total: number;
  completed: number;
};

export type SeverityCount = {
  severity: string;
  count: number;
};

export type SentimentCount = {
  type: string;
  count: number;
};

export type AnalyticsData = {
  tasksOverTime: TaskOverTimePoint[];
  issuesBySeverity: SeverityCount[];
  feedbackSentiment: SentimentCount[];
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
