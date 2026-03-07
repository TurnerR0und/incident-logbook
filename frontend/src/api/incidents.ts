import { api } from "./client";
import type {
  Incident,
  IncidentCreate,
  IncidentUpdate,
  IncidentFilters,
  Comment,
} from "../types";

export function listIncidents(filters: IncidentFilters = {}): Promise<Incident[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.created_after) params.set("created_after", filters.created_after);
  if (filters.created_before) params.set("created_before", filters.created_before);
  if (filters.skip !== undefined) params.set("skip", String(filters.skip));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return api.get<Incident[]>(`/incidents${qs ? `?${qs}` : ""}`);
}

export function getIncident(id: string): Promise<Incident> {
  return api.get<Incident>(`/incidents/${id}`);
}

export function createIncident(data: IncidentCreate): Promise<Incident> {
  return api.post<Incident>("/incidents", data);
}

export function updateIncident(id: string, data: IncidentUpdate): Promise<Incident> {
  return api.patch<Incident>(`/incidents/${id}`, data);
}

export function listComments(incidentId: string): Promise<Comment[]> {
  return api.get<Comment[]>(`/incidents/${incidentId}/comments`);
}

export function addComment(incidentId: string, body: string): Promise<Comment> {
  return api.post<Comment>(`/incidents/${incidentId}/comments`, { body });
}
