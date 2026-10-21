import { useState } from 'react';
import { daysUntil } from '../../utils/membership';
import { toDateKey } from '../../utils/classSessions';
import { fieldClass } from './memberDetailsHelpers';

/** Put a membership (or a whole family) on hold, optionally until a date. */
const FreezePanel = ({ member, busy, onCancel, onConfirm }) => {
  const [freezeUntil, setFreezeUntil] = useState('');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const daysLeft = Math.max(0, daysUntil(member.expiryDate) ?? 0);

  return (
    <section aria-labelledby="freeze-title" className="glass-card mb-6 p-5">
      <h3 id="freeze-title" className="section-title">Freeze membership</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {member.isGroup
          ? `All ${member.trainees?.length || 0} trainees are put on hold. Each trainee's remaining days are paused and continue when the freeze ends.`
          : `The ${daysLeft} day${daysLeft === 1 ? '' : 's'} left are paused and continue when the freeze ends. No check-ins or reminders while frozen.`}
      </p>
      <div className="mt-4 max-w-xs">
        <label htmlFor="freeze-until" className="label mb-1">Freeze until (optional)</label>
        <input
          id="freeze-until"
          type="date"
          min={toDateKey(tomorrow)}
          value={freezeUntil}
          onChange={(e) => setFreezeUntil(e.target.value)}
          aria-describedby="freeze-until-hint"
          className={fieldClass}
        />
        <p id="freeze-until-hint" className="mt-1 text-xs text-[var(--text-secondary)]">Leave empty to unfreeze by hand.</p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="button" disabled={busy} onClick={() => onConfirm(freezeUntil || null)} className="btn-primary">
          Freeze membership
        </button>
      </div>
    </section>
  );
};

export default FreezePanel;
