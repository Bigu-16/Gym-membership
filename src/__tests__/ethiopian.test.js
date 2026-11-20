import { describe, expect, it } from 'vitest';
import { ethiopianHour, toEthiopian, dayPartAm } from '../lib/ethiopian';
import { isSummer, slotRunsOn, weekdayOf } from '../lib/dates';

describe('Ethiopian calendar', () => {
  it('converts known dates', () => {
    expect(toEthiopian(2026, 9, 11)).toEqual({ year: 2019, month: 1, day: 1 }); // Enkutatash 2019
    expect(toEthiopian(2023, 9, 12)).toEqual({ year: 2016, month: 1, day: 1 }); // new year after Pagume 6
    expect(toEthiopian(2026, 1, 7)).toEqual({ year: 2018, month: 4, day: 29 }); // Genna
    expect(toEthiopian(2026, 9, 10)).toEqual({ year: 2018, month: 13, day: 5 }); // Pagume 5
    expect(toEthiopian(2026, 11, 20)).toEqual({ year: 2019, month: 3, day: 11 });
  });
});

describe('Ethiopian clock', () => {
  it('maps the class hours', () => {
    expect([9, 10, 11, 14].map(ethiopianHour)).toEqual([3, 4, 5, 8]);
    expect(ethiopianHour(6)).toBe(12);
    expect(ethiopianHour(12)).toBe(6);
    expect(dayPartAm(9)).toBe('ጠዋት');
    expect(dayPartAm(14)).toBe('ከሰዓት');
  });
});

describe('seasons', () => {
  const club = { summer_start: '06-15', summer_end: '09-10', term_days: [5, 6], summer_days: [0, 1, 2, 3, 4, 5] };
  const morning = { is_active: true, weekdays: [0, 1, 2, 3, 4, 5, 6] };
  const afternoon = { is_active: true, weekdays: [0, 1, 2, 3, 4, 5] };

  it('knows summer from the school season', () => {
    expect(isSummer(club, '2027-07-05')).toBe(true);
    expect(isSummer(club, '2026-11-21')).toBe(false);
    expect(weekdayOf('2026-11-21')).toBe(5);
  });

  it('runs weekend classes in term and Monday-Saturday in summer', () => {
    expect(slotRunsOn(club, morning, '2026-11-21')).toBe(true); // Saturday
    expect(slotRunsOn(club, morning, '2026-11-23')).toBe(false); // Monday in term
    expect(slotRunsOn(club, afternoon, '2026-11-22')).toBe(false); // Sunday afternoon
    expect(slotRunsOn(club, morning, '2027-07-05')).toBe(true); // Monday in summer
    expect(slotRunsOn(club, morning, '2027-07-11')).toBe(false); // Sunday in summer
  });
});
