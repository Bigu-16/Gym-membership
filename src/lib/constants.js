export const METHODS = ['cash', 'telebirr', 'cbe', 'boa'];

/** Left border colour on rows, so expiry stands out even when scanning quickly. */
export const STATUS_ROW = {
  active: '',
  expiring: 'border-l-4 border-l-warn-strong',
  critical: 'border-l-4 border-l-crit-strong',
  expired: 'border-l-4 border-l-crit-strong',
  unpaid: 'border-l-4 border-l-crit-strong',
  inactive: '',
};
