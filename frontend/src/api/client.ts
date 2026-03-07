import axios from 'axios';

const AUTH_PATHS = new Set(['/auth/login', '/auth/register']);

function getRequestPath(url?: string) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new URL(url).pathname;
  }

  return url.startsWith('/') ? url : `/${url}`;
}

// 1. Create the base instance
export const apiClient = axios.create({
  // This points to our FastAPI backend running in Docker (or locally)
  baseURL: 'http://localhost:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the saved access token to every API request after login.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Redirect back to login only when an authenticated request loses authorization.
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const requestPath = getRequestPath(error.config?.url);
    const isAuthRequest = AUTH_PATHS.has(requestPath);

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
