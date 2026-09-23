import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastContainer } from '../common/ToastContainer';
import { useAuth } from '../../contexts/AuthContext';

export function MainLayout() {
  const { isLoggedIn, isLoadingAuth, user } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] dark:bg-[#1a1e29]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#003fb1] dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const hostname = window.location.hostname;
  const isAdminDomain = hostname.startsWith('admin');
  const role = (user?.role || '').toUpperCase();

  // If user has STUDENT role and not on admin domain, restrict access strictly to /registration
  if (role === 'STUDENT' && !isAdminDomain) {
    return <Navigate to="/registration" replace />;
  }

  return (
    <div className="bg-[#faf8ff] dark:bg-[#1a1e29] text-[#191b23] dark:text-slate-100 font-sans antialiased min-h-screen flex flex-col md:flex-row overflow-x-hidden transition-colors">
      <ToastContainer />

      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1 flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer compact />
      </div>
    </div>
  );
}
