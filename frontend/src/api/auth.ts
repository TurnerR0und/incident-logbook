import { apiClient } from './client';
import type { AuthToken, User } from '../types/user';

export const authApi = {
  // 1. Login (Requires Form Data)
  login: async (email: string, password: string): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI expects 'username' for the email
    formData.append('password', password);

    const response = await apiClient.post<AuthToken>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // 2. Register (Requires JSON)
  register: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', {
      email,
      password,
    });
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
