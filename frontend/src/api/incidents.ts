import { apiClient } from './client';
import type { Incident, IncidentCreate, IncidentUpdate } from '../types/incident';
import type { IncidentSeverity, IncidentStatus } from '../types/incident';

export interface ListIncidentParams {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  owner_email?: string;
}

export const incidentApi = {
  list: async (params?: ListIncidentParams): Promise<Incident[]> => {
    const response = await apiClient.get<Incident[]>('/incidents', { params });
    return response.data;
  },
  
  create: async (data: IncidentCreate): Promise<Incident> => {
    const response = await apiClient.post<Incident>('/incidents', data);
    return response.data;
  },

  get: async (id: string): Promise<Incident> => {
    const response = await apiClient.get<Incident>(`/incidents/${id}`);
    return response.data;
  },

  update: async (id: string, data: IncidentUpdate): Promise<Incident> => {
    const response = await apiClient.patch<Incident>(`/incidents/${id}`, data);
    return response.data;
  }
};
