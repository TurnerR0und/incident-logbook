import { apiClient } from './client';
import type { Comment, CommentCreate } from '../types/comment';

export const commentApi = {
  // Fetch comments for a specific incident
  list: async (incidentId: string): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/incidents/${incidentId}/comments`);
    return response.data;
  },

  // Add a new comment to a specific incident
  create: async (incidentId: string, data: CommentCreate): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/incidents/${incidentId}/comments`, data);
    return response.data;
  }
};