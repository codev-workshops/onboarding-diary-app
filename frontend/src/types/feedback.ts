export const FeedbackType = {
  POSITIVE: 'positive',
  SUGGESTION: 'suggestion',
  CONCERN: 'concern',
} as const;
export type FeedbackType = (typeof FeedbackType)[keyof typeof FeedbackType];

export interface Feedback {
  id: string;
  user_id: string;
  date: string;
  subject: string;
  type: FeedbackType;
  details: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreate {
  date: string;
  subject: string;
  type: FeedbackType;
  details: string;
}

export interface FeedbackUpdate {
  date?: string;
  subject?: string;
  type?: FeedbackType;
  details?: string;
}

export interface PaginatedFeedbackResponse {
  items: Feedback[];
  total: number;
  page: number;
  per_page: number;
}
