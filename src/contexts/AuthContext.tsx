import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

// Capture token immediately on load before any routers can strip it from the URL
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');
if (tokenFromUrl) {
  localStorage.setItem('auth_token', tokenFromUrl);
  // Optional: clear it from URL immediately
  window.history.replaceState({}, document.title, window.location.pathname);
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const checkAuth = () => {
    let token = localStorage.getItem('auth_token');

    if (!token) {
      setIsLoadingAuth(false);
      setIsLoggedIn(false);
      setUser(null);
      return;
    }

    fetch(`${import.meta.env.VITE_AUTH_URL}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          setUser(data);
          setIsLoggedIn(true);
        }
      })
      .catch(err => {
        console.error(err);
        localStorage.removeItem('auth_token');
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
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_AUTH_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('auth_token');
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
    <AuthContext.Provider value={{ isLoggedIn, user, isLoadingAuth, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
