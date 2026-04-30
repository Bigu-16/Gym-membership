import React from 'react';
import MembershipCard from './MembershipCard';

const MemberGrid = ({ members }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
      {members.map((member) => (
        <MembershipCard key={member.id} member={member} />
      ))}
    </div>
  );
};

export default MemberGrid;
