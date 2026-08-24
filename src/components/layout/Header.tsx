import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

export function Header() {
  const {
    searchQuery,
    setSearchQuery,
    showNotifications,
    setShowNotifications,
    notifications,
    setNotifications,
    addToast
  } = useUI();

  return (
    <header className="bg-white border-b border-[#c3c5d7] flex items-center justify-between h-16 px-8 sticky top-0 z-30">
      {/* Topbar Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search question papers, courses, instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#003fb1] focus:bg-white focus:ring-1 focus:ring-[#003fb1] transition-all shadow-inner"
          />
        </div>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Right Action Menu */}
      <div className="flex items-center gap-4">
        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center text-[#434654] relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50"
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                  <span className="font-semibold text-xs text-slate-800">Alerts & System Logs</span>
                  <button onClick={() => setNotifications([])} className="text-[10px] text-blue-600 hover:underline">
                    Clear all
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No new notifications</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif, i) => (
                      <div key={i} className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {notif}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => addToast('Documentation Guide loaded successfully!', 'info')}
          className="w-10 h-10 rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center text-[#434654]"
        >
          <HelpCircle className="w-5 h-5" />
        </button>


      </div>
    </header>
  );
}
