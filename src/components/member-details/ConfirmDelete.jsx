/** Inline "are you sure" box used before deleting a member or a family trainee. */
const ConfirmDelete = ({ name, message, busy, onCancel, onConfirm }) => (
  <div role="alertdialog" aria-label={`Delete ${name}`} className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
    <p className="text-sm font-semibold text-danger">Delete {name}?</p>
    <p className="mt-1 text-xs text-[var(--text-secondary)]">{message || 'This cannot be undone.'}</p>
    <div className="mt-3 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="btn-secondary btn-sm">Cancel</button>
      <button type="button" disabled={busy} onClick={onConfirm} className="btn-danger btn-sm">Yes, delete</button>
    </div>
  </div>
);

export default ConfirmDelete;
