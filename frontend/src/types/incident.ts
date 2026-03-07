export type IncidentStatus = 
  | "OPEN"
  | "INVESTIGATING"
  | "MITIGATED"
  | "RESOLVED"
  | "CLOSED";

export type IncidentSeverity = 
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
  
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

// What we send to the API when creating
export interface IncidentCreate {
  title: string;
  description: string;
  severity: IncidentSeverity;
  started_at?: string | null;
  root_cause?: string | null;
}

// What we send to the API when updating
export interface IncidentUpdate {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  started_at?: string | null;
  root_cause?: string | null;
}