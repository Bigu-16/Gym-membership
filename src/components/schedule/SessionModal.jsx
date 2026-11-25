import { Clock, Timer, User, Users, X } from 'lucide-react';
import { traineesForSession } from '../../utils/classSessions';
import { membershipStatus } from '../../utils/membership';
import StatusBadge from '../sessions/StatusBadge';
import SessionChecklist from '../sessions/SessionChecklist';
import SessionActionButtons from '../sessions/SessionActionButtons';

const timeFormat = { hour: 'numeric', minute: '2-digit' };

const SessionModal = ({ session, onClose, actions, members = [], now = new Date() }) => {
  const trainees = traineesForSession(session, members);
  const busy = actions.pendingId === session.id;
  const running = now >= session.start && now <= session.end;
  const total = session.end - session.start;
  const elapsedPercent = total > 0 ? Math.min(100, Math.max(0, ((now - session.start) / total) * 100)) : 0;
  const minutesLeft = Math.max(0, Math.ceil((session.end - now) / 60000));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={`${session.title} details`}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md h-full glass-card p-8 relative flex flex-col border-[var(--glass-border)] bg-[var(--bg-secondary)]">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--glass-border)]">
          <X size={18} />
        </button>

        <div className="mb-6 pr-10">
          <StatusBadge status={session.status} isLive={session.isLive} className="mb-3" />
          <h2 className="text-2xl font-semibold mb-2">{session.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)] text-sm">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {session.start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })},{' '}
              {session.start.toLocaleTimeString([], timeFormat)} – {session.end.toLocaleTimeString([], timeFormat)}
            </span>
            {session.trainer && <span className="flex items-center gap-1.5"><User size={14} /> {session.trainer}</span>}
          </div>
        </div>

        <div className="space-y-6 flex-grow overflow-y-auto pr-1 custom-scrollbar">
          {running && session.status !== 'cancelled' && (
            <div className="glass-card p-5 border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-bold text-success">
                  <Timer size={16} /> Time remaining
                </span>
                <span className="text-2xl font-mono font-bold">{minutesLeft} min</span>
              </div>
              <div className="h-2 bg-[var(--glass-border)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${elapsedPercent}%` }} />
              </div>
            </div>
          )}

          <div className="bg-[var(--bg-primary)] p-5 rounded-2xl border border-[var(--glass-border)]">
            <SessionChecklist session={session} actions={actions} disabled={busy} compact />
          </div>

          <div className="bg-[var(--bg-primary)] p-5 rounded-2xl border border-[var(--glass-border)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2 text-xs font-bold">
                <Users size={16} className="text-[var(--text-secondary)]" /> Enrolled trainees
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--glass-border)]">
                {trainees.length}{session.capacity ? ` / ${session.capacity}` : ''}
              </span>
            </div>
            {trainees.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">Nobody is enrolled in this class slot yet.</p>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {trainees.map((trainee) => {
                  const status = membershipStatus(trainee);
                  return (
                    <li key={trainee.id} className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={trainee.image} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--glass-border)]" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{trainee.name}{trainee.age ? `, ${trainee.age}` : ''}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">
                            {trainee.parentName ? `Parent: ${trainee.parentName}` : trainee.phone}
                            {trainee.medicalIssues ? ' • Medical note' : ''}
                          </p>
                        </div>
                      </div>
                      {(status === 'expired' || status === 'frozen') && (
                        <span className="text-xs px-2 py-0.5 rounded-md font-bold text-danger bg-rose-500/10">
                          {status}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl glass-card text-xs font-bold">
            Close
          </button>
          <SessionActionButtons session={session} actions={actions} disabled={busy} size="lg" />
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
