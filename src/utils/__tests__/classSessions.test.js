import { describe, expect, it } from 'vitest';
import {
  formatTimeRange,
  parseTimeRange,
  sessionActions,
  sessionsForDate,
  timetableHours,
  traineesForSession
} from '../classSessions';
import { addMonths, daysUntil, membershipStatus, periodProgress } from '../membership';

const wednesday = new Date(2026, 9, 14); // Wed 14 Oct 2026
const kidsTkd = (id, time) => ({ id, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time, capacity: 15, type: 'group' });
const templates = [kidsTkd(1, '16:00 - 17:00'), kidsTkd(2, '17:00 - 18:00'), kidsTkd(3, '18:00 - 19:00'),
  { id: 9, className: 'Adult Karate', days: 'Tue, Thu, Sat', time: '20:00 - 21:00', capacity: 15 }];

const at = (hours, minutes = 0) => {
  const d = new Date(wednesday);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

describe('class time parsing', () => {
  it('treats a bare start time as a one-hour class and carries minutes over the hour', () => {
    expect(parseTimeRange('16:45')).toEqual({ start: { hours: 16, minutes: 45 }, end: { hours: 17, minutes: 45 } });
    expect(parseTimeRange('4:00 PM - 5:00 PM')).toEqual({ start: { hours: 16, minutes: 0 }, end: { hours: 17, minutes: 0 } });
    expect(formatTimeRange('12:00')).toBe('12:00 PM – 1:00 PM');
  });

  it('sizes the calendar to the timetable', () => {
    expect(timetableHours(templates)).toEqual([15, 16, 17, 18, 19, 20]);
  });
});

describe('sessionsForDate', () => {
  it('projects only the classes that run that weekday', () => {
    const list = sessionsForDate(wednesday, { templates, now: at(12) });
    expect(list.map((s) => s.templateId)).toEqual([1, 2, 3]);
    expect(list[0].id).toBe('template-1-2026-10-14');
    expect(list.every((s) => s.status === 'scheduled')).toBe(true);
  });

  it('a recorded session replaces only its own class slot, never other same-named classes', () => {
    const recorded = {
      id: 77, templateId: 1, dateKey: '2026-10-14', title: 'Kids Taekwondo',
      start: at(16), end: at(17), status: 'in-progress', checklist: []
    };
    const list = sessionsForDate(wednesday, { sessions: [recorded], templates, now: at(16, 30) });
    expect(list.map((s) => s.id)).toEqual([77, 'template-2-2026-10-14', 'template-3-2026-10-14']);
  });

  it('marks finished, unrecorded classes as not recorded instead of completed', () => {
    const list = sessionsForDate(wednesday, { templates, now: at(17, 30) });
    expect(list.map((s) => s.status)).toEqual(['not-recorded', 'scheduled', 'scheduled']);
    expect(list[1].isLive).toBe(true);
  });

  it('lists trainees by real class enrollment', () => {
    const members = [
      { id: 1, name: 'A', enrolledTemplateIds: [2] },
      { id: 2, name: 'B', enrolledTemplateIds: [1] }
    ];
    const [, second] = sessionsForDate(wednesday, { templates, now: at(12) });
    expect(traineesForSession(second, members).map((m) => m.name)).toEqual(['A']);
  });

  it('offers completion or cancellation for classes that ended without a record', () => {
    expect(sessionActions({ status: 'not-recorded' }).map((a) => a.status)).toEqual(['completed', 'cancelled']);
    expect(sessionActions({ status: 'scheduled' })[0].status).toBe('in-progress');
  });
});

describe('membership timing', () => {
  const today = new Date(2026, 9, 14);

  it('has a single days-remaining definition', () => {
    expect(daysUntil('2026-10-14', today)).toBe(0);
    expect(daysUntil('2026-10-13', today)).toBe(-1);
    expect(daysUntil(null, today)).toBeNull();
    expect(membershipStatus({ expiryDate: '2026-10-20' }, today)).toBe('expiring');
    expect(membershipStatus({ expiryDate: '2026-10-13' }, today)).toBe('expired');
    expect(membershipStatus({ expiryDate: '2026-10-13', isFrozen: true }, today)).toBe('frozen');
  });

  it('measures progress against the package length, not a fixed 30 days', () => {
    expect(periodProgress({ expiryDate: '2026-12-13' }, { duration_days: 90 }, today)).toBe(67);
  });

  it('adds calendar months without overflowing short months', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
  });
});
