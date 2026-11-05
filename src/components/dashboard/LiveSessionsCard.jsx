import { useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, ListChecks, UserRound } from 'lucide-react';
import StatusBadge from '../sessions/StatusBadge';
import SessionActionButtons from '../sessions/SessionActionButtons';
import SessionChecklist from '../sessions/SessionChecklist';

const timeFormat = { hour: 'numeric', minute: '2-digit' };

/** How full a class is; decorative, the "x/y enrolled" text says the same. */
const CapacityMeter = ({ enrolled = 0, capacity }) => {
  if (!capacity) return null;
  const pct = Math.min(100, Math.round((enrolled / capacity) * 100));
  return (
    <span aria-hidden="true" className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-[var(--card-hover)] align-middle">
      <span className="block h-full rounded-full bg-[var(--accent-color)]" style={{ width: `${pct}%` }} />
    </span>
  );
};

/** Today's classes as a timeline; each class can open its task checklist in place. */
const LiveSessionsCard = ({ sessions = [], onTabChange, actions }) => {
  const [openId, setOpenId] = useState(null);
  return (
  <section className="glass-card lg:col-span-3 overflow-hidden" aria-labelledby="today-classes">
    <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[var(--glass-border)]">
      <h2 id="today-classes" className="section-title">Today&apos;s classes</h2>
      <button type="button" onClick={() => onTabChange('schedule')} className="btn-secondary btn-sm">
        Open schedule <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>

    {sessions.length === 0 ? (
      <div className="px-6 py-12 flex flex-col items-center text-center gap-3 text-[var(--text-secondary)]">
        <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--card-hover)]">
          <CalendarDays size={22} />
        </span>
        <p className="text-sm">No classes today. The timetable runs Monday to Saturday.</p>
      </div>
    ) : (
      <ol className="px-3 sm:px-4 py-3">
        {sessions.map((session, index) => {
          const busy = actions.pendingId === session.id;
          const live = session.isLive || session.status === 'in-progress';
          const muted = session.status === 'completed' || session.status === 'cancelled';
          const last = index === sessions.length - 1;
          // Keyed by slot + date: a timetable class gets a new id when its first task is saved.
          const slotKey = session.templateId != null ? `${session.templateId}-${session.dateKey}` : String(session.id);
          const open = openId === slotKey;
          const checklist = session.checklist || [];
          const tasksDone = checklist.filter((item) => item.checked).length;
          return (
            <li
              key={session.id}
              aria-label={`${session.title} ${session.start.toLocaleTimeString([], timeFormat)}`}
              className="relative flex gap-3 sm:gap-4"
            >
              {/* Time column */}
              <div className="w-16 sm:w-20 shrink-0 pt-3 text-right">
                <p className="text-sm font-semibold tabular-nums">{session.start.toLocaleTimeString([], timeFormat)}</p>
                <p className="text-xs text-[var(--text-secondary)] tabular-nums">{session.end.toLocaleTimeString([], timeFormat)}</p>
              </div>

              {/* Timeline rail */}
              <div aria-hidden="true" className="relative flex w-3 shrink-0 justify-center">
                {!last && <span className="absolute top-6 bottom-0 w-px bg-[var(--glass-border)]" />}
                {index > 0 && <span className="absolute top-0 h-4 w-px bg-[var(--glass-border)]" />}
                <span
                  className={`relative mt-4 h-3 w-3 rounded-full border-2 ${
                    live
                      ? 'border-[var(--accent-color)] bg-[var(--accent-color)] ring-4 ring-emerald-500/15'
                      : muted
                        ? 'border-[var(--text-secondary)] bg-[var(--text-secondary)]'
                        : 'border-[var(--text-secondary)] bg-[var(--bg-secondary)]'
                  }`}
                />
              </div>

              {/* Class */}
              <div
                className={`mb-2 min-w-0 flex-grow rounded-xl px-4 py-3 ${
                  live ? 'bg-[var(--card-hover)] ring-1 ring-inset ring-[var(--glass-border)]' : 'hover:bg-[var(--card-hover)]'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${session.status === 'cancelled' ? 'line-through decoration-2' : ''}`}>{session.title}</span>
                    <StatusBadge status={session.status} isLive={session.isLive} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                    {session.trainer && (
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={12} aria-hidden="true" /> {session.trainer}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <CapacityMeter enrolled={session.enrolled || 0} capacity={session.capacity} />
                      <span>{session.enrolled || 0}{session.capacity ? `/${session.capacity}` : ''} enrolled</span>
                    </span>
                  </div>
                </div>
                <SessionActionButtons session={session} actions={actions} disabled={busy} />
                </div>

                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`tasks-${slotKey}`}
                  onClick={() => setOpenId(open ? null : slotKey)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"
                >
                  <ListChecks size={14} aria-hidden="true" />
                  Tasks {checklist.length ? `${tasksDone}/${checklist.length}` : ''}
                  <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div id={`tasks-${slotKey}`} className="mt-2 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-4">
                    <SessionChecklist session={session} actions={actions} disabled={busy} compact />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </section>
  );
};

export default LiveSessionsCard;
