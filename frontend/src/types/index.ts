export enum IncidentStatus {
  OPEN = "OPEN",
  INVESTIGATING = "INVESTIGATING",
  MITIGATED = "MITIGATED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  created_at: string;
  started_at: string | null;
  resolved_at: string | null;
  updated_at: string;
  root_cause: string | null;
  owner_id: string;
}

export interface Comment {
  id: string;
  incident_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  severity: IncidentSeverity;
  started_at?: string;
  root_cause?: string;
}

export interface IncidentUpdate {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  started_at?: string;
  root_cause?: string;
}

export interface IncidentFilters {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  created_after?: string;
  created_before?: string;
  skip?: number;
  limit?: number;
}
