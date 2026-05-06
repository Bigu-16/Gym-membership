export const GROUP_SCHEDULE_SLOTS = [
  { id: 1, className: 'Group Taekwondo', days: 'Mon, Wed, Fri', time: '4:00 PM - 5:00 PM', capacity: 15, enrolled: 12 },
  { id: 2, className: 'Group Taekwondo', days: 'Mon, Wed, Fri', time: '5:00 PM - 6:00 PM', capacity: 15, enrolled: 8 },
  { id: 3, className: 'Group Taekwondo', days: 'Tue, Thu, Sat', time: '4:00 PM - 5:00 PM', capacity: 12, enrolled: 10 },
  { id: 4, className: 'Group Taekwondo', days: 'Tue, Thu, Sat', time: '5:00 PM - 6:00 PM', capacity: 12, enrolled: 5 },
  { id: 5, className: 'Yoga Flow', days: 'Sat, Sun', time: '10:00 AM - 11:30 AM', capacity: 20, enrolled: 18 },
  { id: 6, className: 'Yoga Flow', days: 'Sat, Sun', time: '11:30 AM - 1:00 PM', capacity: 20, enrolled: 12 },
];

export const PERSONAL_DEFAULTS = {
  daysPerWeek: 3,
  duration: 1, // 1 hour
  minDays: 1,
  maxDays: 7,
  minDuration: 0.5, // 30 mins
  maxDuration: 4, // 4 hours
  minAge: 2,
};
