export interface DashboardSummary {
  total_tasks: number;
  completed_tasks: number;
  open_issues: number;
  total_feedback: number;
  total_notes: number;
  task_completion_rate: number;
}

export interface RecentEntry {
  id: string;
  entry_type: "task" | "issue" | "feedback" | "note";
  title: string;
  date: string;
  status: string | null;
  created_at: string;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  recent_entries: RecentEntry[];
}

export interface RecruitSummary {
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  summary: DashboardSummary;
}

export interface ManagerDashboardResponse {
  recruits: RecruitSummary[];
  aggregate_summary: DashboardSummary;
}
