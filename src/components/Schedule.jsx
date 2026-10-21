import { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, addWeeks, subMonths, subWeeks } from 'date-fns';
import { sessionsForDate, timetableHours } from '../utils/classSessions';
import { useSessionActions } from '../hooks/useSessionActions';
import ScheduleHeader from './schedule/ScheduleHeader';
import DayView from './schedule/DayView';
import WeekView from './schedule/WeekView';
import MonthView from './schedule/MonthView';
import SessionModal from './schedule/SessionModal';
import TemplateManagement from './TemplateManagement';

/**
 * One page for classes: the calendar of real dated classes (day/week/month) and the
 * weekly timetable those classes come from ("Edit timetable").
 */
const Schedule = ({ sessions = [], scheduleTemplates = [], members = [], saveSession, timetableActions = {} }) => {
  const [view, setView] = useState(() => (scheduleTemplates.length === 0 ? 'timetable' : 'week'));
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const actions = useSessionActions(saveSession);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getSessionsForDay = (day) => sessionsForDate(day, { sessions, templates: scheduleTemplates, now });

  const hours = useMemo(() => timetableHours(scheduleTemplates, sessions), [scheduleTemplates, sessions]);

  // Keep the open class in sync after it is saved (a projected class gets a real id).
  const selectedSession = useMemo(() => {
    if (!selectedId) return null;
    const day = new Date(`${selectedId.dateKey}T00:00:00`);
    const list = sessionsForDate(day, { sessions, templates: scheduleTemplates, now });
    return list.find((s) => s.id === selectedId.id)
      || list.find((s) => selectedId.templateId != null && s.templateId === selectedId.templateId)
      || null;
  }, [selectedId, sessions, scheduleTemplates, now]);

  const openSession = (session) => setSelectedId(
    session ? { id: session.id, templateId: session.templateId, dateKey: session.dateKey } : null
  );

  const navigateDate = (direction) => {
    const step = direction === 'next' ? 1 : -1;
    setCurrentDate((prev) => {
      if (view === 'day') return addDays(prev, step);
      if (view === 'week') return step > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1);
      return step > 0 ? addMonths(prev, 1) : subMonths(prev, 1);
    });
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

      {scheduleTemplates.length === 0 && view !== 'timetable' && (
        <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-warning">
          No weekly timetable yet. Press <strong>Edit timetable</strong>, then “Load official timetable”.
        </p>
      )}

      {view === 'timetable' && (
        <TemplateManagement
          scheduleTemplates={scheduleTemplates}
          onAddScheduleTemplate={timetableActions.onAdd}
          onUpdateScheduleTemplate={timetableActions.onUpdate}
          onDeleteScheduleTemplate={timetableActions.onDelete}
          onLoadOfficialTimetable={timetableActions.onLoadOfficial}
        />
      )}

      {view === 'week' && (
        <WeekView currentDate={currentDate} hours={hours} getSessionsForDay={getSessionsForDay} setSelectedSession={openSession} />
      )}
      {view === 'month' && (
        <MonthView currentDate={currentDate} getSessionsForDay={getSessionsForDay} setSelectedSession={openSession} />
      )}
      {view === 'day' && (
        <DayView currentDate={currentDate} getSessionsForDay={getSessionsForDay} setSelectedSession={openSession} now={now} />
      )}

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          onClose={() => setSelectedId(null)}
          actions={actions}
          members={members}
          now={now}
        />
      )}
    </div>
  );
};

export default Schedule;
