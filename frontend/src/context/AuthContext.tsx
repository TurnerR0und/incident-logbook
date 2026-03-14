import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { authApi } from '../api/auth';
import type { User } from '../types/user';
import {
  clearAuthSession,
  getTokenExpiry,
  isTokenExpired,
  persistAuthSession,
  readStoredAuthSession,
  subscribeToAuthSession,
} from './authSession';

interface AuthContextValue {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  user: User | null;
  token: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() => readStoredAuthSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthSession((nextSession) => {
      setSession(nextSession);
    });

    const syncFromStorage = () => {
      setSession(readStoredAuthSession());
    };

    window.addEventListener('storage', syncFromStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAuthState() {
      const storedSession = readStoredAuthSession();
      setSession(storedSession);

      if (!storedSession.token) {
        setLoading(false);
        return;
      }

      if (isTokenExpired(storedSession.token)) {
        clearAuthSession();
        setLoading(false);
        return;
      }

      try {
        const user = await authApi.me();

        if (cancelled) {
          return;
        }

        persistAuthSession(storedSession.token, user);
      } catch {
        if (!cancelled) {
          clearAuthSession();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    hydrateAuthState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session.token) {
      return;
    }

    const expiry = getTokenExpiry(session.token);

    if (expiry === null) {
      return;
    }

    const timeoutMs = expiry - Date.now();

    if (timeoutMs <= 0) {
      clearAuthSession();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearAuthSession();
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session.token]);

  async function login(email: string, password: string) {
    setLoading(true);

    try {
      const { access_token: accessToken } = await authApi.login(email, password);

      if (isTokenExpired(accessToken)) {
        throw new Error('Received expired access token');
      }

      localStorage.setItem('token', accessToken);
      setSession((currentSession) => ({
        ...currentSession,
        token: accessToken,
      }));

      const user = await authApi.me();
      persistAuthSession(accessToken, user);

      return user;
    } catch (error) {
      clearAuthSession();
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuthSession();
  }

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        user: session.user,
        token: session.token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
