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
    <div className={compact ? 'space-y-3' : 'glass-card space-y-3 p-5'}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="label">Classes</h4>
        {onSetMemberClasses && !editing && (
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit classes for ${member.name}`}
            className="btn-secondary btn-sm"
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
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} disabled={saving} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : 'Save classes'}
            </button>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Not enrolled in any class slot.</p>
      ) : (
        <ul className="divide-y divide-[var(--glass-border)]">
          {classes.map((c) => (
            <li key={c.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{c.className}</span>
              <span className="text-xs text-[var(--text-secondary)]">{c.days} · {formatTimeRange(c.time)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberClassesEditor;
