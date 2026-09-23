import React from 'react';

const FamilyGroupSection = ({
  localMember,
  showDeleteConfirmId,
  setShowDeleteConfirmId,
  handleDeleteConfirm,
  startEditing
}) => {
  return (
    <>
      {/* Parent Contact Details */}
      <div className="glass-card p-6">
        <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Parent Contact Details
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

      {/* Trainees List */}
      <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold pt-4">
        Enrolled Kids ({localMember.trainees?.length || 0})
      </h3>
      {(localMember.trainees || []).map((trainee, index) => (
        <div key={trainee.id} className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[12px] uppercase tracking-luxury text-[var(--text-primary)] font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-[10px]">{index + 1}</div>
              {trainee.name}
            </h4>
            {showDeleteConfirmId === trainee.id ? (
              <span className="text-[10px] uppercase tracking-luxury text-rose-500 font-bold">Confirm Deleting...</span>
            ) : (
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => startEditing(trainee)}
                  className="px-3 py-1 rounded-lg border border-[var(--glass-border)] text-[8px] uppercase tracking-luxury font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
                >
                  Edit Profile
                </button>
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirmId(trainee.id)}
                  className="px-3 py-1 rounded-lg border border-rose-500/30 text-[8px] uppercase tracking-luxury font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {showDeleteConfirmId === trainee.id && (
            <div className="mb-6 p-4 glass-card border border-rose-500/30 rounded-xl animate-in fade-in zoom-in duration-300 text-left">
              <h4 className="text-[10px] uppercase tracking-luxury font-bold text-rose-500 mb-2">Confirm Deletion</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mb-4">Are you sure you want to delete {trainee.name} from this family? This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury hover:bg-[var(--glass-border)] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleDeleteConfirm(trainee.id)}
                  className="px-4 py-2 rounded-lg bg-rose-500 text-white text-[10px] uppercase tracking-luxury font-bold hover:bg-rose-600 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Phone Number</p>
              <p className="text-sm font-semibold">{trainee.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Gender</p>
              <p className="text-sm font-semibold capitalize">{trainee.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Membership Plan</p>
              <p className="text-sm font-semibold capitalize">{trainee.plan || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Medical Issues</p>
              <p className="text-sm font-semibold text-rose-400">{trainee.medicalIssues || 'None reported'}</p>
            </div>
            {(trainee.enrolledClass || trainee.schedule) && (
              <div className="md:col-span-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--glass-border)]">
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Class Attendance Slot</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {trainee.enrolledClass?.className || trainee.schedule?.slot?.split(': ')[0] || trainee.plan}
                  {trainee.enrolledClass?.days && (
                    <span className="text-[10px] text-[var(--text-secondary)] block font-normal mt-0.5">
                      {trainee.enrolledClass.days} @ {trainee.enrolledClass.time} ({trainee.enrolledClass.location})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default FamilyGroupSection;
