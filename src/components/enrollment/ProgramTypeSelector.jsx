import React from 'react';

const ProgramTypeSelector = ({
  trainingType,
  setTrainingType,
  personalType,
  setPersonalType,
  families,
  setFamilies
}) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xs uppercase tracking-luxury font-bold">Select Training Program</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          type="button"
          onClick={() => {
            setTrainingType('group');
            setFamilies([families[0]]); // Reset to one family for group
          }}
          className={`training-type-btn ${trainingType === 'group' ? 'active' : ''}`}
        >
          <div className="icon-container">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Group Training</h3>
            <p className="text-[10px] opacity-60">Standard classes at the gym facility</p>
          </div>
        </button>

        <div className="space-y-4">
          <button 
            type="button"
            onClick={() => setTrainingType('personal')}
            className={`training-type-btn w-full ${trainingType === 'personal' ? 'active' : ''}`}
          >
            <div className="icon-container">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Personal Training</h3>
              <p className="text-[10px] opacity-60">Tailored sessions and flexible timing</p>
            </div>
          </button>
          
          {trainingType === 'personal' && (
            <div className="flex gap-2 p-1 glass-card rounded-xl">
              <button 
                type="button"
                onClick={() => {
                  setPersonalType('individual');
                  setFamilies([families[0]]);
                }}
                className={`flex-1 py-2 text-[10px] uppercase tracking-luxury font-bold rounded-lg transition-all ${personalType === 'individual' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                Individual
              </button>
              <button 
                type="button"
                onClick={() => setPersonalType('group')}
                className={`flex-1 py-2 text-[10px] uppercase tracking-luxury font-bold rounded-lg transition-all ${personalType === 'group' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                Group (Multi-Family)
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProgramTypeSelector;
