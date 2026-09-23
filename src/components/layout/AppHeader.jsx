import React from 'react';

const AppHeader = ({
  activeTab,
  theme,
  toggleTheme,
  handleLogout,
  currentUser,
  totalMembersCount = 0,
  activeNowCount = 0
}) => {
  return (
    <header className="mb-8 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div className="w-full md:w-auto">
        <div className="flex items-center gap-4 mb-4 justify-between md:justify-start">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-light tracking-luxury uppercase mb-0">
            {activeTab === 'dashboard' ? (
              <>Club <span className="font-bold">Overview</span></>
            ) : activeTab === 'members' ? (
              <>Member <span className="font-bold">Directory</span></>
            ) : activeTab === 'enrollment' ? (
              <>New <span className="font-bold">Registration</span></>
            ) : activeTab === 'schedule' ? (
              <>Training <span className="font-bold">Schedule</span></>
            ) : activeTab === 'analytics' ? (
              <>Business <span className="font-bold">Analytics</span></>
            ) : (
              <>{activeTab} <span className="font-bold">Panel</span></>
            )}
          </h1>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={toggleTheme}
              className="glass-card p-2.5 sm:p-3 rounded-full hover:scale-110 transition-transform active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button 
              type="button"
              onClick={handleLogout}
              className="glass-card p-2.5 sm:p-3 rounded-full hover:scale-110 hover:text-rose-400 transition-all active:scale-95 text-rose-500/80 border border-rose-500/10"
              aria-label="Sign Out"
              title="Sign Out"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] text-xs sm:text-sm tracking-wide uppercase">
          Managing <span className="text-[var(--text-primary)] opacity-60">Azyab Wellness Center</span>
          {currentUser && (
            <span className="block text-[10px] mt-1 normal-case text-emerald-500 font-medium">
              Logged in as <span className="font-bold">{currentUser.full_name}</span> ({currentUser.role})
            </span>
          )}
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:flex gap-4 w-full md:w-auto">
        <div className="glass-card px-4 py-2.5 sm:px-6 sm:py-3 text-center md:text-left">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Total Members</span>
          <span className="text-xl sm:text-2xl font-semibold">{totalMembersCount}</span>
        </div>
        <div className="glass-card px-4 py-2.5 sm:px-6 sm:py-3 text-center md:text-left">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-0.5">Active Now</span>
          <span className="text-xl sm:text-2xl font-semibold text-emerald-500 dark:text-emerald-400">{activeNowCount}</span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
