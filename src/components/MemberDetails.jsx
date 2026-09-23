import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import MemberHeader from './member-details/MemberHeader';
import MemberProfileCard from './member-details/MemberProfileCard';
import MemberEditForm from './member-details/MemberEditForm';
import FamilyGroupSection from './member-details/FamilyGroupSection';
import IndividualMemberInfo from './member-details/IndividualMemberInfo';
import MemberRenewModal from './member-details/MemberRenewModal';

const MemberDetails = ({ member, onBack, onUpdateMember, onDeleteMember, onRenewMember, scheduleTemplates = [] }) => {
  const [localMember, setLocalMember] = useState(member);
  const [loading, setLoading] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeDuration, setFreezeDuration] = useState(1);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  
  // Membership Renewal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewDurationValue, setRenewDurationValue] = useState(1);
  const [renewDurationUnit, setRenewDurationUnit] = useState('Month');
  const [renewFromToday, setRenewFromToday] = useState(true);
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('Cash');
  const [renewAmount, setRenewAmount] = useState('300');
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    gender: 'Male',
    medicalIssues: '',
    planId: 3,
    expiryDate: '',
    messagingOptIn: true,
  });

  const calculateDaysRemaining = (date) => {
    if (!date) return 0;
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateNewExpiryDate = () => {
    const days = calculateDaysRemaining(localMember?.expiryDate);
    const baseDate = (days <= 0 || renewFromToday || !localMember?.expiryDate)
      ? new Date()
      : new Date(localMember.expiryDate);
    
    const newDate = new Date(baseDate);
    const val = parseInt(renewDurationValue, 10) || 1;
    const unit = renewDurationUnit.toLowerCase();

    if (unit.startsWith('day')) {
      newDate.setDate(newDate.getDate() + val);
    } else if (unit.startsWith('week')) {
      newDate.setDate(newDate.getDate() + val * 7);
    } else if (unit.startsWith('month')) {
      newDate.setMonth(newDate.getMonth() + val);
    } else if (unit.startsWith('year')) {
      newDate.setFullYear(newDate.getFullYear() + val);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    return newDate;
  };

  const handleConfirmRenewal = async () => {
    setIsRenewing(true);
    try {
      const newExpiry = calculateNewExpiryDate();
      const newExpiryIso = newExpiry.toISOString();
      if (onRenewMember) {
        await onRenewMember(localMember, newExpiryIso);
      }
      setRenewSuccess(true);
      setTimeout(() => {
        setRenewSuccess(false);
        setShowRenewModal(false);
      }, 1200);

      setLocalMember(prev => {
        if (!prev) return prev;
        if (prev.isGroup && prev.trainees) {
          return {
            ...prev,
            expiryDate: newExpiryIso,
            isFrozen: false,
            trainees: prev.trainees.map(t => ({ ...t, expiryDate: newExpiryIso, isFrozen: false }))
          };
        }
        return { ...prev, expiryDate: newExpiryIso, isFrozen: false };
      });
    } catch (err) {
      console.error('Renewal failed:', err);
      alert('Failed to renew membership: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDeleteConfirm = async (memberId) => {
    try {
      setLoading(true);
      await onDeleteMember(memberId);
      setShowDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete member: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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
          if (fresh.parentPhone && !fresh.parentName) {
            const families = await apiService.getFamilies(fresh.parentPhone).catch(() => []);
            if (families && families.length > 0 && families[0].parentName) {
              fresh.parentName = families[0].parentName;
            }
          }
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
      newExpiry.setMonth(newExpiry.getMonth() + parseInt(freezeDuration, 10));
      
      const frozenData = {
        isFrozen: true,
        freezeStartDate: new Date().toISOString(),
        freezeDuration: parseInt(freezeDuration, 10),
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
      parentName: m.parentName || '',
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
        parentName: editForm.parentName || null,
        parentPhone: editForm.parentPhone || null,
        gender: editForm.gender,
        medicalIssues: editForm.medicalIssues || '',
        planId: parseInt(editForm.planId, 10),
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
      <MemberHeader onBack={onBack} />

      {loading && !editingMemberId ? (
        <div className="flex justify-center items-center py-24">
          <span className="w-8 h-8 border-4 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <MemberProfileCard 
            localMember={localMember}
            daysRemaining={daysRemaining}
            getStatusColor={getStatusColor}
            setShowRenewModal={setShowRenewModal}
            handleFreezeToggle={handleFreezeToggle}
            showFreezeModal={showFreezeModal}
            setShowFreezeModal={setShowFreezeModal}
            freezeDuration={freezeDuration}
            setFreezeDuration={setFreezeDuration}
            showDeleteConfirmId={showDeleteConfirmId}
            setShowDeleteConfirmId={setShowDeleteConfirmId}
            handleDeleteConfirm={handleDeleteConfirm}
            startEditing={startEditing}
          />

          <div className="lg:col-span-2 space-y-6">
            {editingMemberId ? (
              <MemberEditForm 
                editForm={editForm}
                setEditForm={setEditForm}
                setEditingMemberId={setEditingMemberId}
                handleSaveEdit={handleSaveEdit}
              />
            ) : localMember.isGroup ? (
              <FamilyGroupSection 
                localMember={localMember}
                showDeleteConfirmId={showDeleteConfirmId}
                setShowDeleteConfirmId={setShowDeleteConfirmId}
                handleDeleteConfirm={handleDeleteConfirm}
                startEditing={startEditing}
              />
            ) : (
              <IndividualMemberInfo localMember={localMember} />
            )}
          </div>
        </div>
      )}

      <MemberRenewModal 
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        localMember={localMember}
        daysRemaining={daysRemaining}
        renewDurationValue={renewDurationValue}
        setRenewDurationValue={setRenewDurationValue}
        renewDurationUnit={renewDurationUnit}
        setRenewDurationUnit={setRenewDurationUnit}
        renewFromToday={renewFromToday}
        setRenewFromToday={setRenewFromToday}
        renewPaymentMethod={renewPaymentMethod}
        setRenewPaymentMethod={setRenewPaymentMethod}
        renewAmount={renewAmount}
        setRenewAmount={setRenewAmount}
        isRenewing={isRenewing}
        renewSuccess={renewSuccess}
        calculateNewExpiryDate={calculateNewExpiryDate}
        handleConfirmRenewal={handleConfirmRenewal}
      />
    </div>
  );
};

export default MemberDetails;
