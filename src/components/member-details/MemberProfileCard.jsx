import React from 'react';

const MemberProfileCard = ({
  localMember,
  daysRemaining,
  getStatusColor,
  setShowRenewModal,
  handleFreezeToggle,
  showFreezeModal,
  setShowFreezeModal,
  freezeDuration,
  setFreezeDuration,
  showDeleteConfirmId,
  setShowDeleteConfirmId,
  handleDeleteConfirm,
  startEditing
}) => {
  return (
    <div className="glass-card p-8 flex flex-col items-center text-center gap-4 lg:col-span-1 h-fit">
      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--glass-border)] shadow-xl relative">
        <img 
          src={localMember.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(localMember.name)}&background=random&color=fff&size=128`} 
          alt={localMember.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(localMember.name)}&background=random&color=fff&size=128`;
          }}
        />
      </div>
      <div>
        <h3 className="text-2xl font-bold tracking-wide text-[var(--text-primary)]">{localMember.name}</h3>
        <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] mt-1">{localMember.plan}</p>
      </div>
      
      <div className="w-full h-px bg-[var(--glass-border)] my-2"></div>
      
      <div className="w-full flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Status</span>
        <span className={`text-xs font-bold uppercase ${getStatusColor()}`}>
          {localMember.isFrozen ? 'Frozen (On Hold)' : (daysRemaining < 0 ? 'Expired' : `${daysRemaining} Days Left`)}
        </span>
      </div>
      
      <div className="w-full flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Member ID</span>
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {typeof localMember.id === 'number' ? `#${Math.round(localMember.id).toString().padStart(6, '0')}` : 'Family ID'}
        </span>
      </div>

      {daysRemaining <= 0 && (
        <div className="w-full mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center animate-pulse">
          <span className="text-[10px] uppercase tracking-luxury font-bold block">Membership Expired</span>
          <span className="text-[9px] text-[var(--text-secondary)]">Expired {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) === 1 ? '' : 's'} ago</span>
        </div>
      )}

      <button 
        type="button"
        onClick={() => setShowRenewModal(true)}
        className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white text-[10px] uppercase tracking-luxury font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 group"
      >
        <span className="text-xs transition-transform group-hover:rotate-180 duration-500 font-bold inline-block leading-none">↻</span>
        Renew Membership
      </button>

      <button 
        type="button"
        onClick={() => localMember.isFrozen ? handleFreezeToggle() : setShowFreezeModal(!showFreezeModal)}
        className={`w-full mt-2 py-3 rounded-xl border text-[10px] uppercase tracking-luxury font-bold transition-all ${
          localMember.isFrozen 
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
            : 'bg-[var(--glass-border)] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]'
        }`}
      >
        {localMember.isFrozen ? 'Unfreeze Membership' : 'Freeze Membership'}
      </button>

      {showDeleteConfirmId === localMember.id ? (
        <div className="w-full mt-2 p-4 glass-card border border-rose-500/30 rounded-xl animate-in fade-in zoom-in duration-300 text-left">
          <h4 className="text-[10px] uppercase tracking-luxury font-bold text-rose-500 mb-2">Confirm Deletion</h4>
          <p className="text-[10px] text-[var(--text-secondary)] mb-4">Are you sure you want to delete this member? This action cannot be undone.</p>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setShowDeleteConfirmId(null)}
              className="flex-1 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury hover:bg-[var(--glass-border)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={() => handleDeleteConfirm(localMember.id)}
              className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-[10px] uppercase tracking-luxury font-bold hover:bg-rose-600 transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          {!localMember.isGroup && (
            <>
              <button 
                type="button"
                onClick={() => startEditing(localMember)}
                className="w-full mt-2 py-3 rounded-xl border border-[var(--glass-border)] bg-transparent text-[10px] uppercase tracking-luxury font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
              >
                Edit Profile
              </button>
              <button 
                type="button"
                onClick={() => setShowDeleteConfirmId(localMember.id)}
                className="w-full mt-2 py-3 rounded-xl border border-rose-500/30 bg-transparent text-[10px] uppercase tracking-luxury font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
              >
                Delete Member
              </button>
            </>
          )}
        </>
      )}

      {showFreezeModal && !localMember.isFrozen && (
        <div className="w-full mt-2 p-4 glass-card border border-indigo-500/30 rounded-xl animate-in fade-in zoom-in duration-300 text-left">
          <h4 className="text-[10px] uppercase tracking-luxury font-bold text-indigo-400 mb-2">Hold Configuration</h4>
          <p className="text-[10px] text-[var(--text-secondary)] mb-4">Select the vacation/hold duration. This will extend the expiry date.</p>
          
          <select 
            value={freezeDuration}
            onChange={(e) => setFreezeDuration(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all mb-4 text-[var(--text-primary)]"
          >
            <option value={1}>1 Month</option>
            <option value={2}>2 Months</option>
            <option value={3}>3 Months</option>
          </select>

          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setShowFreezeModal(false)}
              className="flex-1 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury hover:bg-[var(--glass-border)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleFreezeToggle}
              className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-[10px] uppercase tracking-luxury font-bold hover:bg-indigo-600 transition-all shadow-[0_0_10px_rgba(99,102,241,0.3)]"
            >
              Confirm Hold
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfileCard;
