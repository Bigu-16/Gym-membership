import MembershipCard from './MembershipCard';

/** The members list: one card, one row per member or family. */
const MemberGrid = ({ members, onManage }) => {
  if (!members || members.length === 0) {
    return (
      <div className="glass-card mt-6 px-4 py-12 text-center">
        <p className="text-sm text-[var(--text-secondary)]">No members match this view.</p>
      </div>
    );
  }
  return (
    <div className="glass-card mt-6 overflow-hidden">
      <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_11rem_10rem_6rem] gap-4 border-b border-[var(--glass-border)] px-4 py-2 sm:grid">
        <span className="label">Member</span>
        <span className="label">Status</span>
        <span className="label">Expiry</span>
        <span className="label" />
      </div>
      <ul aria-label="Members" className="divide-y divide-[var(--glass-border)]">
        {members.map((member) => (
          <MembershipCard key={member.id} member={member} onManage={onManage} />
        ))}
      </ul>
    </div>
  );
};

export default MemberGrid;
