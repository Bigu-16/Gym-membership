import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/*
 * App-wide feedback, so every action behaves the same way:
 *   notify.success / notify.error / notify.info  -> short messages in the corner
 *     (successes disappear by themselves, errors stay until dismissed)
 *   confirm({ title, message, confirmLabel, tone }) -> Promise<boolean> "Are you sure?" dialog
 *   <Spinner /> for buttons and areas that are loading
 */

const FeedbackContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, className: 'border-emerald-500/40 text-success' },
  error: { icon: AlertTriangle, className: 'border-rose-500/40 text-danger' },
  info: { icon: Info, className: 'border-sky-500/40 text-info' }
};

export const Spinner = ({ label, className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`} role={label ? 'status' : undefined}>
    <span aria-hidden="true" className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    {label && <span>{label}</span>}
  </span>
);

const ConfirmDialog = ({ request, onClose }) => {
  const confirmRef = useRef(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const danger = request.tone === 'danger';
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(false); }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="glass-card w-full max-w-sm p-6 space-y-4">
        <h2 id="confirm-title" className="section-title">{request.title}</h2>
        {request.message && <p id="confirm-message" className="text-sm text-[var(--text-secondary)]">{request.message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={() => onClose(false)}>
            {request.cancelLabel || 'Cancel'}
          </button>
          <button type="button" ref={confirmRef} className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => onClose(true)}>
            {request.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback((tone, text) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, tone, text }]);
    if (tone !== 'error') setTimeout(() => dismiss(id), 4500);
    return id;
  }, [dismiss]);

  const notify = useMemo(() => ({
    success: (text) => push('success', text),
    error: (text) => push('error', text),
    info: (text) => push('info', text)
  }), [push]);

  const confirm = useCallback((request) => new Promise((resolve) => {
    setConfirmRequest({ ...request, resolve });
  }), []);

  const closeConfirm = useCallback((answer) => {
    setConfirmRequest((current) => {
      current?.resolve(answer);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="fixed z-[90] bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const { icon: Icon, className } = TONES[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={`flex items-start gap-3 rounded-xl border bg-[var(--bg-secondary)] px-4 py-3 text-sm ${className}`}
            >
              <Icon size={18} aria-hidden="true" className="shrink-0 mt-0.5" />
              <span className="flex-grow text-[var(--text-primary)]">{toast.text}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => dismiss(toast.id)} className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      {confirmRequest && <ConfirmDialog request={confirmRequest} onClose={closeConfirm} />}
    </FeedbackContext.Provider>
  );
};

const silent = { notify: { success: () => {}, error: () => {}, info: () => {} }, confirm: async () => true };

/** Access notify/confirm. Outside the provider (e.g. isolated component tests) it is a no-op that always confirms. */
// eslint-disable-next-line react-refresh/only-export-components
export const useFeedback = () => useContext(FeedbackContext) || silent;
