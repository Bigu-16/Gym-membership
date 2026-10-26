export const inputClass =
  'w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors';

// Dropdowns use our own arrow, inset from the right edge (see .select-chevron in index.css),
// with room so the text never runs under it.
export const selectClass = `${inputClass} select-chevron pr-11`;

export const labelClass = 'label mb-1';
