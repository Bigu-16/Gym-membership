import MembershipCard from './MembershipCard';

const MemberGrid = ({ members, onManage }) => {
  if (!members || members.length === 0) {
    return (
      <p className="py-16 text-center text-xs uppercase tracking-luxury text-[var(--text-secondary)]">
        No members match this view.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
      {members.map((member) => (
        <MembershipCard key={member.id} member={member} onManage={onManage} />
      ))}
    </div>
  );
};

export default MemberGrid;
