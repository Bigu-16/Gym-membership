// Static configuration that is not stored in the backend.
// Packages (membership plans) and the class timetable come from the API; the
// "Load official packages" / "Load official timetable" actions seed them there.

export const PERSONAL_TRAINING_PROGRAMS = [
  'Personal Taekwondo Training',
  'Personal Karate Training',
  'Personal Kickboxing Training',
  'Personal Kung Fu Training',
  'Personal Adult Kickboxing',
  'Personal Fitness & Conditioning'
];

// Official weekly timetable, used by Template Management to seed missing class slots.
// Enrollment counts are computed from real enrollments, never stored here.
export const GROUP_SCHEDULE_SLOTS = [
  { id: 1, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '4:00 PM - 5:00 PM', capacity: 15 },
  { id: 2, className: 'Kids Taekwondo', days: 'Mon, Wed', time: '5:00 PM - 6:00 PM', capacity: 15 },
  { id: 3, className: 'Kids Karate', days: 'Fri', time: '5:00 PM - 6:00 PM', capacity: 15 },
  { id: 4, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '6:00 PM - 7:00 PM', capacity: 15 },
  { id: 5, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '7:00 PM - 8:00 PM', capacity: 15 },
  { id: 6, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '8:00 PM - 9:00 PM', capacity: 15 },

  { id: 7, className: 'Little Kids Karate', days: 'Tue, Thu, Sat', time: '4:00 PM - 5:00 PM', capacity: 12 },
  { id: 8, className: 'Kids Karate', days: 'Tue, Thu, Sat', time: '5:00 PM - 6:00 PM', capacity: 15 },
  { id: 9, className: 'Kids Karate', days: 'Tue, Thu, Sat', time: '6:00 PM - 7:00 PM', capacity: 15 },
  { id: 10, className: 'Adult Kickboxing', days: 'Tue, Thu, Sat', time: '7:00 PM - 8:00 PM', capacity: 15 },
  { id: 11, className: 'Adult Karate', days: 'Tue, Thu, Sat', time: '8:00 PM - 9:00 PM', capacity: 15 }
];

// Opening hours (24h clock) — personal sessions default to inside these.
export const OPENING_HOURS = { open: '16:00', close: '21:00' };

export const PERSONAL_DEFAULTS = {
  startTime: OPENING_HOURS.open,
  duration: 1, // hours
  minDuration: 0.5,
  maxDuration: 3,
  weeks: 4,
  maxWeeks: 12,
  days: ['Mon', 'Wed'],
  minAge: 2
};

export const ADULT_AGE = 18;
export const MIN_MEMBER_AGE = 2;
