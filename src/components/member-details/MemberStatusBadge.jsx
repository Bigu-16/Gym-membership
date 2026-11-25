import { membershipStatus } from '../../utils/membership';
import { memberStatusLabel } from './memberDetailsHelpers';

const TONE = {
  active: 'bg-emerald-500/10 text-success',
  expiring: 'bg-amber-500/10 text-warning',
  expired: 'bg-rose-500/10 text-danger',
  frozen: 'bg-sky-500/10 text-info',
  'no-expiry': 'bg-[var(--card-hover)] text-[var(--text-secondary)]'
};

/** Small pill with the member's membership status. */
const MemberStatusBadge = ({ member }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[membershipStatus(member)]}`}>
    {memberStatusLabel(member)}
  </span>
);

export default MemberStatusBadge;
