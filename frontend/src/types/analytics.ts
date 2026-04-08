export interface DateCount {
  date: string;
  count: number;
}

export interface SeverityCount {
  severity: string;
  count: number;
}

export interface FeedbackTypeCount {
  feedback_type: string;
  count: number;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  task_completion: { data: DateCount[] };
  issues_by_severity: { data: SeverityCount[] };
  feedback_distribution: { data: FeedbackTypeCount[] };
  activity_timeline: { data: ActivityDay[] };
}
