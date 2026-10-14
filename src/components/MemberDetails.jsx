import { useState } from 'react';
import { addMonths } from '../utils/membership';
import { toDateKey } from '../utils/classSessions';
import MemberHeader from './member-details/MemberHeader';
import MemberProfileCard from './member-details/MemberProfileCard';
import MemberEditForm from './member-details/MemberEditForm';
import FamilyGroupSection from './member-details/FamilyGroupSection';
import IndividualMemberInfo from './member-details/IndividualMemberInfo';
import MemberRenewModal from './member-details/MemberRenewModal';
import { applyMemberForm, memberToForm, planOptionsFor, validateMemberForm } from './member-details/memberDetailsHelpers';

/**
 * Profile of one member or one family. `member` is always fresh data from the parent
 * (useGymData re-derives it after every save), so nothing is cached locally.
 */
const MemberDetails = ({
  member,
  onBack,
  onUpdateMember,
  onDeleteMember,
  onRenewMember,
  onSetMemberClasses,
  scheduleTemplates = [],
  membershipPlans = []
}) => {
  const [editing, setEditing] = useState(null); // the member being edited
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState([]);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!member) return null;

  const run = async (action, failureMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      return true;
    } catch (err) {
      setError(`${failureMessage}: ${err?.message || 'Unknown error'}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleFreeze = (extendMonths = 0) =>
    run(async () => {
      if (member.isGroup) {
        await onUpdateMember({ ...member, isFrozen: true });
        return;
      }
      const expiryDate = extendMonths > 0 && member.expiryDate
        ? toDateKey(addMonths(member.expiryDate, extendMonths))
        : member.expiryDate;
      await onUpdateMember({ ...member, isFrozen: true, expiryDate });
    }, 'Could not freeze membership');

  const handleUnfreeze = () =>
    run(() => onUpdateMember({ ...member, isFrozen: false }), 'Could not unfreeze membership');

  const handleDeleteConfirm = (memberId) =>
    run(async () => {
      await onDeleteMember(memberId);
      setShowDeleteConfirmId(null);
    }, 'Could not delete member');

  const startEditing = (target) => {
    setEditing(target);
    setEditForm(memberToForm(target));
    setEditErrors([]);
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditForm(null);
    setEditErrors([]);
  };

  const handleSaveEdit = async () => {
    const errors = validateMemberForm(editForm, editing);
    if (errors.length > 0) {
      setEditErrors(errors);
      return;
    }
    setBusy(true);
    setEditErrors([]);
    try {
      await onUpdateMember(applyMemberForm(editing, editForm));
      cancelEditing();
      setNotice('Profile saved.');
    } catch (err) {
      setEditErrors([err?.message || 'Could not save changes.']);
    } finally {
      setBusy(false);
    }
  };

  const handleRenew = async (renewal) => {
    // Errors propagate to the modal, which shows them inline.
    await onRenewMember(member, renewal);
    setShowRenewModal(false);
    setNotice('Membership renewed.');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MemberHeader onBack={onBack} />

      {(error || notice) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`mb-6 rounded-xl border p-3 text-xs ${
            error ? 'border-rose-500/40 bg-rose-500/10 text-rose-500' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MemberProfileCard
          member={member}
          busy={busy}
          onRenew={() => setShowRenewModal(true)}
          onFreeze={handleFreeze}
          onUnfreeze={handleUnfreeze}
          showDeleteConfirmId={showDeleteConfirmId}
          setShowDeleteConfirmId={setShowDeleteConfirmId}
          handleDeleteConfirm={handleDeleteConfirm}
          startEditing={startEditing}
        />

        <div className="lg:col-span-2 space-y-6">
          {editing ? (
            <MemberEditForm
              editForm={editForm}
              setEditForm={setEditForm}
              planOptions={planOptionsFor(membershipPlans, editing.planId)}
              isChild={Boolean(editing.parentPhone || editing.familyId)}
              onCancel={cancelEditing}
              onSave={handleSaveEdit}
              saving={busy}
              errors={editErrors}
            />
          ) : member.isGroup ? (
            <FamilyGroupSection
              group={member}
              showDeleteConfirmId={showDeleteConfirmId}
              setShowDeleteConfirmId={setShowDeleteConfirmId}
              handleDeleteConfirm={handleDeleteConfirm}
              startEditing={startEditing}
              scheduleTemplates={scheduleTemplates}
              onSetMemberClasses={onSetMemberClasses}
            />
          ) : (
            <IndividualMemberInfo
              member={member}
              scheduleTemplates={scheduleTemplates}
              onSetMemberClasses={onSetMemberClasses}
            />
          )}
        </div>
      </div>

      {showRenewModal && (
        <MemberRenewModal
          member={member}
          membershipPlans={membershipPlans}
          onClose={() => setShowRenewModal(false)}
          onConfirm={handleRenew}
        />
      )}
    </div>
  );
};

export default MemberDetails;
