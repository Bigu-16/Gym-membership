import React from 'react';

const SidebarItem = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg scale-[1.02]' 
        : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className="text-[11px] uppercase tracking-luxury font-medium">{label}</span>
  </button>
);

const Sidebar = ({ activeTab = 'members', onTabChange }) => {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Overview', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      id: 'members', 
      label: 'Members', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      id: 'schedule', 
      label: 'Schedule', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'enrollment', 
      label: 'Enrollment', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
  ];

  return (
    <>
      {/* Desktop Aside Sidebar */}
      <aside className="w-64 h-[calc(100vh-4rem)] sticky top-8 hidden lg:flex flex-col gap-8">
        <div className="px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-[#0d0f14] border border-white/15">
              <img src="/logo.png" alt="Azyab Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest leading-none">Azyab</h2>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-luxury">Wellness Systems</span>
            </div>
          </div>
        </div>

        <nav className="flex-grow flex flex-col gap-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              {...item}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto px-4 pb-4">
          <div className="glass-card p-4 relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Current Shift</span>
              <span className="text-xs font-semibold block">Morning Session</span>
              <span className="text-[10px] text-emerald-500 block mt-1">Ends in 2h 15m</span>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-[var(--accent-color)] opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet Floating Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 glass-card px-1.5 py-1 flex justify-around items-center shadow-2xl border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-[var(--text-primary)] scale-105 font-bold' 
                  : 'text-[var(--text-secondary)] opacity-50 hover:opacity-100'
              }`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-[var(--accent-color)]' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest scale-90 whitespace-nowrap font-medium">
                {item.id === 'dashboard' ? 'Overview' : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default Sidebar;
