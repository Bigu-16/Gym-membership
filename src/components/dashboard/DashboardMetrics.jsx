import React from 'react';

const DashboardMetrics = ({
  dashboardStats,
  members = [],
  inClubList = [],
  allSessions = [],
  activeSessionsCount,
  upcomingSessionsCount,
  onTabChange
}) => {
  const totalRegistered = dashboardStats?.total_members !== undefined ? dashboardStats.total_members : members.length;
  const inClubCount = dashboardStats?.active_members !== undefined ? dashboardStats.active_members : inClubList.length;
  const todaySessionsCount = dashboardStats?.today_sessions !== undefined ? dashboardStats.today_sessions : allSessions.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Members */}
      <div 
        onClick={() => onTabChange('members')}
        className="glass-card p-6 cursor-pointer hover:border-[var(--text-primary)] group relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Active Directory</span>
            <span className="text-3xl font-light tracking-wide">{totalRegistered} <span className="text-xs text-[var(--text-secondary)]">Registered</span></span>
          </div>
          <div className="p-3 bg-[var(--card-hover)] rounded-xl group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all duration-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
          </svg>
          <span className="text-[10px] uppercase tracking-luxury text-emerald-500 font-bold">+8% this week</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 20 C20 15, 40 18, 60 10 C80 5, 90 8, 100 2 L100 20 L0 20 Z" fill="var(--text-secondary)" />
          </svg>
        </div>
      </div>

      {/* Live Attendance */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Live Occupancy</span>
            <span className="text-3xl font-light tracking-wide">{inClubCount} <span className="text-xs text-[var(--text-secondary)]">In Club</span></span>
          </div>
          <div className="p-3 bg-[var(--card-hover)] rounded-xl flex items-center justify-center">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-medium">
            ~{Math.round((inClubCount / 30) * 100)}% Capacity reached
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 15 Q25 5, 50 18 T100 10 L100 20 L0 20 Z" fill="var(--accent-color)" />
          </svg>
        </div>
      </div>

      {/* Sessions Today */}
      <div 
        onClick={() => onTabChange('schedule')}
        className="glass-card p-6 cursor-pointer hover:border-[var(--text-primary)] group relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Today's Sessions</span>
            <span className="text-3xl font-light tracking-wide">{todaySessionsCount} <span className="text-xs text-[var(--text-secondary)]">Scheduled</span></span>
          </div>
          <div className="p-3 bg-[var(--card-hover)] rounded-xl group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all duration-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] uppercase tracking-luxury text-amber-500 font-bold">
            {activeSessionsCount} in-progress • {upcomingSessionsCount} upcoming
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 18 Q30 2, 70 12 T100 5 L100 20 L0 20 Z" fill="var(--text-secondary)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;
