import MemberAvatar from './MemberAvatar';
import MemberStatusBadge from './MemberStatusBadge';

/** Back button, who this is, their status and the main actions. */
const MemberHeader = ({ member, busy, editing, onBack, onRenew, onFreeze, onUnfreeze, onEdit, onDelete }) => {
  const subtitle = member.isGroup
    ? `Family · ${member.trainees?.length || 0} trainee${member.trainees?.length === 1 ? '' : 's'}`
    : `Member #${String(member.id).padStart(6, '0')}`;

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back to members" className="btn-secondary btn-sm px-2">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <MemberAvatar name={member.name} image={member.image} size={40} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold text-[var(--text-primary)]">{member.name}</h2>
            <MemberStatusBadge member={member} />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRenew} className="btn-primary">Renew</button>
        <button type="button" disabled={busy} onClick={member.isFrozen ? onUnfreeze : onFreeze} className="btn-secondary">
          {member.isFrozen ? 'Unfreeze' : 'Freeze'}
        </button>
        {!member.isGroup && !editing && (
          <>
            <button type="button" onClick={onEdit} className="btn-secondary">Edit</button>
            <button type="button" onClick={onDelete} className="btn-danger">Delete</button>
          </>
        )}
      </div>
    </div>
  );
};

export default MemberHeader;
