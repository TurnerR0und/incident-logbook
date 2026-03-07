import { apiClient } from './client';
import type { Incident, IncidentCreate, IncidentUpdate } from '../types/incident';

export const incidentApi = {
  list: async (): Promise<Incident[]> => {
    const response = await apiClient.get<Incident[]>('/incidents');
    return response.data;
  },
  
  create: async (data: IncidentCreate): Promise<Incident> => {
    const response = await apiClient.post<Incident>('/incidents', data);
    return response.data;
  },

  // NEW: Fetch a single incident
  get: async (id: string): Promise<Incident> => {
    const response = await apiClient.get<Incident>(`/incidents/${id}`);
    return response.data;
  },

  // NEW: Update an incident (PATCH)
  update: async (id: string, data: IncidentUpdate): Promise<Incident> => {
    const response = await apiClient.patch<Incident>(`/incidents/${id}`, data);
    return response.data;
  }
};