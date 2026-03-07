export interface Comment {
  id: string;
  incident_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface CommentCreate {
  body: string;
}