import React from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  eachDayOfInterval, 
  isToday 
} from 'date-fns';
import { MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const layoutDaySessions = (daySessions) => {
  if (!daySessions || daySessions.length === 0) return [];

  // Sort by start time, then by end time descending (longer sessions first)
  const sorted = [...daySessions].sort((a, b) => {
    const diff = new Date(a.start) - new Date(b.start);
    if (diff !== 0) return diff;
    return new Date(b.end) - new Date(a.end);
  });

  // Group into overlapping clusters
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = null;

  sorted.forEach(session => {
    const sStart = new Date(session.start).getTime();
    const sEnd = new Date(session.end).getTime();

    if (currentCluster.length === 0) {
      currentCluster.push(session);
      clusterEnd = sEnd;
    } else if (sStart < clusterEnd) {
      // Overlaps with current cluster
      currentCluster.push(session);
      clusterEnd = Math.max(clusterEnd, sEnd);
    } else {
      // New cluster
      clusters.push(currentCluster);
      currentCluster = [session];
      clusterEnd = sEnd;
    }
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Assign columns within each cluster
  const positionedSessions = [];

  clusters.forEach(cluster => {
    const columnEnds = [];

    const clusterItems = cluster.map(session => {
      const sStart = new Date(session.start).getTime();
      const sEnd = new Date(session.end).getTime();

      let colIndex = columnEnds.findIndex(end => end <= sStart);
      if (colIndex === -1) {
        colIndex = columnEnds.length;
        columnEnds.push(sEnd);
      } else {
        columnEnds[colIndex] = sEnd;
      }

      return { session, colIndex };
    });

    const totalCols = columnEnds.length;

    clusterItems.forEach(({ session, colIndex }) => {
      positionedSessions.push({
        ...session,
        colIndex,
        totalCols
      });
    });
  });

  return positionedSessions;
};

const WeekView = ({
  currentDate,
  hours,
  getSessionsForDay,
  setSelectedSession
}) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 6)
  });

  return (
    <div className="glass-card overflow-hidden border-[var(--glass-border)]">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[var(--glass-border)]">
            <div className="p-4 border-r border-[var(--glass-border)] bg-[var(--bg-primary)] opacity-50"></div>
            {days.map(day => (
              <div 
                key={day.toString()} 
                className={cn(
                  "p-4 text-center border-r border-[var(--glass-border)] last:border-r-0",
                  isToday(day) && "bg-[var(--text-primary)] bg-opacity-[0.03]"
                )}
              >
                <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  "text-lg font-semibold w-8 h-8 inline-flex items-center justify-center rounded-full transition-all",
                  isToday(day) ? "bg-[var(--text-primary)] text-[var(--bg-primary)]" : ""
                )}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          <div className="relative h-[600px] overflow-y-auto custom-scrollbar bg-[var(--glass-bg)]">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] h-[900px]">
              {/* Time labels */}
              <div className="relative">
                {hours.map(hour => (
                  <div key={hour} className="h-[60px] text-[10px] text-[var(--text-secondary)] pr-4 text-right -mt-2">
                    {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </div>
                ))}
              </div>

              {/* Grid lines & Sessions */}
              {days.map((day) => (
                <div key={day.toString()} className="relative border-r border-[var(--glass-border)] last:border-r-0">
                  {hours.map(hour => (
                    <div key={hour} className="h-[60px] border-b border-[var(--glass-border)] border-dashed opacity-30"></div>
                  ))}
                  
                  {layoutDaySessions(getSessionsForDay(day)).map(session => {
                    const startHour = session.start.getHours() + session.start.getMinutes() / 60;
                    const endHour = session.end.getHours() + session.end.getMinutes() / 60;
                    const top = Math.max(0, (startHour - 7) * 60);
                    const height = Math.max(40, (endHour - startHour) * 60);

                    const totalCols = session.totalCols || 1;
                    const colIndex = session.colIndex || 0;
                    const widthPercent = 100 / totalCols;
                    const leftPercent = colIndex * widthPercent;

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={cn(
                          "absolute rounded-xl p-2 text-xs cursor-pointer transition-all hover:scale-[1.02] hover:z-20 group overflow-hidden border",
                          session.status === 'in-progress' 
                            ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent shadow-xl ring-2 ring-[var(--accent-color)] ring-offset-2 ring-offset-[var(--bg-primary)] z-10" 
                            : "bg-[var(--bg-secondary)] border-[var(--glass-border)] hover:border-[var(--text-secondary)] shadow-md"
                        )}
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`,
                          left: `calc(${leftPercent}% + 2px)`,
                          width: `calc(${widthPercent}% - 4px)`
                        }}
                      >
                        <div className="font-bold mb-0.5 truncate" title={session.title}>{session.title}</div>
                        <div className="opacity-70 text-[9px] flex items-center gap-1 mb-1 truncate">
                          <MapPin size={8} className="shrink-0" /> <span className="truncate">{session.location}</span>
                        </div>
                        {session.status === 'in-progress' && (
                          <div className="mt-auto flex items-center gap-2">
                            <div className="flex-grow h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--accent-color)] animate-pulse" style={{ width: '65%' }}></div>
                            </div>
                            <span className="text-[8px] font-bold">LIVE</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
