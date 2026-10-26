import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, Users } from 'lucide-react';
import StatusBadge from '../sessions/StatusBadge';

const DayView = ({ currentDate, getSessionsForDay, setSelectedSession, now = new Date() }) => {
  const daySessions = getSessionsForDay(currentDate);
  const enrolledTotal = daySessions.reduce((sum, s) => sum + (s.enrolled || 0), 0);
  const capacityTotal = daySessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const completed = daySessions.filter((s) => s.status === 'completed').length;
  const notRecorded = daySessions.filter((s) => s.status === 'not-recorded').length;
  const nextUp = daySessions.filter((s) => s.start > now && s.status !== 'cancelled').slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="glass-card overflow-hidden border-[var(--glass-border)] bg-[var(--glass-bg)] flex flex-col">
        <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center">
          <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMM d')}</h3>
          <span className="text-xs text-[var(--text-secondary)]">
            {daySessions.length} {daySessions.length === 1 ? 'class' : 'classes'}
          </span>
        </div>
        <div className="p-6 space-y-4">
          {daySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] py-20">
              <CalendarIcon size={48} className="mb-4" />
              <p className="text-sm">No classes on this day</p>
            </div>
          ) : (
            daySessions.map((session) => (
              <button
                type="button"
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex gap-5 items-center ${
 session.status === 'in-progress'
 ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent '
 : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--text-secondary)]'
 }`}
              >
                <div className="text-center min-w-[64px]">
                  <div className="text-xl font-bold">{format(session.start, 'h:mm')}</div>
                  <div className="text-xs">{format(session.start, 'a')}</div>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="text-lg font-semibold tracking-tight truncate">{session.title}</h4>
                    <StatusBadge status={session.status} isLive={session.isLive} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {format(session.start, 'h:mm a')} – {format(session.end, 'h:mm a')}</span>
                    {session.trainer && <span className="flex items-center gap-1.5"><User size={12} /> {session.trainer}</span>}
                    <span className="flex items-center gap-1.5">
                      <Users size={12} /> {session.enrolled || 0}{session.capacity ? `/${session.capacity}` : ' enrolled'}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6 border-[var(--glass-border)]">
          <h3 className="text-xs text-[var(--text-secondary)] font-bold mb-4">Day summary</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--glass-border)]">
              <dt className="text-xs text-[var(--text-secondary)] mb-1">Enrolled</dt>
              <dd className="text-xl font-bold">
                {enrolledTotal}
                {capacityTotal > 0 && <span className="text-xs text-[var(--text-secondary)]">/{capacityTotal}</span>}
              </dd>
            </div>
            <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--glass-border)]">
              <dt className="text-xs text-[var(--text-secondary)] mb-1">Completed</dt>
              <dd className="text-xl font-bold">{completed}<span className="text-xs text-[var(--text-secondary)]">/{daySessions.length}</span></dd>
            </div>
          </dl>
          {notRecorded > 0 && (
            <p className="mt-4 text-xs text-warning">
              {notRecorded} finished {notRecorded === 1 ? 'class has' : 'classes have'} not been marked completed or cancelled.
            </p>
          )}
        </div>

        <div className="glass-card p-6 border-[var(--glass-border)]">
          <h3 className="text-xs text-[var(--text-secondary)] font-bold mb-4">Up next</h3>
          {nextUp.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] italic">No more classes on this day.</p>
          ) : (
            <ul className="space-y-4">
              {nextUp.map((s) => (
                <li key={s.id} className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-[var(--glass-border)] flex items-center justify-center"><Clock size={16} /></div>
                  <div>
                    <div className="text-xs font-bold">{s.title}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{format(s.start, 'h:mm a')}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayView;
