import { useState } from 'react';
import { formatTimeRange } from '../../utils/classSessions';
import ClassSlotPicker from '../enrollment/ClassSlotPicker';

/** Shows a member's weekly class slots and lets staff replace them. */
const MemberClassesEditor = ({ member, scheduleTemplates = [], onSetMemberClasses, compact = false }) => {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const classes = member.enrolledClasses || [];

  const startEditing = () => {
    setSelected(member.enrolledTemplateIds || classes.map((c) => c.id));
    setError('');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSetMemberClasses(member, selected);
      setEditing(false);
    } catch (err) {
      setError(err?.message || 'Could not update classes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'glass-card p-6 space-y-4'}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">Classes</h4>
        {onSetMemberClasses && !editing && (
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit classes for ${member.name}`}
            className="px-3 py-1 rounded-lg border border-[var(--glass-border)] text-[9px] uppercase tracking-luxury font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
          >
            Edit classes
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <ClassSlotPicker
            templates={scheduleTemplates}
            plan={member.planDetails}
            age={member.age}
            selectedIds={selected}
            onChange={setSelected}
            label="Weekly class slots"
          />
          {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save classes'}
            </button>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">Not enrolled in any class slot.</p>
      ) : (
        <ul className="space-y-2">
          {classes.map((c) => (
            <li key={c.id} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--glass-border)]">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{c.className}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{c.days} · {formatTimeRange(c.time)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberClassesEditor;
