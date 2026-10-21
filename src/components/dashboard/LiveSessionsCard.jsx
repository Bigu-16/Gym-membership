import { CalendarDays } from 'lucide-react';
import StatusBadge from '../sessions/StatusBadge';
import SessionActionButtons from '../sessions/SessionActionButtons';

const timeFormat = { hour: 'numeric', minute: '2-digit' };

/** Today's classes as one compact list. Checklists and other days live on the Schedule page. */
const LiveSessionsCard = ({ sessions = [], onTabChange, actions }) => (
  <section className="glass-card lg:col-span-2" aria-labelledby="today-classes">
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--glass-border)]">
      <h2 id="today-classes" className="section-title">Today&apos;s classes</h2>
      <button type="button" onClick={() => onTabChange('schedule')} className="btn-secondary btn-sm">
        Open schedule
      </button>
    </div>

    {sessions.length === 0 ? (
      <div className="p-8 flex flex-col items-center text-center gap-2 text-[var(--text-secondary)]">
        <CalendarDays aria-hidden="true" />
        <p className="text-sm">No classes today. The timetable runs Monday to Saturday.</p>
      </div>
    ) : (
      <ul className="divide-y divide-[var(--glass-border)]">
        {sessions.map((session) => {
          const busy = actions.pendingId === session.id;
          return (
            <li
              key={session.id}
              aria-label={`${session.title} ${session.start.toLocaleTimeString([], timeFormat)}`}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 ${session.isLive ? 'bg-[var(--card-hover)]' : ''}`}
            >
              <div className="sm:w-36 shrink-0 text-sm font-semibold">
                {session.start.toLocaleTimeString([], timeFormat)} – {session.end.toLocaleTimeString([], timeFormat)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{session.title}</span>
                  <StatusBadge status={session.status} isLive={session.isLive} />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {session.trainer ? `${session.trainer} · ` : ''}
                  {session.enrolled || 0}{session.capacity ? `/${session.capacity}` : ''} enrolled
                </p>
              </div>
              <SessionActionButtons session={session} actions={actions} disabled={busy} />
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export default LiveSessionsCard;
