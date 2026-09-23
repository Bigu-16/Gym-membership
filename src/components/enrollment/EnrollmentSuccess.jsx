import React from 'react';

const EnrollmentSuccess = ({ families = [] }) => {
  const parentName = families[0]?.parentInfo?.name || 'Member';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] glass-card p-12 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 mb-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-light uppercase tracking-luxury mb-4">Enrollment Successful</h2>
      <p className="text-[var(--text-secondary)] text-lg max-w-md">
        The registration for <span className="text-[var(--text-primary)] font-bold">{parentName}'s</span> family has been processed.
      </p>
    </div>
  );
};

export default EnrollmentSuccess;
