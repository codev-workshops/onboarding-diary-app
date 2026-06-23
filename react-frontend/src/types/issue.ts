export interface IssueDto {
  id: string
  userId: string
  date: string
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  resolutionNotes?: string
  createdAt: string
  updatedAt: string
}

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type IssueStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'

export interface CreateIssueRequest {
  date: string
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  resolutionNotes?: string
}

export interface UpdateIssueRequest {
  date?: string
  title?: string
  description?: string
  severity?: IssueSeverity
  status?: IssueStatus
  resolutionNotes?: string
}
