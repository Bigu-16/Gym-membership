import { useState } from 'react';
import { Check, X } from 'lucide-react';

/** Trainer checklist for one class; every change is saved through `actions`. */
const SessionChecklist = ({ session, actions, disabled = false, compact = false }) => {
  const [draft, setDraft] = useState('');
  const [confirmIndex, setConfirmIndex] = useState(null);
  const checklist = session.checklist || [];
  const done = checklist.filter((item) => item.checked).length;

  const submit = async (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const saved = await actions.addItem(session, draft);
    if (saved) setDraft('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-[var(--text-secondary)] font-bold">Class checklist</span>
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{done}/{checklist.length} done</span>
      </div>

      {checklist.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)] italic mb-3">No checklist items. Add one below.</p>
      ) : (
        <ul className={`grid gap-2 mb-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {checklist.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs ${
 item.checked ? 'border-emerald-500/20 bg-[var(--card-hover)]' : 'border-[var(--glass-border)]'
 }`}
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-grow select-none">
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled={disabled}
                  onChange={() => actions.toggleItem(session, index)}
                  className="w-4 h-4 accent-[var(--text-primary)] cursor-pointer"
                />
                <span className={item.checked ? 'line-through text-[var(--text-secondary)]' : ''}>{item.text}</span>
              </label>
              {confirmIndex === index ? (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Confirm removing ${item.text}`}
                    onClick={() => { setConfirmIndex(null); actions.removeItem(session, index); }}
                    className="p-1 rounded-md text-danger hover:bg-rose-500/10"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Keep item"
                    onClick={() => setConfirmIndex(null)}
                    className="p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
                  >
                    <X size={13} />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  title="Remove item"
                  aria-label={`Remove ${item.text}`}
                  disabled={disabled}
                  onClick={() => setConfirmIndex(index)}
                  className="p-1 rounded-md text-[var(--text-secondary)] hover:text-danger"
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add checklist item…"
          aria-label="New checklist item"
          className="flex-grow bg-[var(--card-hover)] border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          className="px-3 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
};

export default SessionChecklist;
