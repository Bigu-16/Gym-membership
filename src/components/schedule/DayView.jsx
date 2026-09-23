import React from 'react';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Play 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const DayView = ({
  currentDate,
  getSessionsForDay,
  sessions = [],
  setSelectedSession,
  timeLeft
}) => {
  const daySessions = getSessionsForDay(currentDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
      <div className="glass-card overflow-hidden border-[var(--glass-border)] bg-[var(--glass-bg)] h-[700px] flex flex-col">
        <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center">
          <h3 className="text-lg font-light tracking-luxury uppercase">Agenda for {format(currentDate, 'EEEE, MMM d')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">{daySessions.length} Sessions</span>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-6">
            {daySessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 py-20">
                <CalendarIcon size={48} className="mb-4" />
                <p className="uppercase tracking-luxury text-sm">No sessions scheduled</p>
              </div>
            ) : (
              daySessions.sort((a, b) => a.start - b.start).map(session => (
                <div 
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    "group relative p-6 rounded-3xl border transition-all cursor-pointer flex gap-6 items-center",
                    session.status === 'in-progress'
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent shadow-2xl scale-[1.02]"
                      : "bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--text-secondary)]"
                  )}
                >
                  <div className="text-center min-w-[60px]">
                    <div className="text-xl font-bold">{format(session.start, 'HH:mm')}</div>
                    <div className="text-[10px] uppercase tracking-luxury opacity-60">{format(session.start, 'aaa')}</div>
                  </div>
                  
                  <div className="w-[1px] h-12 bg-[var(--glass-border)] opacity-30 group-hover:h-16 transition-all"></div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-lg font-semibold tracking-tight">{session.title}</h4>
                      <span className={cn(
                        "text-[9px] uppercase tracking-luxury px-3 py-1 rounded-full font-bold",
                        session.status === 'in-progress' 
                          ? "bg-[var(--accent-color)] text-white" 
                          : "bg-[var(--glass-border)]"
                      )}>
                        {session.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[11px] opacity-70">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {format(session.start, 'h:mm a')} - {format(session.end, 'h:mm a')}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} /> {session.location}</span>
                      <span className="flex items-center gap-1.5"><Play size={12} /> {session.trainer}</span>
                    </div>
                  </div>
                  
                  {session.status === 'in-progress' && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-[10px] font-bold uppercase tracking-luxury">{timeLeft}</div>
                      <div className="w-24 h-1.5 bg-white bg-opacity-20 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-color)]" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6 border-[var(--glass-border)] relative overflow-hidden">
          <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--glass-border)]">
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Weekly Goal</span>
              <span className="text-xl font-bold">85%</span>
            </div>
            <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--glass-border)]">
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Calories</span>
              <span className="text-xl font-bold">12.4k</span>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6 border-[var(--glass-border)]">
          <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4">Upcoming Next</h3>
          <div className="space-y-4">
            {sessions.filter(s => s.status === 'upcoming').slice(0, 2).map(s => (
              <div key={s.id} className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--glass-border)] flex items-center justify-center text-[var(--text-primary)]">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">{s.title}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">{format(s.start, 'EEE, h:mm a')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;
