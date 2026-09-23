import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Toast } from '../types';

interface UIContextType {
  toasts: Toast[];
  addToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  
  notifications: string[];
  setNotifications: (notifications: string[]) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<string[]>([
    'New exam paper uploaded for Chemistry 101',
    'AI extraction completed for Physics Midterm'
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dark mode initialized from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const addToast = useCallback((text: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <UIContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        notifications,
        setNotifications,
        showNotifications,
        setShowNotifications,
        searchQuery,
        setSearchQuery,
        isDarkMode,
        toggleDarkMode
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
