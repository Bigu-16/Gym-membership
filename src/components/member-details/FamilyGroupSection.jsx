import { formatDate, freezeSummary } from '../../utils/membership';
import ConfirmDelete from './ConfirmDelete';
import MemberClassesEditor from './MemberClassesEditor';
import MemberStatusBadge from './MemberStatusBadge';
import { relativeExpiry } from './memberDetailsHelpers';

const Fact = ({ label, children, className = '' }) => (
  <div className={className}>
    <dt className="label">{label}</dt>
    <dd className="text-sm text-[var(--text-primary)]">{children}</dd>
  </div>
);

const FamilyGroupSection = ({
  group,
  busy,
  showDeleteConfirmId,
  setShowDeleteConfirmId,
  handleDeleteConfirm,
  startEditing,
  scheduleTemplates,
  onSetMemberClasses
}) => {
  const trainees = group.trainees || [];

  return (
    <div className="space-y-6">
      <section aria-labelledby="parent-title" className="glass-card p-5">
        <h3 id="parent-title" className="section-title">Parent / guardian</h3>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Fact label="Name">{group.parentName || '—'}</Fact>
          <Fact label="Mobile">{group.parentPhone || '—'}</Fact>
          <Fact label="Email">{group.parentEmail || '—'}</Fact>
        </dl>
      </section>

      <section aria-labelledby="trainees-title" className="glass-card">
        <h3 id="trainees-title" className="section-title px-5 pt-5">Trainees ({trainees.length})</h3>
        <ul className="mt-2 divide-y divide-[var(--glass-border)]">
          {trainees.map((trainee) => (
            <li key={trainee.id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-[var(--text-primary)]">{trainee.name}</h4>
                  <MemberStatusBadge member={trainee} />
                </div>
                {showDeleteConfirmId !== trainee.id && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEditing(trainee)} aria-label={`Edit ${trainee.name}`} className="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button type="button" onClick={() => setShowDeleteConfirmId(trainee.id)} aria-label={`Delete ${trainee.name}`} className="btn-danger btn-sm">
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {showDeleteConfirmId === trainee.id && (
                <ConfirmDelete
                  name={trainee.name}
                  message="They are removed from this family. This cannot be undone."
                  busy={busy}
                  onCancel={() => setShowDeleteConfirmId(null)}
                  onConfirm={() => handleDeleteConfirm(trainee.id)}
                />
              )}

              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Fact label="Package">{trainee.plan || 'No package'}</Fact>
                <Fact label={trainee.isFrozen ? 'On hold' : 'Expiry'}>
                  {trainee.isFrozen ? freezeSummary(trainee) : formatDate(trainee.expiryDate)}
                  {!trainee.isFrozen && trainee.expiryDate && (
                    <span className="block text-xs text-[var(--text-secondary)]">{relativeExpiry(trainee.expiryDate)}</span>
                  )}
                </Fact>
                <Fact label="Age · gender">{trainee.age ?? '—'} · {trainee.gender || '—'}</Fact>
                <Fact label="Mobile">{trainee.phone || '—'}</Fact>
                <Fact label="Emirates ID"><span className="font-mono">{trainee.emiratesId || '—'}</span></Fact>
                <Fact label="Medical notes">
                  <span className={trainee.medicalIssues ? 'font-semibold text-danger' : ''}>{trainee.medicalIssues || 'None reported'}</span>
                </Fact>
              </dl>

              <MemberClassesEditor member={trainee} scheduleTemplates={scheduleTemplates} onSetMemberClasses={onSetMemberClasses} compact />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default FamilyGroupSection;
