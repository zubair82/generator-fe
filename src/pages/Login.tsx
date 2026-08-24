import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { isLoggedIn, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (isLoadingAuth || isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#003fb1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  const hostname = window.location.hostname;
  const isTeacherDomain = hostname.startsWith('teacher');
  const isAdminDomain = hostname.startsWith('admin');
  const isGeneralDomain = !isTeacherDomain && !isAdminDomain;

  return (
    <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-8 flex flex-col"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-[#003fb1] rounded-lg flex items-center justify-center text-white">
            <span className="font-bold text-xl leading-none">E</span>
          </div>
          <span className="font-sans font-bold text-2xl text-slate-800 tracking-tight">ExamSimula</span>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-center text-slate-500 mb-8 text-sm">
          {isTeacherDomain ? "Please log in to your Teacher account" : 
           isAdminDomain ? "Please log in to your Admin account" : 
           "Please access this portal using your specific Teacher or Admin portal link."}
        </p>

        <div className="flex flex-col gap-4">
          {isTeacherDomain && (
            <a
              href="http://localhost:5001/api/v1/auth/google/login?role=TEACHER"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#003fb1] text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20"
            >
              Teacher Login
            </a>
          )}

          {isAdminDomain && (
            <a
              href="http://localhost:5001/api/v1/auth/google/login?role=ADMIN"
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-colors ${
                isAdminDomain 
                  ? "bg-[#003fb1] text-white hover:bg-blue-800 shadow-md shadow-blue-900/20" 
                  : "bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Admin Login
            </a>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          By logging in, you agree to the ExamSimula Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
