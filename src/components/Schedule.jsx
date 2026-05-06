import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  startOfDay,
  setHours,
  setMinutes,
  differenceInMinutes
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Play, 
  Timer, 
  MoreHorizontal,
  LayoutGrid,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Schedule = ({ sessions = [] }) => {
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Update time left for in-progress session
  useEffect(() => {
    const timer = setInterval(() => {
      const inProgress = sessions.find(s => s.status === 'in-progress');
      if (inProgress) {
        const now = new Date();
        const diff = differenceInMinutes(inProgress.end, now);
        if (diff > 0) {
          const hours = Math.floor(diff / 60);
          const mins = diff % 60;
          setTimeLeft(`${hours > 0 ? `${hours}h ` : ''}${mins}m remaining`);
        } else {
          setTimeLeft('Session ended');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessions]);

  const navigateDate = (direction) => {
    if (view === 'day') {
      setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
    } else if (view === 'week') {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

  const getSessionsForDay = (day) => {
    return sessions.filter(session => isSameDay(session.start, day));
  };

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="flex bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-1">
          <button 
            onClick={() => setView('day')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'day' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarIcon size={14} /> Day
          </button>
          <button 
            onClick={() => setView('week')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'week' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarRange size={14} /> Week
          </button>
          <button 
            onClick={() => setView('month')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'month' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarDays size={14} /> Month
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-xl glass-card hover:bg-[var(--card-hover)] border-[var(--glass-border)]"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-xl glass-card text-[10px] uppercase tracking-luxury border-[var(--glass-border)] hover:bg-[var(--card-hover)]"
          >
            Today
          </button>
          <button 
            onClick={() => navigateDate('next')}
            className="p-2 rounded-xl glass-card hover:bg-[var(--card-hover)] border-[var(--glass-border)]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-light tracking-luxury uppercase">
        {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
      </h2>
    </div>
  );

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });

    return (
      <div className="glass-card overflow-hidden border-[var(--glass-border)]">
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
            {days.map((day, dayIdx) => (
              <div key={day.toString()} className="relative border-r border-[var(--glass-border)] last:border-r-0">
                {hours.map(hour => (
                  <div key={hour} className="h-[60px] border-b border-[var(--glass-border)] border-dashed opacity-30"></div>
                ))}
                
                {getSessionsForDay(day).map(session => {
                  const startHour = session.start.getHours() + session.start.getMinutes() / 60;
                  const endHour = session.end.getHours() + session.end.getMinutes() / 60;
                  const top = (startHour - 7) * 60;
                  const height = (endHour - startHour) * 60;

                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={cn(
                        "absolute left-1 right-1 rounded-xl p-2 text-xs cursor-pointer transition-all hover:scale-[1.02] hover:z-10 group overflow-hidden border",
                        session.status === 'in-progress' 
                          ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent shadow-xl ring-2 ring-[var(--accent-color)] ring-offset-2 ring-offset-[var(--bg-primary)]" 
                          : "bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--text-secondary)] shadow-sm"
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="font-bold mb-0.5 truncate">{session.title}</div>
                      <div className="opacity-70 text-[9px] flex items-center gap-1 mb-1">
                        <MapPin size={8} /> {session.location}
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
    );
  };

  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDate = startOfWeek(start, { weekStartsOn: 1 });
    const endDate = endOfWeek(end, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="glass-card overflow-hidden border-[var(--glass-border)] bg-[var(--glass-bg)]">
        <div className="grid grid-cols-7 border-b border-[var(--glass-border)]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-4 text-center text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
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
    );
  };

  const renderDayView = () => {
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
              {MOCK_SESSIONS.filter(s => s.status === 'upcoming').slice(0, 2).map(s => (
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

  return (
    <div className="animate-in fade-in duration-700">
      {renderHeader()}
      
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
      {view === 'day' && renderDayView()}

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md h-full glass-card p-8 shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500 border-[var(--glass-border)] bg-[var(--bg-secondary)]">
            <button 
              onClick={() => setSelectedSession(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--glass-border)] transition-all"
            >
              <MoreHorizontal />
            </button>
            
            <div className="mb-8">
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury font-bold mb-4 inline-block",
                selectedSession.status === 'in-progress' ? "bg-[var(--accent-color)] text-white" : "bg-[var(--glass-border)]"
              )}>
                {selectedSession.status.replace('-', ' ')}
              </span>
              <h2 className="text-3xl font-light tracking-luxury uppercase mb-2">{selectedSession.title}</h2>
              <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm">
                <span className="flex items-center gap-1.5"><Play size={14} /> {selectedSession.trainer}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {selectedSession.location}</span>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
              <div className="bg-[var(--bg-primary)] p-6 rounded-[32px] border border-[var(--glass-border)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs uppercase tracking-luxury font-bold">Session Checklist</h3>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {selectedSession.checklist.filter(c => c.checked).length} / {selectedSession.checklist.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {selectedSession.checklist.length > 0 ? selectedSession.checklist.map(item => (
                    <div key={item.id} className="flex items-center gap-3 group cursor-pointer">
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                        item.checked ? "bg-[var(--accent-color)] border-transparent" : "border-[var(--glass-border)] group-hover:border-[var(--text-secondary)]"
                      )}>
                        {item.checked && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={cn(
                        "text-sm transition-all",
                        item.checked ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                      )}>
                        {item.text}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-[var(--text-secondary)] opacity-60">No checklist items for this session type.</p>
                  )}
                </div>
              </div>

              {selectedSession.status === 'in-progress' && (
                <div className="glass-card p-6 border-[var(--accent-color)] border-opacity-30 bg-[var(--accent-color)] bg-opacity-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Timer size={20} className="text-[var(--accent-color)]" />
                    <span className="text-xs uppercase tracking-luxury font-bold text-[var(--accent-color)]">Time Remaining</span>
                  </div>
                  <div className="text-4xl font-mono font-bold tracking-tighter mb-4">{timeLeft.replace(' remaining', '')}</div>
                  <div className="h-2 bg-[var(--glass-border)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-color)]" style={{ width: '65%' }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <button className="flex-grow py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:opacity-90 transition-all">
                {selectedSession.status === 'in-progress' ? 'Pause Session' : 'Start Session'}
              </button>
              <button 
                onClick={() => setSelectedSession(null)}
                className="px-8 py-4 rounded-2xl glass-card text-[10px] uppercase tracking-luxury font-bold border-[var(--glass-border)] hover:bg-[var(--card-hover)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
