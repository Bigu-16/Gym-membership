// Dates travel as "YYYY-MM-DD" strings. Never build them through UTC, or a day can shift.

export const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (key) => {
  const [y, m, d] = String(key).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => toKey(new Date());

export const addDays = (key, days) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
};

export const startOfMonthKey = (key = todayKey()) => `${key.slice(0, 7)}-01`;

/** Python-style weekday (Monday = 0 ... Sunday = 6). */
export const weekdayOf = (key) => (parseKey(key).getDay() + 6) % 7;

export const parseTime = (value) => {
  const [h, m] = String(value).split(':').map(Number);
  return { h, m: m || 0 };
};

/** Mirrors the server's season rule: summer from summer_start to summer_end ("MM-DD"), inclusive. */
export const isSummer = (club, key) => {
  const md = key.slice(5, 10);
  const { summer_start: start, summer_end: end } = club;
  return start <= end ? md >= start && md <= end : md >= start || md <= end;
};

export const slotRunsOn = (club, slot, key) => {
  const wd = weekdayOf(key);
  const seasonDays = isSummer(club, key) ? club.summer_days : club.term_days;
  return slot.is_active && seasonDays.includes(wd) && slot.weekdays.includes(wd);
};
