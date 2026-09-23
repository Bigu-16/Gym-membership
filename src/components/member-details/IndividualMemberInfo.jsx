import React from 'react';

const IndividualMemberInfo = ({ localMember }) => {
  return (
    <>
      {/* Personal Info */}
      <div className="glass-card p-6">
        <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Phone Number</p>
            <p className="text-sm font-semibold">{localMember.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Gender</p>
            <p className="text-sm font-semibold capitalize">{localMember.gender || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Medical Issues</p>
            <p className="text-sm font-semibold text-rose-400">{localMember.medicalIssues || 'None reported'}</p>
          </div>
        </div>
      </div>

      {/* Membership & Schedule */}
      <div className="glass-card p-6">
        <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Membership & Class Schedule
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Membership Plan</p>
            <p className="text-sm font-semibold capitalize">{localMember.plan || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Expiry Date</p>
            <p className="text-sm font-semibold">{localMember.expiryDate ? new Date(localMember.expiryDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          {(localMember.enrolledClass || localMember.schedule) && (
            <>
              <div>
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Class Attendance Slot</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {localMember.enrolledClass?.className || localMember.schedule?.slot?.split(': ')[0] || localMember.plan}
                  {localMember.enrolledClass?.days && (
                    <span className="text-xs text-[var(--text-secondary)] block font-normal mt-0.5">
                      {localMember.enrolledClass.days}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Time Slot & Location</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {localMember.enrolledClass?.time || (localMember.schedule?.slot?.includes('@ ') ? localMember.schedule.slot.split('@ ')[1] : 'Scheduled Time')}
                  <span className="text-xs text-[var(--text-secondary)] block font-normal mt-0.5">
                    {localMember.enrolledClass?.location || localMember.schedule?.location || 'Main Studio'}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact / Parent Info (If available) */}
      {(localMember.parentName || localMember.parentPhone) && (
        <div className="glass-card p-6">
          <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Parent/Guardian Name</p>
              <p className="text-sm font-semibold">{localMember.parentName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Phone Number</p>
              <p className="text-sm font-semibold">{localMember.parentPhone || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IndividualMemberInfo;
