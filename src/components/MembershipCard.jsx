import { formatDate, freezeSummary, membershipStatus, periodProgress } from '../utils/membership';
import MemberAvatar from './member-details/MemberAvatar';
import MemberStatusBadge from './member-details/MemberStatusBadge';

const BAR = {
  active: 'bg-[var(--accent-color)]',
  expiring: 'bg-warning-solid',
  expired: 'bg-danger-solid'
};

// A family row follows the trainee whose membership runs out first.
const planForProgress = (member) => {
  if (member.planDetails) return member.planDetails;
  if (member.isGroup) {
    return (member.trainees || []).find((t) => t.expiryDate === member.expiryDate)?.planDetails || null;
  }
  return null;
};

const subtitleFor = (member) => {
  if (!member.isGroup) return member.plan || 'No package';
  const trainees = member.trainees || [];
  const count = `Family · ${trainees.length} trainee${trainees.length === 1 ? '' : 's'}`;
  return trainees.length > 0 ? `${count}: ${trainees.map((t) => t.name).join(', ')}` : count;
};

const expiryText = (member) => {
  if (member.isFrozen) return member.isGroup ? 'Paused' : freezeSummary(member);
  return member.expiryDate ? formatDate(member.expiryDate) : '—';
};

/** One row of the members list (rendered inside MemberGrid's <ul>). */
const MembershipCard = ({ member, onManage }) => {
  const status = membershipStatus(member);
  const manage = () => onManage && onManage(member);
  const showBar = Boolean(BAR[status]);

  return (
    <li
      onClick={manage}
      className="flex cursor-pointer flex-col gap-3 px-4 py-3 transition-colors hover:bg-[var(--card-hover)] sm:grid sm:grid-cols-[minmax(0,1fr)_11rem_10rem_6rem] sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <MemberAvatar name={member.name} image={member.image} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{member.name}</p>
          <p className="truncate text-xs text-[var(--text-secondary)]">{subtitleFor(member)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:contents">
        <div><MemberStatusBadge member={member} /></div>

        <div className="min-w-0 text-xs text-[var(--text-secondary)]">
          <span className="sm:hidden">{member.isFrozen ? '' : 'Expiry: '}</span>
          <span className="text-[var(--text-primary)]">{expiryText(member)}</span>
          {showBar && (
            <div className="mt-1 hidden h-1 w-full overflow-hidden rounded-full bg-[var(--glass-border)] sm:block">
              <div
                data-testid="membership-progress"
                className={`h-full ${BAR[status]}`}
                style={{ width: `${periodProgress(member, planForProgress(member))}%` }}
              />
            </div>
          )}
        </div>

        <div className="ml-auto sm:ml-0 sm:text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              manage();
            }}
            aria-label={`Manage ${member.name}`}
            className="btn-secondary btn-sm"
          >
            Manage
          </button>
        </div>
      </div>
    </li>
  );
};

export default MembershipCard;
