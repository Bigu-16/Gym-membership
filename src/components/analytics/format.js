const LOCALE = 'en-US';

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString(LOCALE, { maximumFractionDigits: 0 });

export const formatMoney = (value, currency = 'AED') =>
  `${Number(value || 0).toLocaleString(LOCALE, { maximumFractionDigits: 2 })} ${currency}`;

export const formatMonth = (month, withYear = false) => {
  const [y, m] = String(month).split('-').map(Number);
  if (!y || !m) return String(month);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', {
    month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
  });
};

export const formatDay = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

export const formatHour = (hour) => {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${hour < 12 ? 'AM' : 'PM'}`;
};

const formatClock = (hhmm) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(hhmm).trim());
  if (!match) return String(hhmm).trim();
  const h = Number(match[1]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${match[2]} ${h < 12 ? 'AM' : 'PM'}`;
};

// "16:00 - 17:00" -> "4:00 PM – 5:00 PM"
export const formatTimeRange = (range) => {
  if (!range) return '—';
  return String(range).split(/\s*[-–]\s*/).filter(Boolean).map(formatClock).join(' – ');
};

export const abbreviateDays = (days = []) =>
  (Array.isArray(days) ? days : String(days).split(','))
    .map((d) => String(d).trim().slice(0, 3))
    .filter(Boolean)
    .join(', ');

export const sumValues = (items = []) => items.reduce((acc, item) => acc + Number(item.value || 0), 0);
