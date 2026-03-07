import axios from 'axios';

// 1. Create the base instance
export const apiClient = axios.create({
  // This points to our FastAPI backend running in Docker (or locally)
  baseURL: 'http://localhost:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. The Interceptor
// Before ANY request leaves the frontend, this function runs.
apiClient.interceptors.request.use((config) => {
  // We will store the JWT in localStorage later during the Login flow
  const token = localStorage.getItem('token');
  
  if (token && config.headers) {
    // If we have a token, attach it!
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});