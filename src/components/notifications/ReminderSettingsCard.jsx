import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

const Check = ({ ok, children }) => (
  <li className="flex items-start gap-2 text-xs">
    <span aria-hidden="true" className={ok ? 'text-emerald-500' : 'text-amber-500'}>{ok ? '✓' : '!'}</span>
    <span>{children}</span>
  </li>
);

/** Status and controls for the automatic membership-expiry emails. */
const ReminderSettingsCard = ({ onSent }) => {
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;
    apiService.getReminderSettings()
      .then((data) => alive && setInfo(data))
      .catch((err) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  const sendNow = async () => {
    setBusy('send');
    setMessage(null);
    try {
      const result = await apiService.sendDueReminders();
      setMessage({
        ok: true,
        text: result.members_due
          ? `${result.emails_queued} reminder email(s) sent for ${result.members_due} member(s) due.${result.members_without_contact ? ` ${result.members_without_contact} had no email address.` : ''}`
          : 'Nobody is due for a reminder today.'
      });
      if (onSent) await onSent();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async (event) => {
    event.preventDefault();
    setBusy('test');
    setMessage(null);
    try {
      await apiService.sendTestEmail(testTo.trim());
      setMessage({ ok: true, text: `Test email sent to ${testTo.trim()}. Check the inbox (and spam folder).` });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const days = info?.reminder_days?.join(' and ') || '5 and 3';

  return (
    <section className="glass-card p-6 border border-[var(--glass-border)] space-y-5" aria-labelledby="reminders-heading">
      <div>
        <h2 id="reminders-heading" className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold">
          Automatic renewal reminders
        </h2>
        <p className="text-sm mt-2">
          Members (or the parent, for children) get an email <strong>{days} days</strong> before their membership ends,
          every morning at 9:00 AM. If a day is missed, the reminder goes out on the next run.
        </p>
      </div>

      {loadError ? (
        <p role="alert" className="text-xs text-rose-500">{loadError}</p>
      ) : info && (
        <ul className="space-y-1.5">
          <Check ok={info.email_configured}>
            {info.email_configured ? `Email is set up (sending from ${info.from_email}).` : 'Email is not set up on the server yet: SMTP settings are missing.'}
          </Check>
          <Check ok={info.scheduler_enabled}>
            {info.scheduler_enabled ? 'The daily 9 AM run is switched on.' : 'The daily run is not switched on yet (CRON_SECRET missing on the server).'}
          </Check>
          <Check ok={info.members_without_email === 0}>
            {info.members_without_email === 0
              ? 'Every member has an email address (their own or a parent\'s).'
              : `${info.members_without_email} member(s) have no email address and will not get reminders. Add one on their profile.`}
          </Check>
        </ul>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={sendNow}
          disabled={busy !== null}
          className="px-4 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50"
        >
          {busy === 'send' ? 'Sending…' : 'Send due reminders now'}
        </button>
        <form onSubmit={sendTest} className="flex gap-2 flex-grow">
          <input
            type="email"
            required
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="your@email.com"
            aria-label="Send a test email to"
            className="flex-grow bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="px-4 py-2 rounded-xl border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50"
          >
            {busy === 'test' ? 'Sending…' : 'Send test email'}
          </button>
        </form>
      </div>

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-xs rounded-xl p-3 ${message.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
          {message.text}
        </p>
      )}
    </section>
  );
};

export default ReminderSettingsCard;
