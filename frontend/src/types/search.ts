export interface SearchResultItem {
  id: string;
  entry_type: "task" | "issue" | "feedback" | "note";
  title: string;
  snippet: string;
  date: string;
  status?: string;
  category?: string;
  severity?: string;
  feedback_type?: string;
  tags?: string[];
  created_at: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  items: SearchResultItem[];
  page: number;
  per_page: number;
}
