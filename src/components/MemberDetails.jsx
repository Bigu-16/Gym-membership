import { useState } from 'react';
import { useFeedback } from './common/Feedback';
import { freezeSummary } from '../utils/membership';
import MemberHeader from './member-details/MemberHeader';
import FreezePanel from './member-details/FreezePanel';
import ConfirmDelete from './member-details/ConfirmDelete';
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
  const [showFreezePanel, setShowFreezePanel] = useState(false);
  const [busy, setBusy] = useState(false);
  const { confirm } = useFeedback();
  const [error, setError] = useState('');

  if (!member) return null;

  const run = async (action, failureMessage) => {
    setBusy(true);
    setError('');
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

  // Freezing pauses the remaining days; the server gives them back when the freeze ends.
  const handleFreeze = async (until = null) => {
    const ok = await run(() => onUpdateMember({ ...member, isFrozen: true, freezeUntil: until || null }), 'Could not freeze membership');
    if (ok) setShowFreezePanel(false);
  };

  const handleUnfreeze = async () => {
    const ok = await confirm({
      title: `Unfreeze ${member.name} now?`,
      message: member.isGroup
        ? 'Every trainee in this family becomes active again; their paused days continue from today.'
        : `${freezeSummary(member)}. The paused days continue from today.`,
      confirmLabel: 'Unfreeze now'
    });
    if (ok) run(() => onUpdateMember({ ...member, isFrozen: false }), 'Could not unfreeze membership');
  };

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
  };

  return (
    <div>
      <MemberHeader
        member={member}
        busy={busy}
        editing={Boolean(editing)}
        onBack={onBack}
        onRenew={() => setShowRenewModal(true)}
        onFreeze={() => setShowFreezePanel((open) => !open)}
        onUnfreeze={handleUnfreeze}
        onEdit={() => startEditing(member)}
        onDelete={() => setShowDeleteConfirmId(member.id)}
      />

      {error && (
        <div role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-danger">{error}</div>
      )}

      {showFreezePanel && !member.isFrozen && (
        <FreezePanel member={member} busy={busy} onCancel={() => setShowFreezePanel(false)} onConfirm={handleFreeze} />
      )}

      {!member.isGroup && showDeleteConfirmId === member.id && (
        <div className="mb-6">
          <ConfirmDelete
            name={member.name}
            busy={busy}
            onCancel={() => setShowDeleteConfirmId(null)}
            onConfirm={() => handleDeleteConfirm(member.id)}
          />
        </div>
      )}

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
          busy={busy}
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
