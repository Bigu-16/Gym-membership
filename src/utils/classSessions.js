// Shared class-session logic for the Dashboard and Schedule pages.
//
// The weekly timetable (schedule templates) defines when classes run. A class on a
// given day only becomes a recorded session once staff start/complete it or edit its
// checklist; until then it is "projected" from the timetable.

export const CLASS_LENGTH_MINUTES = 60;

// Staff build each class's checklist themselves; nothing is pre-filled.
export const DEFAULT_CHECKLIST = [];

export const STATUS_META = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  upcoming: { label: 'Scheduled', tone: 'neutral' },
  'in-progress': { label: 'In progress', tone: 'live' },
  completed: { label: 'Completed', tone: 'done' },
  cancelled: { label: 'Cancelled', tone: 'cancelled' },
  'not-recorded': { label: 'Not recorded', tone: 'warning' }
};

export const statusLabel = (status) => STATUS_META[status]?.label || status || '';

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

const pad = (value) => String(value).padStart(2, '0');

export const toDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const clockToString = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "16:00", "4:00 PM", "4 pm" -> { hours, minutes }, or null if unparseable. */
export const parseClock = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

const addMinutes = ({ hours, minutes }, delta) => {
  const total = hours * 60 + minutes + delta;
  return { hours: Math.floor(total / 60) % 24, minutes: total % 60 };
};

/** "16:00 - 17:00" or "16:00" (assumes a one-hour class) -> { start, end } clocks. */
export const parseTimeRange = (value) => {
  const [startText, endText] = String(value || '').split(/\s+-\s+|\s*–\s*/);
  const start = parseClock(startText) || { hours: 16, minutes: 0 };
  const end = parseClock(endText) || addMinutes(start, CLASS_LENGTH_MINUTES);
  return { start, end };
};

export const formatClock = ({ hours, minutes }) => {
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${pad(minutes)} ${suffix}`;
};

/** Display form of a class time, e.g. "4:00 PM – 5:00 PM". */
export const formatTimeRange = (value) => {
  const { start, end } = parseTimeRange(value);
  return `${formatClock(start)} – ${formatClock(end)}`;
};

export const templateDays = (template) => {
  const raw = Array.isArray(template?.days) ? template.days : String(template?.days || '').split(',');
  return raw.map((day) => day.trim()).filter(Boolean);
};

export const templateRunsOn = (template, date) =>
  templateDays(template).some((day) => DAY_INDEX[day.slice(0, 3).toLowerCase()] === date.getDay());

const atClock = (date, clock) => {
  const d = new Date(date);
  d.setHours(clock.hours, clock.minutes, 0, 0);
  return d;
};

export const projectedSessionId = (templateId, date) => `template-${templateId}-${toDateKey(date)}`;

export const isProjectedId = (id) => typeof id === 'string' && id.startsWith('template-');

const projectTemplate = (template, date, now) => {
  const { start: startClock, end: endClock } = parseTimeRange(template.time);
  const start = atClock(date, startClock);
  const end = atClock(date, endClock);
  return {
    id: projectedSessionId(template.id, date),
    templateId: template.id,
    dateKey: toDateKey(date),
    title: template.className || template.title || 'Class',
    trainer: template.trainer || null,
    start,
    end,
    // Not started by anyone yet: "scheduled" until it ends, then "not recorded".
    status: now > end ? 'not-recorded' : 'scheduled',
    isLive: now >= start && now <= end,
    type: template.type || 'group',
    capacity: template.capacity ?? null,
    enrolled: template.enrolled ?? 0,
    checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
    isProjected: true
  };
};

/**
 * All classes on `date`: recorded sessions plus timetable classes that have not been
 * recorded yet. A recorded session replaces its class slot only for that exact
 * template and day, so other classes with the same name are never hidden.
 */
export const sessionsForDate = (date, { sessions = [], templates = [], now = new Date() } = {}) => {
  const key = toDateKey(date);
  const templatesById = new Map(templates.map((t) => [t.id, t]));
  const recorded = sessions
    .filter((s) => (s.dateKey || toDateKey(s.start)) === key)
    .map((s) => {
      const template = templatesById.get(s.templateId);
      return {
        ...s,
        trainer: s.trainer || template?.trainer || null,
        capacity: s.capacity ?? template?.capacity ?? null,
        enrolled: template?.enrolled ?? s.enrolled ?? 0,
        isLive: now >= s.start && now <= s.end
      };
    });
  const recordedTemplateIds = new Set(recorded.map((s) => s.templateId).filter((id) => id !== null && id !== undefined));

  const projected = templates
    .filter((t) => templateRunsOn(t, date) && !recordedTemplateIds.has(t.id))
    .map((t) => projectTemplate(t, date, now));

  return [...recorded, ...projected].sort((a, b) => a.start - b.start || String(a.title).localeCompare(b.title));
};

/** Actions staff can take on a class, in display order. */
export const sessionActions = (session) => {
  switch (session.status) {
    case 'in-progress':
      return [
        { label: 'Mark completed', status: 'completed', primary: true },
        { label: 'Back to scheduled', status: 'upcoming' }
      ];
    case 'completed':
    case 'cancelled':
      return [{ label: 'Reopen', status: 'upcoming' }];
    case 'not-recorded':
      return [
        { label: 'Mark completed', status: 'completed', primary: true },
        { label: 'Mark cancelled', status: 'cancelled' }
      ];
    default:
      return [
        { label: 'Start class', status: 'in-progress', primary: true },
        { label: 'Cancel class', status: 'cancelled' }
      ];
  }
};

/** Members enrolled in this class slot (via real class enrollments). */
export const traineesForSession = (session, members = []) => {
  if (session?.templateId === null || session?.templateId === undefined) return [];
  return members.filter((m) => (m.enrolledTemplateIds || []).includes(session.templateId));
};

// The calendar always shows a full working day so any time can be seen and planned.
export const DAY_START_HOUR = 8; // 8 AM
export const DAY_END_HOUR = 21; // last row starts 9 PM (ends 10 PM)

/** Hour rows for calendar grids (one row per hour): 8 AM–10 PM, widened for anything outside it. */
export const timetableHours = (templates = [], sessions = []) => {
  let first = DAY_START_HOUR;
  let last = DAY_END_HOUR;
  templates.forEach((t) => {
    const { start, end } = parseTimeRange(t.time);
    first = Math.min(first, start.hours);
    last = Math.max(last, end.minutes > 0 ? end.hours : end.hours - 1);
  });
  sessions.forEach((s) => {
    first = Math.min(first, s.start.getHours());
    last = Math.max(last, s.end.getMinutes() > 0 ? s.end.getHours() : s.end.getHours() - 1);
  });
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
};

export const formatHourLabel = (hour) => `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
