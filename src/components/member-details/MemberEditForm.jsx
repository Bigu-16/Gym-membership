import { fieldClass, planOptionLabel } from './memberDetailsHelpers';

const Field = ({ id, label, hint, className = '', children }) => (
  <div className={className}>
    <label htmlFor={id} className="label mb-1">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>}
  </div>
);

const MemberEditForm = ({ editForm, setEditForm, planOptions = [], isChild, onCancel, onSave, saving, errors = [] }) => {
  const set = (field) => (event) => setEditForm({ ...editForm, [field]: event.target.value });

  return (
    <section aria-labelledby="edit-title" className="glass-card p-5">
      <h3 id="edit-title" className="section-title">Edit profile</h3>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="edit-name" label="Full name">
          <input id="edit-name" type="text" value={editForm.name} onChange={set('name')} className={fieldClass} placeholder="Full name" />
        </Field>

        <Field id="edit-phone" label={isChild ? 'Mobile (optional)' : 'Mobile'}>
          <input id="edit-phone" type="tel" value={editForm.phone} onChange={set('phone')} className={fieldClass} placeholder="Phone number" />
        </Field>

        <Field id="edit-whatsapp" label="WhatsApp number">
          <input id="edit-whatsapp" type="tel" value={editForm.whatsappNumber} onChange={set('whatsappNumber')} className={fieldClass} placeholder="Same as mobile if blank" />
        </Field>

        <Field id="edit-emirates" label="Emirates ID (optional)">
          <input id="edit-emirates" type="text" value={editForm.emiratesId} onChange={set('emiratesId')} className={`${fieldClass} font-mono`} placeholder="784-YYYY-NNNNNNN-N" />
        </Field>

        <Field id="edit-email" label="Email (optional)">
          <input id="edit-email" type="email" value={editForm.email} onChange={set('email')} className={fieldClass} placeholder="name@example.com" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="edit-gender" label="Gender">
            <select id="edit-gender" value={editForm.gender} onChange={set('gender')} className={`${fieldClass} select-chevron pr-10`}>
              {!editForm.gender && <option value="">—</option>}
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
          <Field id="edit-age" label="Age">
            <input id="edit-age" type="number" min={2} max={100} value={editForm.age} onChange={set('age')} className={fieldClass} />
          </Field>
        </div>

        <Field id="edit-plan" label="Package" hint="Changing the package here does not record a payment. Use Renew for a paid renewal.">
          <select id="edit-plan" value={editForm.planId} onChange={set('planId')} className={`${fieldClass} select-chevron pr-10`}>
            <option value="">No package</option>
            {planOptions.map((plan) => (
              <option key={plan.id} value={plan.id}>{planOptionLabel(plan)}</option>
            ))}
          </select>
        </Field>

        <Field id="edit-expiry" label="Expiry date">
          <input id="edit-expiry" type="date" value={editForm.expiryDate} onChange={set('expiryDate')} className={fieldClass} />
        </Field>

        <Field id="edit-medical" label="Medical notes" className="md:col-span-2">
          <textarea
            id="edit-medical"
            value={editForm.medicalIssues}
            onChange={set('medicalIssues')}
            className={`${fieldClass} h-24 resize-none`}
            placeholder="Leave blank if none"
          />
        </Field>

        <div className="flex items-center gap-3 md:col-span-2">
          <input
            type="checkbox"
            id="messagingOptIn"
            checked={editForm.messagingOptIn}
            onChange={(e) => setEditForm({ ...editForm, messagingOptIn: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-[var(--text-primary)]"
          />
          <label htmlFor="messagingOptIn" className="cursor-pointer text-sm text-[var(--text-primary)]">
            Send SMS / WhatsApp messages
          </label>
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mt-4 space-y-0.5 rounded-xl bg-rose-500/10 p-3 text-sm text-danger">
          {errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2 border-t border-[var(--glass-border)] pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="button" onClick={onSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
};

export default MemberEditForm;
