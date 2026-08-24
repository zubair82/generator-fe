import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Settings,
  HelpCircle,
  Keyboard,
  Sparkles,
  FileCheck2,
  LogOut,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { ViewType } from '../../types';

export function Sidebar() {
  const { user, logout } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = (location.pathname.split('/')[1] || 'dashboard') as ViewType;

  const navigateTo = (view: ViewType, message: string) => {
    navigate('/' + view);
    addToast(message, 'info');
  };

  return (
    <aside className="w-full md:w-64 py-2.5 bg-white border-r border-[#c3c5d7] flex flex-col p-6 z-40 md:fixed md:top-0 md:left-0 md:h-screen transition-all">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 rounded-lg bg-[#003fb1] flex items-center justify-center text-white font-bold">ES</div>
        <div>
          <h1 className="font-sans font-bold text-lg text-[#003fb1] leading-none tracking-tight">ExamSimula</h1>
          <p className="text-[10px] font-bold text-[#434654] uppercase tracking-wider mt-1">
            {user?.role === 'ADMIN' ? 'System Overview' : 'Teacher Portal'}
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 py-5.5 ">
        <button
          onClick={() => navigateTo('dashboard', 'Loaded Dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-1.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'dashboard'
              ? 'bg-blue-50/50 text-[#003fb1] font-semibold border-r-4 border-[#003fb1]'
              : 'text-[#434654] hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        <button
          onClick={() => navigateTo('papers', 'Loaded Question Papers Directory')}
          className={`w-full flex items-center gap-3 px-4 py-1.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'papers'
              ? 'bg-blue-50/50 text-[#003fb1] font-semibold border-r-4 border-[#003fb1]'
              : 'text-[#434654] hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <FileText className="w-4 h-4" />
          Question Papers
        </button>

        <button
          onClick={() => navigateTo('add-resource', 'Opened Add Resources')}
          className={`w-full flex items-center gap-3 px-4 py-1.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'add-resource'
              ? 'bg-blue-50/50 text-[#003fb1] font-semibold border-r-4 border-[#003fb1]'
              : 'text-[#434654] hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <PlayCircle className="w-4 h-4" />
          Add Resources
        </button>

        <button
          onClick={() => navigateTo('manual_entry', 'Opened Manual Entry')}
          className={`w-full flex items-center gap-3 px-4 py-1.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'manual_entry'
              ? 'bg-blue-50/50 text-[#003fb1] font-semibold border-r-4 border-[#003fb1]'
              : 'text-[#434654] hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <Keyboard className="w-4 h-4" />
          Manual Entry
        </button>

        <button
          onClick={() => navigateTo('upload_pdf', 'Opened PDF Upload')}
          className={`w-full flex items-center gap-3 px-4 py-1.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'upload_pdf'
              ? 'bg-blue-50/50 text-[#003fb1] font-semibold border-r-4 border-[#003fb1]'
              : 'text-[#434654] hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
          <UploadCloud className="w-4 h-4" />
          Upload PDF
        </button>

      </nav>



      {/* Sidebar Footer */}
      <div className="mt-auto border-t border-[#c3c5d7] pt-4 space-y-1">
        <button
          onClick={() => addToast('Settings clicked (Simulator)', 'info')}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-[#434654] hover:bg-slate-50 transition-colors duration-200"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => addToast('ExamSimula Support team alerted!', 'success')}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-[#434654] hover:bg-slate-50 transition-colors duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          Support
        </button>

        {/* Logout Button */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200 font-semibold shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout ({user?.name || 'User'})
          </button>
        </div>
      </div>
    </aside>
  );
}
