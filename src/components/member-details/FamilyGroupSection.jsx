import { formatDate, membershipStatus } from '../../utils/membership';
import MemberClassesEditor from './MemberClassesEditor';

const STATUS_TEXT = {
  frozen: 'Frozen',
  expired: 'Expired',
  expiring: 'Expiring soon',
  active: 'Active',
  'no-expiry': 'No expiry'
};

const FamilyGroupSection = ({
  group,
  showDeleteConfirmId,
  setShowDeleteConfirmId,
  handleDeleteConfirm,
  startEditing,
  scheduleTemplates,
  onSetMemberClasses
}) => (
  <>
    <div className="glass-card p-6">
      <h4 className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-4">Parent / Guardian</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Name</p>
          <p className="text-sm font-semibold">{group.parentName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Mobile</p>
          <p className="text-sm font-semibold">{group.parentPhone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Email</p>
          <p className="text-sm font-semibold">{group.parentEmail || 'N/A'}</p>
        </div>
      </div>
    </div>

    <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold pt-4">
      Enrolled Trainees ({group.trainees?.length || 0})
    </h3>
    {(group.trainees || []).map((trainee, index) => (
      <div key={trainee.id} className="glass-card p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h4 className="text-[12px] uppercase tracking-luxury text-[var(--text-primary)] font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-[10px]">{index + 1}</span>
            {trainee.name}
          </h4>
          {showDeleteConfirmId !== trainee.id && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEditing(trainee)}
                aria-label={`Edit ${trainee.name}`}
                className="px-3 py-1 rounded-lg border border-[var(--glass-border)] text-[8px] uppercase tracking-luxury font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmId(trainee.id)}
                aria-label={`Delete ${trainee.name}`}
                className="px-3 py-1 rounded-lg border border-rose-500/30 text-[8px] uppercase tracking-luxury font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {showDeleteConfirmId === trainee.id && (
          <div className="p-4 glass-card border border-rose-500/30 rounded-xl text-left">
            <h4 className="text-[10px] uppercase tracking-luxury font-bold text-rose-500 mb-2">Confirm Deletion</h4>
            <p className="text-[10px] text-[var(--text-secondary)] mb-4">
              Delete {trainee.name} from this family? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(trainee.id)}
                className="px-4 py-2 rounded-lg bg-rose-500 text-white text-[10px] uppercase tracking-luxury font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Package</p>
            <p className="text-sm font-semibold">{trainee.plan || 'No package'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Expiry</p>
            <p className="text-sm font-semibold">
              {formatDate(trainee.expiryDate)}{' '}
              <span className="text-[10px] text-[var(--text-secondary)] font-normal">({STATUS_TEXT[membershipStatus(trainee)]})</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Age / Gender</p>
            <p className="text-sm font-semibold">{trainee.age ?? '—'} · {trainee.gender || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Mobile</p>
            <p className="text-sm font-semibold">{trainee.phone || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Emirates ID</p>
            <p className="text-sm font-semibold font-mono">{trainee.emiratesId || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">Medical</p>
            <p className={`text-sm font-semibold ${trainee.medicalIssues ? 'text-rose-400' : ''}`}>{trainee.medicalIssues || 'None reported'}</p>
          </div>
        </div>

        <MemberClassesEditor
          member={trainee}
          scheduleTemplates={scheduleTemplates}
          onSetMemberClasses={onSetMemberClasses}
          compact
        />
      </div>
    ))}
  </>
);

export default FamilyGroupSection;
