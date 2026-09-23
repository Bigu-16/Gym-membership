import React from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const MonthView = ({
  currentDate,
  getSessionsForDay,
  setSelectedSession
}) => {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const startDate = startOfWeek(start, { weekStartsOn: 1 });
  const endDate = endOfWeek(end, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="glass-card overflow-hidden border-[var(--glass-border)] bg-[var(--glass-bg)]">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 border-b border-[var(--glass-border)]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="p-4 text-center text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const daySessions = getSessionsForDay(day);
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b border-[var(--glass-border)] transition-all hover:bg-[var(--card-hover)]",
                    !isSameDay(day, currentDate) && format(day, 'M') !== format(currentDate, 'M') && "opacity-20",
                    isToday(day) && "bg-[var(--text-primary)] bg-opacity-[0.02]"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday(day) ? "bg-[var(--text-primary)] text-[var(--bg-primary)]" : "text-[var(--text-secondary)]"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {daySessions.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--glass-border)] font-bold">
                        {daySessions.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {daySessions.slice(0, 3).map(session => (
                      <div 
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={cn(
                          "text-[9px] p-1 rounded-md truncate cursor-pointer",
                          session.status === 'in-progress' 
                            ? "bg-[var(--text-primary)] text-[var(--bg-primary)]" 
                            : "bg-[var(--glass-border)] text-[var(--text-primary)]"
                        )}
                      >
                        {format(session.start, 'HH:mm')} {session.title}
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <div className="text-[9px] text-[var(--text-secondary)] pl-1">
                        + {daySessions.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthView;
