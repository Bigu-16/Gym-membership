// One definition of membership timing used by every screen (cards, details, filters).

const startOfLocalDay = (value) => {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year, month, day] = String(value).split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Whole days from today until the expiry date (0 = expires today, negative = expired). */
export const daysUntil = (expiryDate, today = new Date()) => {
  if (!expiryDate) return null;
  const diff = startOfLocalDay(expiryDate) - startOfLocalDay(today);
  return Math.round(diff / 86400000);
};

export const EXPIRING_SOON_DAYS = 7;

/** 'frozen' | 'expired' | 'expiring' | 'active' | 'no-expiry' */
export const membershipStatus = (member, today = new Date()) => {
  if (member?.isFrozen) return 'frozen';
  const days = daysUntil(member?.expiryDate, today);
  if (days === null) return 'no-expiry';
  if (days < 0) return 'expired';
  if (days <= EXPIRING_SOON_DAYS) return 'expiring';
  return 'active';
};

export const needsRenewalAttention = (member, today = new Date()) => {
  const status = membershipStatus(member, today);
  return status === 'expired' || status === 'expiring';
};

/** Progress through the current period, using the package's length (not a fixed 30 days). */
export const periodProgress = (member, plan, today = new Date()) => {
  const days = daysUntil(member?.expiryDate, today);
  if (days === null) return 0;
  const totalDays = plan?.duration_days || (plan?.duration_months ? plan.duration_months * 30 : 30);
  const remaining = Math.max(0, Math.min(totalDays, days));
  return Math.round((remaining / totalDays) * 100);
};

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '—';
  return startOfLocalDay(value).toLocaleDateString('en-GB', options);
};

/** Calendar-month addition that clamps to month end (Jan 31 + 1 month = Feb 28/29). */
export const addMonths = (date, months) => {
  const base = startOfLocalDay(date);
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(base.getDate(), lastDay));
  return target;
};

export const formatMoney = (amount, currency = 'AED') => {
  const value = Number(amount || 0);
  return `${value.toLocaleString('en-US', { maximumFractionDigits: value % 1 ? 2 : 0 })} ${currency}`;
};
