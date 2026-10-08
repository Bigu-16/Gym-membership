import { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  addMonths, 
  subMonths,
  addWeeks, 
  subWeeks,
  isSameDay, 
  startOfDay,
  differenceInMinutes
} from 'date-fns';
import { apiService } from '../services/api';
import ScheduleHeader from './schedule/ScheduleHeader';
import DayView from './schedule/DayView';
import WeekView from './schedule/WeekView';
import MonthView from './schedule/MonthView';
import SessionModal from './schedule/SessionModal';

const Schedule = ({ 
  sessions = [], 
  scheduleTemplates = [], 
  members = [], 
  onUpdateSessionStatus
}) => {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [localChecklists, setLocalChecklists] = useState({});

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      // Session payload is the external source for persisted checklist state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalChecklists(prev => {
        const updated = { ...prev };
        sessions.forEach(s => {
          if (s.checklist) {
            updated[s.id] = s.checklist;
          }
        });
        return updated;
      });
    }
  }, [sessions]);

  const handleToggleChecklist = (sessionId, itemId, itemIndex) => {
    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const updatedList = currentList.map((item, idx) => {
        const matches = (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null)
          ? item.id === itemId
          : idx === itemIndex;
        return matches ? { ...item, checked: !item.checked } : item;
      });
      
      apiService.updateSession(sessionId, { checklist: updatedList }).catch(console.error);
      
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
      const updatedList = [...currentList, newItem];
      
      apiService.updateSession(sessionId, { checklist: updatedList }).catch(console.error);
      
      return {
        ...prev,
        [sessionId]: updatedList
      };
    });
  };

  const [taskToDelete, setTaskToDelete] = useState(null);

  const executeDeleteChecklistItem = (sessionId, itemId, itemIndex) => {
    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const updatedList = currentList.filter((item, idx) => {
        if (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null) {
          return item.id !== itemId;
        }
        return idx !== itemIndex;
      });
      
      apiService.updateSession(sessionId, { checklist: updatedList }).catch(console.error);
      
      return {
        ...prev,
        [sessionId]: updatedList
      };
    });
  };

  const handleDeleteChecklistItem = (sessionId, itemId, itemIndex) => {
    setTaskToDelete({ sessionId, itemId, itemIndex });
  };

  const [timeLeft, setTimeLeft] = useState('');

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

  const parseTimeToDay = (targetDay, timeStr) => {
    let start = new Date(targetDay);
    let end = new Date(targetDay);

    const parseTimeComponent = (str, baseDate) => {
      if (!str) return null;
      const trimmed = str.trim();
      let hours;
      let minutes;

      if (trimmed.toLowerCase().includes('am') || trimmed.toLowerCase().includes('pm')) {
        const parts = trimmed.split(/\s+/);
        const [h, m] = (parts[0] || '10:00').split(':').map(Number);
        const ampm = (parts[1] || 'AM').toUpperCase();
        hours = h % 12;
        if (ampm === 'PM') hours += 12;
        minutes = m || 0;
      } else if (trimmed.includes(':')) {
        const [h, m] = trimmed.split(':').map(Number);
        hours = isNaN(h) ? 10 : h;
        minutes = isNaN(m) ? 0 : m;
      } else {
        const h = parseInt(trimmed, 10);
        hours = isNaN(h) ? 10 : h;
        minutes = 0;
      }

      const d = new Date(baseDate);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    if (timeStr && timeStr.includes(' - ')) {
      const [startStr, endStr] = timeStr.split(' - ');
      const parsedStart = parseTimeComponent(startStr, targetDay);
      const parsedEnd = parseTimeComponent(endStr, targetDay);
      if (parsedStart) start = parsedStart;
      if (parsedEnd) end = parsedEnd;
    } else if (timeStr) {
      const parsedStart = parseTimeComponent(timeStr, targetDay);
      if (parsedStart) {
        start = parsedStart;
        end = new Date(start.getTime() + 90 * 60 * 1000); // 90 min default session
      }
    } else {
      start.setHours(10, 0, 0, 0);
      end.setHours(11, 30, 0, 0);
    }

    return { start, end };
  };

  const getSessionsForDay = (day) => {
    const directSessions = (sessions || []).filter(session => isSameDay(session.start, day));
    const dayNameShort = format(day, 'EEE');
    const dayNameFull = format(day, 'EEEE');

    const projectedSessions = (scheduleTemplates || []).map(template => {
      if (!template) return null;
      const tDays = Array.isArray(template.days)
        ? template.days
        : (typeof template.days === 'string' ? template.days.split(',').map(s => s.trim()) : []);

      const matchesDay = tDays.some(d => {
        const dl = d.toLowerCase();
        const shortL = dayNameShort.toLowerCase();
        const fullL = dayNameFull.toLowerCase();
        return dl.startsWith(shortL) || shortL.startsWith(dl) || dl === fullL;
      });

      if (!matchesDay) return null;

      const exists = directSessions.some(s => {
        if (s.template_id && s.template_id === template.id) return true;
        const sTitle = (s.title || '').toLowerCase().replace(/session$/i, '').trim();
        const tTitle = (template.className || template.title || '').toLowerCase().replace(/session$/i, '').trim();
        return sTitle === tTitle || (sTitle && tTitle && (sTitle.includes(tTitle) || tTitle.includes(sTitle)));
      });
      if (exists) return null;

      const { start, end } = parseTimeToDay(day, template.time);
      const now = new Date();
      let status = 'upcoming';
      if (isSameDay(day, now)) {
        if (now >= start && now <= end) {
          status = 'in-progress';
        } else if (now > end) {
          status = 'completed';
        }
      } else if (day < startOfDay(now)) {
        status = 'completed';
      }

      return {
        id: `template-${template.id}-${format(day, 'yyyy-MM-dd')}`,
        template_id: template.id,
        title: template.className || template.title || 'Group Class',
        trainer: template.trainer || 'Coach',
        location: template.location || 'Main Studio',
        start,
        end,
        status,
        type: 'group',
        capacity: template.capacity || 20,
        enrolled: template.enrolled || 0,
        checklist: [
          { id: 1, text: 'Roll call & attendance check', checked: false },
          { id: 2, text: 'Warm-up & stretching sequence', checked: false },
          { id: 3, text: 'Curriculum instruction & drills', checked: false },
          { id: 4, text: 'Cool down & progress logging', checked: false }
        ]
      };
    }).filter(Boolean);

    const combined = [...directSessions, ...projectedSessions];
    const deduplicated = [];
    const seenSlots = new Set();
    for (const session of combined) {
      if (!session) continue;
      const sStart = session.start instanceof Date ? session.start : new Date(session.start);
      const startTimeKey = `${sStart.getHours()}:${sStart.getMinutes()}`;
      const titleKey = (session.title || '').trim().toLowerCase().replace(/session$/i, '').trim();
      const slotKey = `${session.template_id || titleKey}-${startTimeKey}`;
      if (!seenSlots.has(slotKey)) {
        seenSlots.add(slotKey);
        deduplicated.push(session);
      }
    }
    return deduplicated.sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  return (
    <div className="animate-in fade-in duration-700">
      <ScheduleHeader 
        view={view}
        setView={setView}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        navigateDate={navigateDate}
      />
      
      {view === 'week' && (
        <WeekView 
          currentDate={currentDate}
          hours={hours}
          getSessionsForDay={getSessionsForDay}
          setSelectedSession={setSelectedSession}
        />
      )}
      {view === 'month' && (
        <MonthView 
          currentDate={currentDate}
          getSessionsForDay={getSessionsForDay}
          setSelectedSession={setSelectedSession}
        />
      )}
      {view === 'day' && (
        <DayView 
          currentDate={currentDate}
          getSessionsForDay={getSessionsForDay}
          sessions={sessions}
          setSelectedSession={setSelectedSession}
          timeLeft={timeLeft}
        />
      )}
      <SessionModal 
        selectedSession={selectedSession}
        setSelectedSession={setSelectedSession}
        localChecklists={localChecklists}
        handleToggleChecklist={handleToggleChecklist}
        handleDeleteChecklistItem={handleDeleteChecklistItem}
        handleAddChecklistItem={handleAddChecklistItem}
        members={members}
        timeLeft={timeLeft}
        onUpdateSessionStatus={onUpdateSessionStatus}
      />

      {/* Task Deletion Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 border border-[var(--glass-border)] max-w-sm w-full shadow-2xl rounded-2xl bg-[var(--bg-secondary)] space-y-4">
            <h4 className="text-sm uppercase tracking-luxury font-bold text-[var(--text-primary)]">Delete Protocol Task</h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete this task from the checklist?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-luxury border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  executeDeleteChecklistItem(taskToDelete.sessionId, taskToDelete.itemId, taskToDelete.itemIndex);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-luxury font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
