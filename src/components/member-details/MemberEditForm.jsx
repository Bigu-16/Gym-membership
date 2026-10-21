import { planOptionLabel } from './memberDetailsHelpers';

const inputClass =
  'w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-[var(--text-primary)]';
const labelClass = 'block text-xs uppercase tracking-luxury text-[var(--text-secondary)] ml-1 mb-2';

const MemberEditForm = ({ editForm, setEditForm, planOptions = [], isChild, onCancel, onSave, saving, errors = [] }) => {
  const set = (field) => (event) => setEditForm({ ...editForm, [field]: event.target.value });

  return (
    <div className="glass-card p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
        <h4 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-bold">Edit Member Profile</h4>
        <button type="button" onClick={onCancel} className="text-xs uppercase tracking-luxury text-danger hover:text-danger font-bold">
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="edit-name" className={labelClass}>Full Name</label>
          <input id="edit-name" type="text" value={editForm.name} onChange={set('name')} className={inputClass} placeholder="Full name" />
        </div>

        <div>
          <label htmlFor="edit-phone" className={labelClass}>Mobile {isChild ? '(optional)' : ''}</label>
          <input id="edit-phone" type="tel" value={editForm.phone} onChange={set('phone')} className={inputClass} placeholder="Phone number" />
        </div>

        <div>
          <label htmlFor="edit-whatsapp" className={labelClass}>WhatsApp Number</label>
          <input id="edit-whatsapp" type="tel" value={editForm.whatsappNumber} onChange={set('whatsappNumber')} className={inputClass} placeholder="Same as mobile if blank" />
        </div>

        <div>
          <label htmlFor="edit-emirates" className={labelClass}>Emirates ID (optional)</label>
          <input id="edit-emirates" type="text" value={editForm.emiratesId} onChange={set('emiratesId')} className={`${inputClass} font-mono`} placeholder="784-YYYY-NNNNNNN-N" />
        </div>

        <div>
          <label htmlFor="edit-email" className={labelClass}>Email (optional)</label>
          <input id="edit-email" type="email" value={editForm.email} onChange={set('email')} className={inputClass} placeholder="name@example.com" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-gender" className={labelClass}>Gender</label>
            <select id="edit-gender" value={editForm.gender} onChange={set('gender')} className={inputClass}>
              {!editForm.gender && <option value="">—</option>}
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-age" className={labelClass}>Age</label>
            <input id="edit-age" type="number" min={2} max={100} value={editForm.age} onChange={set('age')} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="edit-plan" className={labelClass}>Package</label>
          <select id="edit-plan" value={editForm.planId} onChange={set('planId')} className={inputClass}>
            <option value="">No package</option>
            {planOptions.map((plan) => (
              <option key={plan.id} value={plan.id}>{planOptionLabel(plan)}</option>
            ))}
          </select>
          <p className="text-xs text-[var(--text-secondary)] mt-1 ml-1">
            Changing the package here does not record a payment — use Renew Membership for a paid renewal.
          </p>
        </div>

        <div>
          <label htmlFor="edit-expiry" className={labelClass}>Expiry Date</label>
          <input id="edit-expiry" type="date" value={editForm.expiryDate} onChange={set('expiryDate')} className={`${inputClass} cursor-pointer`} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="edit-medical" className={labelClass}>Medical Conditions</label>
          <textarea
            id="edit-medical"
            value={editForm.medicalIssues}
            onChange={set('medicalIssues')}
            className={`${inputClass} h-24 resize-none`}
            placeholder="Leave blank if none"
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
          <label htmlFor="messagingOptIn" className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] cursor-pointer select-none">
            Opt-in to SMS/WhatsApp messaging
          </label>
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-danger space-y-0.5">
          {errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      )}

      <div className="flex gap-4 pt-4 border-t border-[var(--glass-border)]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] text-xs uppercase tracking-luxury font-bold hover:bg-[var(--glass-border)] transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-luxury font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default MemberEditForm;
