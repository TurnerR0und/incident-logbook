import type { User } from '../types/user';

const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'auth_user';

export interface StoredAuthSession {
  token: string | null;
  user: User | null;
}

type AuthSessionListener = (session: StoredAuthSession) => void;

const authSessionListeners = new Set<AuthSessionListener>();

function notifyAuthSessionListeners() {
  const session = readStoredAuthSession();
  authSessionListeners.forEach((listener) => listener(session));
}

function readStoredUser() {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  const normalizedPayload = payload
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(payload.length / 4) * 4, '=');

  try {
    return JSON.parse(atob(normalizedPayload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readStoredAuthSession(): StoredAuthSession {
  return {
    token: localStorage.getItem(TOKEN_STORAGE_KEY),
    user: readStoredUser(),
  };
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getTokenExpiry(token: string) {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;

  return typeof exp === 'number' ? exp * 1000 : null;
}

export function isTokenExpired(token: string) {
  const expiry = getTokenExpiry(token);

  return expiry !== null && expiry <= Date.now();
}

export function persistAuthSession(token: string, user: User) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  notifyAuthSessionListeners();
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  notifyAuthSessionListeners();
}

export function subscribeToAuthSession(listener: AuthSessionListener) {
  authSessionListeners.add(listener);

  return () => {
    authSessionListeners.delete(listener);
  };
}
