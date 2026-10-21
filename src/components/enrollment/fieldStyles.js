export const inputClass =
  'w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all';

// Dropdowns use our own arrow, inset from the right edge (see .select-chevron in index.css),
// with room so the text never runs under it.
export const selectClass = `${inputClass} select-chevron pr-11`;

export const labelClass = 'block text-xs uppercase tracking-luxury text-[var(--text-secondary)] ml-1 mb-1.5';

export const sectionTitleClass = 'text-xs uppercase tracking-luxury font-bold';

export const toggleButtonClass = (active) =>
  `flex-1 py-2.5 px-3 text-xs uppercase tracking-luxury font-bold rounded-lg transition-all ${
    active ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5'
  }`;
