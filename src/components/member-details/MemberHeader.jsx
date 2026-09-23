import React from 'react';

const MemberHeader = ({ onBack }) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      <button 
        type="button"
        onClick={onBack}
        className="p-2 rounded-full glass-card hover:bg-[var(--glass-border)] transition-all"
      >
        <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h2 className="text-xl md:text-2xl font-light uppercase tracking-luxury">
        Member <span className="font-bold">Details</span>
      </h2>
    </div>
  );
};

export default MemberHeader;
