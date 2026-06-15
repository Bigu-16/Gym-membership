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
  CalendarRange,
  Trash2,
  Plus,
  Users,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ACTIVITIES } from '../config/scheduleConfig';

const cn = (...inputs) => twMerge(clsx(inputs));

const Schedule = ({ 
  sessions = [], 
  scheduleTemplates = [], 
  members = [], 
  onAddTemplate, 
  onDeleteTemplate 
}) => {
  const [view, setView] = useState('week'); // 'day', 'week', 'month', 'templates'
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [localChecklists, setLocalChecklists] = useState(() => {
    try {
      const saved = localStorage.getItem('gym_session_checklists');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('gym_session_checklists', JSON.stringify(localChecklists));
  }, [localChecklists]);

  const handleToggleChecklist = (sessionId, itemId) => {
    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const updatedList = currentList.map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      return {
        ...prev,
        [sessionId]: updatedList
      };
    });
  };

  const handleAddChecklistItem = (sessionId, text) => {
    if (!text.trim()) return;
    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const newItem = {
        id: Date.now(),
        text: text.trim(),
        checked: false
      };
      return {
        ...prev,
        [sessionId]: [...currentList, newItem]
      };
    });
  };

  const handleDeleteChecklistItem = (sessionId, itemId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this task from the checklist?");
    if (!isConfirmed) return;

    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const updatedList = currentList.filter(item => item.id !== itemId);
      return {
        ...prev,
        [sessionId]: updatedList
      };
    });
  };

  const [timeLeft, setTimeLeft] = useState('');

  // Create Template form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClassOption, setSelectedClassOption] = useState(ACTIVITIES[0] || 'Taekwondo');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [capacity, setCapacity] = useState(15);
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);

  // Derive unique existing class names for selector dropdown
  const existingClassNames = Array.from(new Set(scheduleTemplates.map(t => t.className).filter(Boolean)));
  const defaultClassNames = ACTIVITIES;
  const uniqueClassNames = Array.from(new Set([...defaultClassNames, ...existingClassNames]));

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
    <div className="sticky top-0 z-30 flex flex-col md:flex-row justify-between items-center gap-6 pb-4 mb-6 pt-2">
      <div className="flex items-center gap-4">
        <div className="flex bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-1">
          <button 
            type="button"
            onClick={() => setView('day')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'day' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarIcon size={14} /> Day
          </button>
          <button 
            type="button"
            onClick={() => setView('week')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'week' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarRange size={14} /> Week
          </button>
          <button 
            type="button"
            onClick={() => setView('month')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'month' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarDays size={14} /> Month
          </button>
          <button 
            type="button"
            onClick={() => setView('templates')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'templates' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <LayoutGrid size={14} /> Templates
          </button>
        </div>

        {view !== 'templates' && (
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-xl glass-card hover:bg-[var(--card-hover)] border-[var(--glass-border)]"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 rounded-xl glass-card text-[10px] uppercase tracking-luxury border-[var(--glass-border)] hover:bg-[var(--card-hover)] min-w-[80px]"
            >
              {view === 'week' ? 'This Week' : view === 'month' ? 'This Month' : 'Today'}
            </button>
            <button 
              type="button"
              onClick={() => navigateDate('next')}
              className="p-2 rounded-xl glass-card hover:bg-[var(--card-hover)] border-[var(--glass-border)]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-light tracking-luxury uppercase">
        {view === 'templates' ? 'Schedule Templates' : format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
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

  const renderTemplatesView = () => {
    const categories = ['All', ...Array.from(new Set(scheduleTemplates.map(t => t.className || 'General Classes')))];

    const grouped = scheduleTemplates.reduce((acc, t) => {
      const cName = t.className || 'General Classes';
      if (!acc[cName]) acc[cName] = [];
      acc[cName].push(t);
      return acc;
    }, {});

    const filteredGrouped = Object.entries(grouped).filter(([cName]) => {
      if (selectedTemplateCategory === 'All') return true;
      return cName === selectedTemplateCategory;
    });

    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* Templates Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl p-6">
          <div>
            <h3 className="text-lg font-light tracking-luxury uppercase mb-1">Active Class Templates</h3>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Create and manage recurring schedule options for group enrollment</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          >
            <Plus size={14} /> Create Template
          </button>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => {
            const isActive = selectedTemplateCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedTemplateCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-luxury font-bold whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md' 
                    : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--glass-border)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grouped Templates Grid */}
        {filteredGrouped.map(([cName, slots]) => (
          <div key={cName} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[var(--text-primary)] rounded-full opacity-60"></div>
              <h3 className="text-sm uppercase tracking-luxury font-bold text-[var(--text-primary)] opacity-80">{cName}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slots.map(template => {
                const slotText = `${cName}: ${template.days} @ ${template.time}`;
                // Find members registered to this slot
                const enrolledMembers = members.filter(m => m.schedule?.slot === slotText);
                const enrolledCount = enrolledMembers.length || template.enrolled || 0;
                const isFull = enrolledCount >= template.capacity;

                return (
                  <div 
                    key={template.id}
                    className="glass-card p-6 border-[var(--glass-border)] relative overflow-hidden flex flex-col justify-between group hover:border-[var(--text-primary)]/40 hover:translate-y-[-4px] transition-all duration-300 min-h-[220px]"
                  >
                    {/* Background decorative gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--text-primary)]/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>

                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <span className="text-[9px] uppercase tracking-luxury px-3 py-1 rounded-full bg-[var(--glass-border)] font-bold text-[var(--text-secondary)]">
                          Slot #{template.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeleteTemplateId(template.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 duration-300"
                          title="Delete Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Main Time & Days */}
                      <div className="mb-6 relative z-10">
                        <h4 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
                          <Clock size={18} className="opacity-60 text-[var(--text-primary)]" />
                          {template.time}
                        </h4>
                        <p className="text-sm font-light text-[var(--text-secondary)] tracking-wide">
                          {template.days}
                        </p>
                      </div>
                    </div>

                    {/* Capacity & Enrolled Members Stack */}
                    <div className="space-y-4 relative z-10">
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1.5">
                          <span>Capacity Progress</span>
                          <span className={cn("font-bold", isFull ? "text-rose-500" : "text-emerald-500")}>
                            {enrolledCount} / {template.capacity} {isFull ? '(FULL)' : ''}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-1000", isFull ? "bg-rose-500 animate-pulse" : "bg-emerald-500")}
                            style={{ width: `${Math.min(100, (enrolledCount / template.capacity) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)] border-dashed">
                        <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">Enrolled Members</span>
                        {enrolledMembers.length > 0 ? (
                          <div className="flex items-center">
                            <div className="flex -space-x-2 mr-2">
                              {enrolledMembers.slice(0, 3).map((member) => (
                                <img
                                  key={member.id}
                                  src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff`}
                                  alt={member.name}
                                  title={member.name}
                                  className="w-6 h-6 rounded-full border border-[var(--bg-primary)] object-cover shadow-sm"
                                />
                              ))}
                            </div>
                            {enrolledMembers.length > 3 && (
                              <span className="text-[8px] font-bold text-[var(--text-secondary)] px-1.5 py-0.5 rounded bg-[var(--glass-border)]">
                                +{enrolledMembers.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] font-light text-[var(--text-secondary)] opacity-60">No members enrolled</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Global Add Template Placeholder Button Card */}
        <div 
          onClick={() => setIsCreateModalOpen(true)}
          className="glass-card p-8 border-dashed border-2 border-[var(--glass-border)] hover:border-[var(--text-primary)]/40 hover:bg-[var(--card-hover)] cursor-pointer flex flex-col items-center justify-center min-h-[140px] transition-all group duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:scale-110 group-hover:text-[var(--text-primary)] group-hover:bg-[var(--text-primary)]/10 transition-all mb-3">
            <Plus size={18} />
          </div>
          <span className="text-xs uppercase tracking-luxury font-bold">Add Another Template Class Slot</span>
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
      {view === 'templates' && renderTemplatesView()}

      {deleteTemplateId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm glass-card p-6 border-[var(--glass-border)] bg-[var(--bg-secondary)] flex flex-col items-center text-center animate-in scale-in duration-300">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
              <Trash2 size={22} />
            </div>
            <h3 className="text-lg font-light uppercase tracking-luxury mb-2 text-white">Delete Template Slot?</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
              Are you sure you want to delete this schedule template? Enrolled members will need to be rescheduled. This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  onDeleteTemplate(deleteTemplateId);
                  setDeleteTemplateId(null);
                }}
                className="flex-grow py-3 rounded-xl bg-rose-500 text-white text-[10px] uppercase tracking-luxury font-bold hover:bg-rose-600 active:scale-95 transition-all shadow-lg"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteTemplateId(null)}
                className="flex-grow py-3 rounded-xl glass-card text-[10px] uppercase tracking-luxury font-bold border-[var(--glass-border)] hover:bg-[var(--card-hover)] active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md h-full glass-card p-8 shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500 border-[var(--glass-border)] bg-[var(--bg-secondary)]">
            <button 
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setSelectedDays([]);
                setTime('16:00');
                setCapacity(15);
              }}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--glass-border)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>
            
            <div className="mb-8">
              <span className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury font-bold mb-4 inline-block bg-[var(--text-primary)]/10 text-[var(--text-primary)]">
                Configuration Panel
              </span>
              <h2 className="text-3xl font-light tracking-luxury uppercase mb-2">New Template</h2>
              <p className="text-[var(--text-secondary)] text-xs">Define a recurring training session for group classes.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedDays.length === 0) {
                  alert('Please select at least one training day.');
                  return;
                }
                
                const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const shortDays = {
                  'Monday': 'Mon',
                  'Tuesday': 'Tue',
                  'Wednesday': 'Wed',
                  'Thursday': 'Thu',
                  'Friday': 'Fri',
                  'Saturday': 'Sat',
                  'Sunday': 'Sun'
                };
                
                const formattedDaysStr = selectedDays
                  .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
                  .map(d => shortDays[d])
                  .join(', ');

                const formatTime12h = (t24) => {
                  const [hStr, mStr] = t24.split(':');
                  const h = parseInt(hStr, 10);
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const h12 = h % 12 || 12;
                  return `${h12}:${mStr} ${ampm}`;
                };

                onAddTemplate({
                  className: selectedClassOption.trim() || 'General Class',
                  days: formattedDaysStr,
                  time: `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`,
                  capacity: parseInt(capacity, 10)
                });

                // Reset and close
                setIsCreateModalOpen(false);
                setSelectedClassOption(ACTIVITIES[0] || 'Taekwondo');
                setSelectedDays([]);
                setStartTime('16:00');
                setEndTime('17:00');
                setCapacity(15);
              }}
              className="space-y-6 flex-grow flex flex-col justify-between"
            >
              <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                {/* Session Name Combo Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Class / Session Name</label>
                  <input
                    required
                    type="text"
                    list="class-names-list"
                    value={selectedClassOption}
                    onChange={(e) => setSelectedClassOption(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                    placeholder="Type to search or add custom class..."
                  />
                  <datalist id="class-names-list">
                    {uniqueClassNames.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                {/* Select Days */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Days of the Week</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setSelectedDays(prev => 
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border",
                            isSelected 
                              ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent" 
                              : "bg-[var(--bg-primary)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40"
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Start Time & End Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Start Time</label>
                    <input
                      required
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">End Time</label>
                    <input
                      required
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Capacity Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Max Capacity</label>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{capacity} Members</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                      className="flex-grow accent-[var(--text-primary)] cursor-pointer"
                    />
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                      className="w-16 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-2 py-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  type="submit"
                  className="flex-grow py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:opacity-90 transition-all"
                >
                  Create Template
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setSelectedDays([]);
                    setStartTime('16:00');
                    setEndTime('17:00');
                    setCapacity(15);
                  }}
                  className="px-8 py-4 rounded-2xl glass-card text-[10px] uppercase tracking-luxury font-bold border-[var(--glass-border)] hover:bg-[var(--card-hover)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              {(() => {
                const sessionChecklist = localChecklists[selectedSession.id] || selectedSession.checklist || [];
                const totalTasks = sessionChecklist.length;
                const completedTasks = sessionChecklist.filter(item => item.checked).length;

                return (
                  <div className="bg-[var(--bg-primary)] p-6 rounded-[32px] border border-[var(--glass-border)]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs uppercase tracking-luxury font-bold">Session Checklist</h3>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {completedTasks} / {totalTasks}
                      </span>
                    </div>
                    <div className="space-y-3 mb-4">
                      {sessionChecklist.length > 0 ? sessionChecklist.map(item => (
                        <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                          <div 
                            onClick={() => handleToggleChecklist(selectedSession.id, item.id)}
                            className="flex items-center gap-3 flex-grow"
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                              item.checked ? "bg-[var(--accent-color)] border-transparent" : "border-[var(--glass-border)] group-hover:border-[var(--text-secondary)]"
                            )}>
                              {item.checked && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                            <span className={cn(
                              "text-sm transition-all select-none",
                              item.checked ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                            )}>
                              {item.text}
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleDeleteChecklistItem(selectedSession.id, item.id)}
                            className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete task"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )) : (
                        <p className="text-xs text-[var(--text-secondary)] opacity-60 italic">No tasks assigned for today. Add one below!</p>
                      )}
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.target.elements.newItemText;
                        handleAddChecklistItem(selectedSession.id, input.value);
                        input.value = '';
                      }}
                      className="flex gap-2"
                    >
                      <input 
                        type="text" 
                        required
                        name="newItemText"
                        placeholder="Add custom daily activity..." 
                        className="flex-grow bg-[var(--card-hover)] border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder:text-[var(--text-secondary)] placeholder:opacity-50"
                      />
                      <button 
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                );
              })()}

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
