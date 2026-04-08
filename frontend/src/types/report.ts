export interface ReportGenerateRequest {
  date_from: string;
  date_to: string;
  type: "tasks" | "issues" | "feedback" | "combined";
  format: "pdf" | "csv";
  user_id?: string;
}

export interface ReportGenerateResponse {
  report_id: string;
  download_url: string;
}

export interface ReportRecord {
  id: string;
  generated_by: string;
  target_user_id: string | null;
  date_from: string;
  date_to: string;
  report_type: string;
  format: string;
  created_at: string;
}

export interface PaginatedReportResponse {
  items: ReportRecord[];
  total: number;
  page: number;
  per_page: number;
}

export interface RecruitOption {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}
