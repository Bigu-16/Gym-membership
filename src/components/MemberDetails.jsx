import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const MemberDetails = ({ member, onBack, onUpdateMember }) => {
  const [localMember, setLocalMember] = useState(member);
  const [loading, setLoading] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeDuration, setFreezeDuration] = useState(1);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    parentPhone: '',
    gender: 'Male',
    medicalIssues: '',
    planId: 3,
    expiryDate: '',
    messagingOptIn: true,
  });

  const fetchFreshDetails = async () => {
    if (!member) return;
    setLoading(true);
    try {
      if (member.isGroup) {
        const families = await apiService.getFamilies(member.parentPhone);
        if (families && families.length > 0) {
          setLocalMember(families[0]);
        }
      } else {
        const fresh = await apiService.getMember(member.id);
        if (fresh) {
          setLocalMember(fresh);
        }
      }
    } catch (err) {
      console.error("Error fetching fresh member details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLocalMember(member);
    fetchFreshDetails();
  }, [member.id, member.parentPhone]);

  if (!localMember) return null;

  const calculateDaysRemaining = (date) => {
    if (!date) return 0;
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining(localMember.expiryDate);

  const getStatusColor = () => {
    if (localMember.isFrozen) return 'text-indigo-400';
    if (daysRemaining < 3) return 'text-rose-500';
    if (daysRemaining < 7) return 'text-amber-400';
    return 'text-emerald-500';
  };

  const handleFreezeToggle = () => {
    if (!localMember.isFrozen) {
      const newExpiry = new Date(localMember.expiryDate);
      newExpiry.setMonth(newExpiry.getMonth() + parseInt(freezeDuration));
      
      const frozenData = {
        isFrozen: true,
        freezeStartDate: new Date().toISOString(),
        freezeDuration: parseInt(freezeDuration),
        expiryDate: newExpiry.toISOString()
      };

      if (localMember.isGroup) {
        onUpdateMember({
          ...localMember,
          ...frozenData,
          trainees: localMember.trainees.map(t => ({ ...t, ...frozenData }))
        });
      } else {
        onUpdateMember({ ...localMember, ...frozenData });
      }
    } else {
      const unfrozenData = {
        isFrozen: false,
        freezeStartDate: null,
        freezeDuration: null,
      };

      if (localMember.isGroup) {
        onUpdateMember({
          ...localMember,
          ...unfrozenData,
          trainees: localMember.trainees.map(t => ({ ...t, ...unfrozenData }))
        });
      } else {
        onUpdateMember({ ...localMember, ...unfrozenData });
      }
    }
    setShowFreezeModal(false);
  };

  const startEditing = (m) => {
    setEditingMemberId(m.id);
    setEditForm({
      name: m.name || '',
      phone: m.phone || '',
      parentPhone: m.parentPhone || '',
      gender: m.gender || 'Male',
      medicalIssues: m.medicalIssues || '',
      planId: m.planId || 3,
      expiryDate: m.expiryDate ? m.expiryDate.split('T')[0] : '',
      messagingOptIn: m.messagingOptIn !== undefined ? m.messagingOptIn : true,
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (!editForm.name.trim() || !editForm.phone.trim()) {
        alert('Name and Phone are required.');
        return;
      }
      
      const updatedData = {
        id: editingMemberId,
        name: editForm.name,
        phone: editForm.phone,
        parentPhone: editForm.parentPhone || null,
        gender: editForm.gender,
        medicalIssues: editForm.medicalIssues || '',
        planId: parseInt(editForm.planId),
        expiryDate: editForm.expiryDate ? new Date(editForm.expiryDate).toISOString() : null,
        messagingOptIn: editForm.messagingOptIn,
        isFrozen: localMember.isGroup 
          ? (localMember.trainees.find(t => t.id === editingMemberId)?.isFrozen || false)
          : (localMember.isFrozen || false)
      };

      await onUpdateMember(updatedData);
      setEditingMemberId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save changes: ' + err.message);
    }
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

      {loading && !editingMemberId ? (
        <div className="flex justify-center items-center py-24">
          <span className="w-8 h-8 border-4 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
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

            <button 
              onClick={() => localMember.isFrozen ? handleFreezeToggle() : setShowFreezeModal(!showFreezeModal)}
              className={`w-full mt-4 py-3 rounded-xl border text-[10px] uppercase tracking-luxury font-bold transition-all ${
                localMember.isFrozen 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-[var(--glass-border)] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]'
              }`}
            >
              {localMember.isFrozen ? 'Unfreeze Membership' : 'Freeze Membership'}
            </button>

            {!localMember.isGroup && (
              <button 
                onClick={() => startEditing(localMember)}
                className="w-full mt-2 py-3 rounded-xl border border-[var(--glass-border)] bg-transparent text-[10px] uppercase tracking-luxury font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
              >
                Edit Profile
              </button>
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

          {/* Detailed Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {editingMemberId ? (
              <div className="glass-card p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
                  <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">
                    Edit Member Profile
                  </h4>
                  <button 
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
                        onChange={(e) => setEditForm({ ...editForm, planId: parseInt(e.target.value) })}
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
            ) : localMember.isGroup ? (
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
                <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold pt-4">Enrolled Kids ({localMember.trainees.length})</h3>
                {localMember.trainees.map((trainee, index) => (
                  <div key={trainee.id} className="glass-card p-6">
                     <div className="flex justify-between items-center mb-4">
                       <h4 className="text-[12px] uppercase tracking-luxury text-[var(--text-primary)] font-bold flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-[10px]">{index + 1}</div>
                         {trainee.name}
                       </h4>
                       <button 
                         onClick={() => startEditing(trainee)}
                         className="px-3 py-1 rounded-lg border border-[var(--glass-border)] text-[8px] uppercase tracking-luxury font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
                       >
                         Edit Profile
                       </button>
                     </div>
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
                         <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Training Type</p>
                         <p className="text-sm font-semibold capitalize">{trainee.plan || 'N/A'}</p>
                       </div>
                       <div>
                         <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Medical Issues</p>
                         <p className="text-sm font-semibold text-rose-400">{trainee.medicalIssues || 'None reported'}</p>
                       </div>
                     </div>
                  </div>
                ))}
              </>
            ) : (
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
                      <p className="text-sm font-semibold capitalize">{localMember.plan || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Expiry Date</p>
                      <p className="text-sm font-semibold">{localMember.expiryDate ? new Date(localMember.expiryDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
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
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetails;
