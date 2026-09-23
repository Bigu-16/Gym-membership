import React from 'react';

const MemberEditForm = ({
  editForm,
  setEditForm,
  setEditingMemberId,
  handleSaveEdit
}) => {
  return (
    <div className="glass-card p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
        <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">
          Edit Member Profile
        </h4>
        <button 
          type="button"
          onClick={() => setEditingMemberId(null)}
          className="text-[10px] uppercase tracking-luxury text-rose-500 hover:text-rose-400 font-bold"
        >
          Cancel
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Full Name</label>
          <input 
            required
            type="text"
            pattern="^[a-zA-Z\s\-']+$"
            title="Names should only contain letters, spaces, hyphens, and apostrophes."
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)]"
            placeholder="Full name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Phone Number</label>
          <input 
            required
            type="text"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)]"
            placeholder="Phone number"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Parent/Guardian Name (Optional)</label>
          <input 
            type="text"
            value={editForm.parentName}
            onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)]"
            placeholder="Parent/guardian full name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Parent Phone (Optional)</label>
          <input 
            type="text"
            value={editForm.parentPhone}
            onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)]"
            placeholder="Parent phone number"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Gender</label>
          <div className="relative">
            <select 
              value={editForm.gender}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)] appearance-none cursor-pointer pr-8"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Membership Plan</label>
          <div className="relative">
            <select 
              value={editForm.planId}
              onChange={(e) => setEditForm({ ...editForm, planId: parseInt(e.target.value, 10) })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)] appearance-none cursor-pointer pr-8"
            >
              <option value={1}>Starter Access</option>
              <option value={2}>Wellness Pro</option>
              <option value={3}>Elite Performance</option>
              <option value={4}>Family Group</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Expiry Date</label>
          <input 
            type="date"
            value={editForm.expiryDate}
            onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)] cursor-pointer"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Medical Issues</label>
          <textarea 
            value={editForm.medicalIssues}
            onChange={(e) => setEditForm({ ...editForm, medicalIssues: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)] h-24 resize-none"
            placeholder="List medical issues or 'None'"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 py-2 px-1">
          <input 
            type="checkbox"
            id="messagingOptIn"
            checked={editForm.messagingOptIn}
            onChange={(e) => setEditForm({ ...editForm, messagingOptIn: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--glass-border)] accent-[var(--text-primary)] cursor-pointer"
          />
          <label htmlFor="messagingOptIn" className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] cursor-pointer select-none">
            Opt-in to SMS/Whatsapp Messaging
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-[var(--glass-border)]">
        <button 
          type="button"
          onClick={() => setEditingMemberId(null)}
          className="flex-1 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury font-bold hover:bg-[var(--glass-border)] transition-all"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={handleSaveEdit}
          className="flex-1 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:opacity-90 transition-all shadow-lg"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default MemberEditForm;
