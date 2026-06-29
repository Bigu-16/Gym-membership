export const ACTIVITIES = [
  'Taekwondo',
  'Karate',
  'Kickboxing',
  'Kung Fu',
  'Adult Karate',
  'Adult Kickboxing',
  'Zumba Fitness'
];

export const PRICING_MATRIX = {
  'Taekwondo': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Karate': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Kickboxing': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Kung Fu': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Adult Karate': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Adult Kickboxing': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Zumba Fitness': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 800 },
    '6 Months': { '2 classes/week': 1450, '3 classes/week': 1450 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  }
};

export const GROUP_SCHEDULE_SLOTS = [
  { id: 1, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '4:00 PM - 5:00 PM', capacity: 15, enrolled: 12 },
  { id: 2, className: 'Kids Taekwondo', days: 'Mon, Wed', time: '5:00 PM - 6:00 PM', capacity: 15, enrolled: 8 },
  { id: 3, className: 'Kids Karate', days: 'Fri', time: '5:00 PM - 6:00 PM', capacity: 15, enrolled: 4 },
  { id: 4, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '6:00 PM - 7:00 PM', capacity: 15, enrolled: 10 },
  { id: 5, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '7:00 PM - 8:00 PM', capacity: 15, enrolled: 9 },
  { id: 6, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '8:00 PM - 9:00 PM', capacity: 15, enrolled: 5 },
  
  { id: 7, className: 'Little Kids Karate', days: 'Tue, Thu, Sat', time: '4:00 PM - 5:00 PM', capacity: 12, enrolled: 9 },
  { id: 8, className: 'Kids Karate', days: 'Tue, Thu, Sat', time: '5:00 PM - 6:00 PM', capacity: 15, enrolled: 11 },
  { id: 9, className: 'Kids Karate', days: 'Tue, Thu, Sat', time: '6:00 PM - 7:00 PM', capacity: 15, enrolled: 7 },
  { id: 10, className: 'Adult Kickboxing', days: 'Tue, Thu, Sat', time: '7:00 PM - 8:00 PM', capacity: 15, enrolled: 6 },
  { id: 11, className: 'Adult Karate', days: 'Tue, Thu, Sat', time: '8:00 PM - 9:00 PM', capacity: 15, enrolled: 8 },
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

