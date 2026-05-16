import React, { useState } from 'react';

const MemberDetails = ({ member, onBack, onUpdateMember }) => {
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeDuration, setFreezeDuration] = useState(1);

  if (!member) return null;

  const calculateDaysRemaining = (date) => {
    if (!date) return 0;
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining(member.expiryDate);

  const getStatusColor = () => {
    if (member.isFrozen) return 'text-indigo-400';
    if (daysRemaining < 3) return 'text-rose-500';
    if (daysRemaining < 7) return 'text-amber-400';
    return 'text-emerald-500';
  };

  const handleFreezeToggle = () => {
    if (!member.isFrozen) {
      const newExpiry = new Date(member.expiryDate);
      newExpiry.setMonth(newExpiry.getMonth() + parseInt(freezeDuration));
      
      onUpdateMember({
        ...member,
        isFrozen: true,
        freezeStartDate: new Date().toISOString(),
        freezeDuration: parseInt(freezeDuration),
        expiryDate: newExpiry.toISOString()
      });
    } else {
      onUpdateMember({
        ...member,
        isFrozen: false,
        freezeStartDate: null,
        freezeDuration: null,
      });
    }
    setShowFreezeModal(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="glass-card p-8 flex flex-col items-center text-center gap-4 lg:col-span-1 h-fit">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--glass-border)] shadow-xl relative">
            <img 
              src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=128`} 
              alt={member.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=128`;
              }}
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-wide text-[var(--text-primary)]">{member.name}</h3>
            <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] mt-1">{member.plan}</p>
          </div>
          
          <div className="w-full h-px bg-[var(--glass-border)] my-2"></div>
          
          <div className="w-full flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Status</span>
            <span className={`text-xs font-bold uppercase ${getStatusColor()}`}>
              {member.isFrozen ? 'Frozen (On Hold)' : (daysRemaining < 0 ? 'Expired' : `${daysRemaining} Days Left`)}
            </span>
          </div>
          
          <div className="w-full flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Member ID</span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              #{Math.round(member.id).toString().padStart(6, '0')}
            </span>
          </div>

          <button 
            onClick={() => member.isFrozen ? handleFreezeToggle() : setShowFreezeModal(!showFreezeModal)}
            className={`w-full mt-4 py-3 rounded-xl border text-[10px] uppercase tracking-luxury font-bold transition-all ${
              member.isFrozen 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'bg-[var(--glass-border)] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]'
            }`}
          >
            {member.isFrozen ? 'Unfreeze Membership' : 'Freeze Membership'}
          </button>

          {showFreezeModal && !member.isFrozen && (
            <div className="w-full mt-2 p-4 glass-card border border-indigo-500/30 rounded-xl animate-in fade-in zoom-in duration-300 text-left">
              <h4 className="text-[10px] uppercase tracking-luxury font-bold text-indigo-400 mb-2">Hold Configuration</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mb-4">Select the vacation/hold duration. This will extend the expiry date.</p>
              
              <select 
                value={freezeDuration}
                onChange={(e) => setFreezeDuration(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all mb-4"
              >
                <option value={1}>1 Month</option>
                <option value={2}>2 Months</option>
                <option value={3}>3 Months</option>
              </select>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFreezeModal(false)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury hover:bg-[var(--glass-border)] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFreezeToggle}
                  className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-[10px] uppercase tracking-luxury font-bold hover:bg-indigo-600 transition-all shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                >
                  Confirm Hold
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          
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
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Age</p>
                <p className="text-sm font-semibold">{member.age || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Gender</p>
                <p className="text-sm font-semibold">{member.gender || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Medical Issues</p>
                <p className="text-sm font-semibold text-rose-400">{member.medicalIssues || 'None reported'}</p>
              </div>
            </div>
          </div>

          {/* Training & Schedule */}
          <div className="glass-card p-6">
            <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Training & Schedule
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Training Type</p>
                <p className="text-sm font-semibold capitalize">{member.trainingType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Location</p>
                <p className="text-sm font-semibold">{member.schedule?.location || 'Main Gym'}</p>
              </div>
              {member.schedule?.slot && (
                <div className="md:col-span-2">
                  <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Schedule Slot</p>
                  <p className="text-sm font-semibold">{member.schedule.slot}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact / Parent Info (If available) */}
          {(member.parentName || member.parentPhone) && (
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
                  <p className="text-sm font-semibold">{member.parentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Phone Number</p>
                  <p className="text-sm font-semibold">{member.parentPhone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MemberDetails;
