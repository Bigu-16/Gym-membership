import React from 'react';

const RecentActivityLog = ({
  recentActivities = [],
  loadingStats = false
}) => {
  return (
    <div className="glass-card p-6 border border-[var(--glass-border)] relative overflow-hidden">
      <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Recent Activity Log
        {loadingStats && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] animate-ping ml-auto"></span>
        )}
      </h3>
      
      {recentActivities.length === 0 ? (
        <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] italic text-center py-4">
          No recent activity recorded today.
        </p>
      ) : (
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {recentActivities.map((act, index) => {
            const isCheckIn = act.action?.toLowerCase() === 'check-in' || act.action?.toLowerCase() === 'check_in';
            return (
              <div 
                key={`${act.check_in_id || 'act'}-${act.timestamp || index}-${index}`} 
                className="flex items-start gap-3 text-xs border-b border-[var(--glass-border)] border-dashed pb-3 last:border-b-0 last:pb-0"
              >
                <div className={`p-1.5 rounded-lg ${isCheckIn ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} shrink-0`}>
                  {isCheckIn ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l-4-4m4 4h-14m5-4v-1a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {act.member_name}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] opacity-85">
                    {isCheckIn ? 'Checked in' : 'Checked out'}
                  </div>
                </div>
                <div className="text-[9px] text-[var(--text-secondary)] whitespace-nowrap pt-0.5 font-mono">
                  {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivityLog;
