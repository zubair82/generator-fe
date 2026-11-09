import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

// 1. Subdomain normalization:
// If accessed directly on root domain (e.g. localhost:3000 or examsimula.com), ensure it opens on teacher. subdomain
const currentHostname = window.location.hostname;
if (!currentHostname.startsWith('teacher.') && !currentHostname.startsWith('admin.')) {
  const port = window.location.port ? `:${window.location.port}` : '';
  const search = window.location.search;
  const pathname = window.location.pathname;
  window.location.replace(`${window.location.protocol}//teacher.${currentHostname}${port}${pathname}${search}`);
}

// 2. Capture token immediately on load before any routers can strip it from the URL
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');
if (tokenFromUrl) {
  localStorage.setItem('auth_token', tokenFromUrl);
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('token');
  window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search || ''));
}

export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  checkAuth: () => void;
  updateUser?: (data: Partial<User>) => void;
}

declare global {
  // eslint-disable-next-line no-var
  var __EXAMSIMULA_AUTH_CONTEXT__: React.Context<AuthContextType> | undefined;
}

const defaultAuthValue: AuthContextType = {
  isLoggedIn: Boolean(localStorage.getItem('auth_token')),
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoadingAuth: false,
  logout: async () => {},
  checkAuth: () => {},
  updateUser: () => {}
};

export const AuthContext: React.Context<AuthContextType> =
  globalThis.__EXAMSIMULA_AUTH_CONTEXT__ ||
  (globalThis.__EXAMSIMULA_AUTH_CONTEXT__ = createContext<AuthContextType>(defaultAuthValue));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : (data as User));
  };

  const checkAuth = () => {
    const currentToken = localStorage.getItem('auth_token');
    setToken(currentToken);

    if (!currentToken) {
      setIsLoadingAuth(false);
      setIsLoggedIn(false);
      setUser(null);
      return;
    }

    fetch(`${import.meta.env.VITE_AUTH_URL}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Auth failed with status ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data && (data.email || data.id)) {
          setUser(data);
          setIsLoggedIn(true);
        } else {
          throw new Error('Invalid user payload');
        }
      })
      .catch(err => {
        console.error('Session verification failed:', err);
        localStorage.removeItem('auth_token');
        setToken(null);
        setIsLoggedIn(false);
        setUser(null);
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    const role = user?.role;
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken) {
      try {
        await fetch(`${import.meta.env.VITE_AUTH_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);

    // Redirect to the appropriate subdomain
    const baseHost = window.location.hostname.replace(/^(admin\.|teacher\.)/, '');
    const port = window.location.port ? `:${window.location.port}` : '';

    if (role === 'ADMIN') {
      window.location.href = `${window.location.protocol}//admin.${baseHost}${port}/login`;
    } else {
      window.location.href = `${window.location.protocol}//teacher.${baseHost}${port}/login`;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, isLoadingAuth, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || defaultAuthValue;
}
