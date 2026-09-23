import ExamSimulaLogo from "../components/common/Logo";
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Footer, getStudentAppUrl } from '../components/layout/Footer';

export function Login() {
  const { isLoggedIn, isLoadingAuth, user } = useAuth();
  const navigate = useNavigate();

  const hostname = window.location.hostname;
  const isTeacherDomain = hostname.startsWith('teacher');
  const isAdminDomain = hostname.startsWith('admin');
  const isGeneralDomain = !isTeacherDomain && !isAdminDomain;

  useEffect(() => {
    if (isLoggedIn && user) {
      const role = (user.role || '').toUpperCase();
      if (isAdminDomain || role === 'ADMIN' || role === 'TEACHER') {
        navigate('/dashboard', { replace: true });
      } else {
        // Students and unverified applicants land strictly on /registration
        navigate('/registration', { replace: true });
      }
    }
  }, [isLoggedIn, user, navigate, isAdminDomain]);

  if (isLoadingAuth || isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] dark:bg-[#1a1e29]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#003fb1] dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#1a1e29] flex flex-col justify-between items-center transition-colors">
      <div className="w-full flex-grow flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#252b3b] max-w-md w-full rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 dark:border-slate-700/70 p-8 flex flex-col transition-colors"
        >
          <div className="flex flex-col items-center gap-3 mb-8 justify-center">
            <ExamSimulaLogo size={48} />
            <span className="font-sans font-bold text-2xl text-slate-800 dark:text-white tracking-tight">ExamSimula</span>
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">
            {isAdminDomain
              ? "Please log in to your Admin account."
              : "Sign in to access your Teacher dashboard or register your educator account."}
          </p>

          <div className="flex flex-col gap-4">
            {(isTeacherDomain || isGeneralDomain) && (
              <a
                href={`${import.meta.env.VITE_AUTH_URL}/api/v1/auth/google/login?role=TEACHER&redirect_url=${encodeURIComponent(window.location.origin)}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#003fb1] dark:bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors shadow-md shadow-blue-900/20"
              >
                Teacher Login
              </a>
            )}

            {isAdminDomain && (
              <a
                href={`${import.meta.env.VITE_AUTH_URL}/api/v1/auth/google/login?role=ADMIN&redirect_url=${encodeURIComponent(window.location.origin)}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#003fb1] dark:bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors shadow-md shadow-blue-900/20"
              >
                Admin Login
              </a>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
            By logging in, you agree to the ExamSimula{' '}
            <a href={getStudentAppUrl('/terms')} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Terms of Use
            </a>{' '}
            and{' '}
            <a href={getStudentAppUrl('/privacy')} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Privacy Policy
            </a>.
          </p>
        </motion.div>
      </div>
      <Footer compact />
    </div>
  );
}
