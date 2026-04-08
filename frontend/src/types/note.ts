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

export interface NoteCreate {
  date: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface NoteUpdate {
  date?: string;
  title?: string;
  content?: string;
  tags?: string[];
}

export interface PaginatedNoteResponse {
  items: Note[];
  total: number;
  page: number;
  per_page: number;
}
