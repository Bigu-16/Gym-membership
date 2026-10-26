import { useState } from 'react';
import { X } from 'lucide-react';
import { apiService } from '../../services/api';
import { useFeedback } from '../common/Feedback';
import { passwordProblem } from '../../utils/passwords';

const fieldClass = 'w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20';

const AccountModal = ({ currentUser, onClose, onSignedOut }) => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const changePassword = async (event) => {
    event.preventDefault();
    const problem = passwordProblem(form.next) || (form.next !== form.confirm ? 'The new passwords do not match.' : null);
    if (problem) {
      setMessage({ tone: 'error', text: problem });
      return;
    }
    setBusy(true);
    try {
      await apiService.changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setMessage({ tone: 'success', text: 'Password changed. Any other device using this account has been signed out.' });
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const { confirm } = useFeedback();

  const signOutEverywhere = async () => {
    const ok = await confirm({
      title: 'Sign out on all devices?',
      message: 'Every computer and phone using this account is signed out, including this one. You will need to sign in again.',
      confirmLabel: 'Sign out everywhere',
      tone: 'danger'
    });
    if (!ok) return;
    setBusy(true);
    try {
      await apiService.logoutEverywhere();
      onSignedOut();
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-label="Account">
      <div className="glass-card w-full max-w-md p-6 border border-[var(--glass-border)] bg-[var(--bg-secondary)] space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-sm font-bold">Account</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{currentUser?.full_name} · {currentUser?.email} ({currentUser?.role})</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-[var(--glass-border)]"><X size={16} /></button>
        </div>

        <form onSubmit={changePassword} className="space-y-3">
          <h3 className="text-xs text-[var(--text-secondary)] font-bold">Change password</h3>
          <input type="password" autoComplete="current-password" aria-label="Current password" placeholder="Current password" value={form.current} onChange={update('current')} className={fieldClass} required />
          <input type="password" autoComplete="new-password" aria-label="New password" placeholder="New password" value={form.next} onChange={update('next')} className={fieldClass} required />
          <input type="password" autoComplete="new-password" aria-label="Confirm new password" placeholder="Confirm new password" value={form.confirm} onChange={update('confirm')} className={fieldClass} required />
          <p className="text-xs text-[var(--text-secondary)]">At least 10 characters, with upper- and lower-case letters and a number.</p>
          <button type="submit" disabled={busy} className="w-full py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold disabled:opacity-50">
            Change password
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--glass-border)] space-y-2">
          <p className="text-xs text-[var(--text-secondary)]">Left this account signed in on another computer? Sign it out everywhere, including here.</p>
          <button type="button" disabled={busy} onClick={signOutEverywhere} className="w-full py-3 rounded-xl border border-rose-500/30 text-danger text-xs font-bold disabled:opacity-50">
            Sign out on all devices
          </button>
        </div>

        {message && (
          <p role={message.tone === 'error' ? 'alert' : 'status'} className={`text-xs rounded-xl p-3 ${message.tone === 'error' ? 'bg-rose-500/10 text-danger' : 'bg-emerald-500/10 text-success'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default AccountModal;
