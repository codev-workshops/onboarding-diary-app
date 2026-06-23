export interface FeedbackDto {
  id: string
  userId: string
  date: string
  subject: string
  type: FeedbackType
  details: string
  createdAt: string
  updatedAt: string
}

export type FeedbackType = 'Positive' | 'Suggestion' | 'Concern'

export interface CreateFeedbackRequest {
  date: string
  subject: string
  type: FeedbackType
  details: string
}

export interface UpdateFeedbackRequest {
  date?: string
  subject?: string
  type?: FeedbackType
  details?: string
}
