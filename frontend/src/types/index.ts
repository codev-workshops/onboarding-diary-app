export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "recruit" | "manager" | "admin";
  department: string | null;
  start_date: string | null;
  is_active: boolean;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  per_page: number;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  department?: string;
  start_date?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserUpdateData {
  full_name?: string;
  department?: string | null;
  start_date?: string | null;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface AdminUserUpdateData {
  role?: string;
  is_active?: boolean;
  manager_id?: string | null;
}

export interface AdminUserCreateData {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  department?: string;
}

// --- Task Types ---

export interface Task {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateData {
  date: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
}

export interface TaskUpdateData {
  date?: string;
  title?: string;
  description?: string | null;
  category?: string;
  status?: string;
  priority?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

// --- Issue Types ---

export interface Issue {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueCreateData {
  date: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  resolution_notes?: string;
}

export interface IssueUpdateData {
  date?: string;
  title?: string;
  description?: string;
  severity?: string;
  status?: string;
  resolution_notes?: string | null;
}

// --- Feedback Types ---

export interface Feedback {
  id: string;
  user_id: string;
  date: string;
  subject: string;
  type: string;
  details: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreateData {
  date: string;
  subject: string;
  type: string;
  details: string;
}

export interface FeedbackUpdateData {
  date?: string;
  subject?: string;
  type?: string;
  details?: string;
}

// --- Note Types ---

export interface Note {
  id: string;
  user_id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteCreateData {
  date: string;
  title: string;
  content: string;
  tags: string[];
}

export interface NoteUpdateData {
  date?: string;
  title?: string;
  content?: string;
  tags?: string[];
}

// --- Dashboard Types ---

export interface DashboardSummary {
  total_tasks: number;
  completed_tasks: number;
  open_issues: number;
  total_feedback: number;
  total_notes: number;
}

export interface RecentTask {
  id: string;
  date: string;
  title: string;
  category: string;
  status: string;
  priority: string;
}

export interface RecentIssue {
  id: string;
  date: string;
  title: string;
  severity: string;
  status: string;
}

export interface RecentFeedback {
  id: string;
  date: string;
  subject: string;
  type: string;
}

export interface RecentNote {
  id: string;
  date: string;
  title: string;
  tags: string[];
}

export interface DashboardData {
  summary: DashboardSummary;
  task_completion_rate: number;
  recent_tasks: RecentTask[];
  recent_issues: RecentIssue[];
  recent_feedback: RecentFeedback[];
  recent_notes: RecentNote[];
}

export interface ManagerRecruit {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  start_date: string | null;
}

export interface ManagerDashboardData {
  recruits: ManagerRecruit[];
  aggregate_summary: DashboardSummary & { task_completion_rate: number };
}

// --- Report Types ---

export interface ReportGenerateData {
  date_from: string;
  date_to: string;
  type: string;
  format: string;
  user_id?: string;
}

export interface Report {
  id: string;
  generated_by: string;
  target_user_id: string | null;
  date_from: string;
  date_to: string;
  report_type: string;
  format: string;
  created_at: string;
}

// --- Search Types ---

export interface SearchResult {
  id: string;
  type: "task" | "issue" | "feedback" | "note";
  title: string;
  snippet: string;
  date: string;
  metadata: Record<string, string | string[]>;
  created_at: string | null;
}

export interface SearchResponse {
  items: SearchResult[];
  total: number;
  page: number;
  per_page: number;
  query: string;
  type_filter: string;
}

// --- Analytics Types ---

export interface TasksOverTime {
  period: string;
  created: number;
  completed: number;
}

export interface SeverityCount {
  severity: string;
  count: number;
}

export interface FeedbackTypeCount {
  type: string;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface Milestone {
  day: number;
  date: string;
  reached: boolean;
  tasks_completed: number;
  tasks_total: number;
  completion_rate: number;
}

export interface OnboardingProgress {
  start_date: string | null;
  current_day: number;
  milestones: Milestone[];
}

export interface AnalyticsData {
  period: string;
  tasks_over_time: TasksOverTime[];
  issue_severity: SeverityCount[];
  feedback_types: FeedbackTypeCount[];
  task_status: StatusCount[];
  task_priority: PriorityCount[];
  onboarding_progress: OnboardingProgress;
}

// --- Checklist Types ---

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface ChecklistAssignment {
  id: string;
  checklist_id: string;
  user_id: string;
  assigned_at: string;
  user_name: string | null;
}

export interface ChecklistData {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
  assignments: ChecklistAssignment[];
  progress: number;
}

export interface ChecklistCreateData {
  title: string;
  description?: string;
  items: { title: string; description?: string; order: number }[];
}

export interface ChecklistProgress {
  checklist_id: string;
  checklist_title: string;
  total_items: number;
  completed_items: number;
  completion_rate: number;
  items: ChecklistItem[];
}

// --- Notification Types ---

export interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationData[];
  total: number;
  unread_count: number;
  page: number;
  per_page: number;
}
