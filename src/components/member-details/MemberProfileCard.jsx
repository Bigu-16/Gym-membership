import { useState } from 'react';
import { daysUntil, formatDate, freezeSummary, membershipStatus } from '../../utils/membership';
import { toDateKey } from '../../utils/classSessions';

const STATUS_COLOR = {
  frozen: 'text-indigo-400',
  expired: 'text-rose-500',
  expiring: 'text-amber-400',
  active: 'text-emerald-500',
  'no-expiry': 'text-[var(--text-secondary)]'
};

const statusText = (member) => {
  const status = membershipStatus(member);
  const days = daysUntil(member.expiryDate);
  if (status === 'frozen') return 'Frozen';
  if (status === 'no-expiry') return 'No expiry set';
  if (status === 'expired') return 'Expired';
  if (days === 0) return 'Expires today';
  return `${days} Days Left`;
};

const MemberProfileCard = ({
  member,
  busy,
  onRenew,
  onFreeze,
  onUnfreeze,
  showDeleteConfirmId,
  setShowDeleteConfirmId,
  handleDeleteConfirm,
  startEditing
}) => {
  const [showFreezePanel, setShowFreezePanel] = useState(false);
  const [freezeUntil, setFreezeUntil] = useState('');
  const status = membershipStatus(member);
  const days = daysUntil(member.expiryDate);
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=128`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const daysLeftNow = Math.max(0, days ?? 0);

  const confirmFreeze = async () => {
    const ok = await onFreeze(freezeUntil || null);
    if (ok) {
      setShowFreezePanel(false);
      setFreezeUntil('');
    }
  };

  return (
    <div className="glass-card p-8 flex flex-col items-center text-center gap-4 lg:col-span-1 h-fit">
      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--glass-border)] shadow-xl">
        <img
          src={member.image || fallbackAvatar}
          alt={member.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = fallbackAvatar;
          }}
        />
      </div>
      <div>
        <h3 className="text-2xl font-bold tracking-wide text-[var(--text-primary)]">{member.name}</h3>
        <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] mt-1">{member.plan}</p>
      </div>

      <div className="w-full h-px bg-[var(--glass-border)] my-2"></div>

      <div className="w-full flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Status</span>
        <span className={`text-xs font-bold uppercase ${STATUS_COLOR[status]}`}>{statusText(member)}</span>
      </div>
      <div className="w-full flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">{member.isGroup ? 'Earliest expiry' : 'Expiry'}</span>
        <span className="text-xs font-semibold">{member.isFrozen && !member.isGroup ? 'Paused' : formatDate(member.expiryDate)}</span>
      </div>
      {member.isFrozen && !member.isGroup && (
        <div className="w-full p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-left">
          <span className="text-[10px] uppercase tracking-luxury font-bold block">Membership on hold</span>
          <span className="text-[11px]">{freezeSummary(member)}</span>
          {member.frozenSince && <span className="block text-[10px] text-[var(--text-secondary)] mt-1">Frozen since {formatDate(member.frozenSince)}</span>}
        </div>
      )}
      <div className="w-full flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Member ID</span>
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {member.isGroup ? `Family #${member.familyId}` : `#${String(member.id).padStart(6, '0')}`}
        </span>
      </div>

      {status === 'expired' && (
        <div className="w-full mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center">
          <span className="text-[10px] uppercase tracking-luxury font-bold block">Membership Expired</span>
          <span className="text-[9px] text-[var(--text-secondary)]">
            Expired {Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} ago
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onRenew}
        className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[10px] uppercase tracking-luxury font-bold transition-all"
      >
        ↻ Renew Membership
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => (member.isFrozen ? onUnfreeze() : setShowFreezePanel((open) => !open))}
        className={`w-full mt-2 py-3 rounded-xl border text-[10px] uppercase tracking-luxury font-bold transition-all disabled:opacity-50 ${
          member.isFrozen
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white'
            : 'bg-[var(--glass-border)] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]'
        }`}
      >
        {member.isFrozen ? 'Unfreeze now (resume days)' : 'Freeze Membership'}
      </button>

      {showFreezePanel && !member.isFrozen && (
        <div className="w-full mt-2 p-4 glass-card border border-indigo-500/30 rounded-xl text-left">
          <h4 className="text-[10px] uppercase tracking-luxury font-bold text-indigo-400 mb-2">Hold Configuration</h4>
          <p className="text-[10px] text-[var(--text-secondary)] mb-3">
            {member.isGroup
              ? `All ${member.trainees?.length || 0} trainees are put on hold. Each child's remaining days are paused and continue when the freeze ends.`
              : `The ${daysLeftNow} day${daysLeftNow === 1 ? '' : 's'} left are paused and continue when the freeze ends. No check-ins or reminders while frozen.`}
          </p>
          <label htmlFor="freeze-until" className="block text-[10px] text-[var(--text-secondary)] mb-1">
            Frozen until (optional — leave empty to unfreeze by hand)
          </label>
          <input
            id="freeze-until"
            type="date"
            min={toDateKey(tomorrow)}
            value={freezeUntil}
            onChange={(e) => setFreezeUntil(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs mb-4 text-[var(--text-primary)]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFreezePanel(false)}
              className="flex-1 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={confirmFreeze}
              className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50"
            >
              Confirm Hold
            </button>
          </div>
        </div>
      )}

      {!member.isGroup && (showDeleteConfirmId === member.id ? (
        <div className="w-full mt-2 p-4 glass-card border border-rose-500/30 rounded-xl text-left">
          <h4 className="text-[10px] uppercase tracking-luxury font-bold text-rose-500 mb-2">Confirm Deletion</h4>
          <p className="text-[10px] text-[var(--text-secondary)] mb-4">Delete this member? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirmId(null)}
              className="flex-1 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDeleteConfirm(member.id)}
              className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => startEditing(member)}
            className="w-full mt-2 py-3 rounded-xl border border-[var(--glass-border)] bg-transparent text-[10px] uppercase tracking-luxury font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirmId(member.id)}
            className="w-full mt-2 py-3 rounded-xl border border-rose-500/30 bg-transparent text-[10px] uppercase tracking-luxury font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
          >
            Delete Member
          </button>
        </>
      ))}
    </div>
  );
};

export default MemberProfileCard;
