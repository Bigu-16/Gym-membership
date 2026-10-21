import { CalendarDays, ChevronRight } from 'lucide-react';
import { toDateKey } from '../../utils/classSessions';
import StatusBadge from '../sessions/StatusBadge';
import SessionChecklist from '../sessions/SessionChecklist';
import SessionActionButtons from '../sessions/SessionActionButtons';

const timeFormat = { hour: 'numeric', minute: '2-digit' };

const LiveSessionsCard = ({ sessions = [], selectedDate, onSelectDate, onTabChange, actions, now = new Date() }) => {
  const isSelectedToday = toDateKey(selectedDate) === toDateKey(now);

  const dayTabs = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return {
      date,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isCurrent: toDateKey(date) === toDateKey(selectedDate)
    };
  });

  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSelectedToday ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--accent-color)]'}`} />
            {isSelectedToday ? "Today's classes" : 'Classes'}
          </h2>
          <p className="text-xs font-medium mt-0.5">{formattedSelectedDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-luxury px-2.5 py-1 rounded-full bg-[var(--glass-border)] text-[var(--text-secondary)] font-semibold">
            {sessions.length} {sessions.length === 1 ? 'class' : 'classes'}
          </span>
          <button
            type="button"
            onClick={() => onTabChange('schedule')}
            className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
          >
            Full schedule <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar" role="group" aria-label="Choose a day" tabIndex={0}>
        {dayTabs.map((tab) => (
          <button
            key={tab.text}
            type="button"
            aria-pressed={tab.isCurrent}
            onClick={() => onSelectDate(tab.date)}
            className={`px-3.5 py-2 rounded-xl text-xs flex flex-col items-center min-w-[70px] border transition-all ${
              tab.isCurrent
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent font-bold shadow-md'
                : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="text-xs uppercase tracking-luxury font-bold">{tab.label}</span>
            <span className="text-xs font-semibold">{tab.text}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {sessions.length === 0 ? (
          <div className="glass-card p-10 flex flex-col items-center text-center gap-3">
            <CalendarDays className="text-[var(--text-secondary)]" />
            <h4 className="text-sm font-semibold">No classes on {formattedSelectedDate}</h4>
            <p className="text-xs text-[var(--text-secondary)]">The center's timetable runs Monday to Saturday.</p>
            {!isSelectedToday && (
              <button
                type="button"
                onClick={() => onSelectDate(new Date())}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-luxury font-bold bg-[var(--text-primary)] text-[var(--bg-primary)]"
              >
                Back to today
              </button>
            )}
          </div>
        ) : (
          sessions.map((session) => {
            const busy = actions.pendingId === session.id;
            const highlighted = session.status === 'in-progress' || session.isLive;
            return (
              <article
                key={session.id}
                aria-label={`${session.title} ${session.start.toLocaleTimeString([], timeFormat)}`}
                className={`glass-card p-6 border transition-all ${highlighted ? 'border-[var(--text-primary)]' : 'border-[var(--glass-border)]'} ${busy ? 'opacity-70' : ''}`}
              >
                <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-xl font-light tracking-wide">{session.title}</h3>
                      <StatusBadge status={session.status} isLive={session.isLive} />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {session.start.toLocaleTimeString([], timeFormat)} – {session.end.toLocaleTimeString([], timeFormat)}
                      </span>
                      {session.trainer && <span>• {session.trainer}</span>}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--glass-border)] text-[var(--text-primary)] font-bold">
                        {session.enrolled || 0}{session.capacity ? `/${session.capacity}` : ''} enrolled
                      </span>
                    </p>
                  </div>
                  <SessionActionButtons session={session} actions={actions} disabled={busy} />
                </div>
                <div className="pt-4 border-t border-[var(--glass-border)]">
                  <SessionChecklist session={session} actions={actions} disabled={busy} />
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveSessionsCard;
