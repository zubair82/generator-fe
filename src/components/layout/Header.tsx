import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, HelpCircle, Sun, Moon } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

export function Header() {
  const {
    searchQuery,
    setSearchQuery,
    showNotifications,
    setShowNotifications,
    notifications,
    setNotifications,
    addToast,
    isDarkMode,
    toggleDarkMode
  } = useUI();

  return (
    <header className="bg-white dark:bg-[#222736] border-b border-[#c3c5d7] dark:border-slate-700/60 flex items-center justify-between h-16 px-8 sticky top-0 z-30 transition-colors">
      {/* Topbar Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search question papers, courses, instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-full py-1.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#003fb1] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1e29] focus:ring-1 focus:ring-[#003fb1] dark:focus:ring-blue-500 transition-all shadow-inner"
          />
        </div>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Clear
          </button>
        )}
      </div>

      {/* Right Action Menu */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={() => {
            toggleDarkMode();
            addToast(`Switched to ${!isDarkMode ? 'Dark' : 'Light'} Mode`, 'info');
          }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Dark Mode"
          className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center relative group"
        >
          <motion.div
            key={isDarkMode ? 'dark' : 'light'}
            initial={{ scale: 0.7, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.7, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </motion.div>
        </button>

        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center text-[#434654] dark:text-slate-300 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-50"
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Alerts & System Logs</span>
                  <button onClick={() => setNotifications([])} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                    Clear all
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No new notifications</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif, i) => (
                      <div key={i} className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
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
          className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center text-[#434654] dark:text-slate-300"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
