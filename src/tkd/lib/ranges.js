import { addDays, startOfMonthKey, todayKey } from './dates';

const lastMonth = () => {
  const start = startOfMonthKey();
  const end = addDays(start, -1);
  return { start: startOfMonthKey(end), end };
};

export const PRESETS = {
  last4w: () => ({ start: addDays(todayKey(), -27), end: todayKey() }),
  thisMonth: () => ({ start: startOfMonthKey(), end: todayKey() }),
  lastMonth,
  last3m: () => ({ start: addDays(todayKey(), -89), end: todayKey() }),
};
