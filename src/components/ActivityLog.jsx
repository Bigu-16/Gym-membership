import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Spinner } from './common/Feedback';

const FILTERS = [
  { value: '', label: 'Everything' },
  { value: 'member', label: 'Members' },
  { value: 'family', label: 'Families' },
  { value: 'payment', label: 'Payments' },
  { value: 'package', label: 'Packages' },
  { value: 'class', label: 'Classes' },
  { value: 'user', label: 'Staff accounts' },
  { value: 'settings', label: 'Settings' }
];

const formatWhen = (value) => new Date(value).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Admin-only record of who changed what. */
const ActivityLog = () => {
  const [entityType, setEntityType] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await apiService.getAuditLogs({ entity_type: entityType || undefined, limit: 300 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    // Loading the log is the external sync this effect exists for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Activity log</h2>
          <p className="text-xs text-[var(--text-secondary)]">Who registered, renewed, edited or deleted what — newest first.</p>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="activity-filter">Show</label>
          <select id="activity-filter" value={entityType} onChange={(e) => setEntityType(e.target.value)} className="select-chevron bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-xl pl-3 pr-10 py-2 text-sm text-[var(--text-primary)]">
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button type="button" onClick={load} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-xs text-danger">{error}</p>}
      {loading ? (
        <Spinner label="Loading the activity log…" className="text-sm text-[var(--text-secondary)]" />
      ) : rows.length === 0 ? (
        <p className="glass-card p-8 text-center text-sm text-[var(--text-secondary)]">Nothing recorded yet.</p>
      ) : (
        <ul className="glass-card divide-y divide-[var(--glass-border)]">
          {rows.map((row) => (
            <li key={row.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
              <span className="text-xs text-[var(--text-secondary)] sm:w-44 shrink-0">{formatWhen(row.created_at)}</span>
              <span className="flex-grow">{row.summary}</span>
              <span className="text-xs text-[var(--text-secondary)] shrink-0">{row.actor_email || 'system'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityLog;
