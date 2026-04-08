export const IssueSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type IssueSeverity = (typeof IssueSeverity)[keyof typeof IssueSeverity];

export const IssueStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

export interface Issue {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueCreate {
  date: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status?: IssueStatus;
  resolution_notes?: string | null;
}

export interface IssueUpdate {
  date?: string;
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  resolution_notes?: string | null;
}

export interface PaginatedIssueResponse {
  items: Issue[];
  total: number;
  page: number;
  per_page: number;
}
