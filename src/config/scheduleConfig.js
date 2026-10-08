export const ACTIVITIES = [
  'Little Kids Karate',
  'Kids Karate',
  'Kids Taekwondo',
  'Taekwondo',
  'Karate',
  'Kickboxing',
  'Kung Fu',
  'Adult Karate',
  'Adult Kickboxing',
  'Fitness',
  'Zumba Fitness'
];

export const PERSONAL_TRAINING_PROGRAMS = [
  'Personal Taekwondo Training',
  'Personal Karate Training',
  'Personal Kickboxing Training',
  'Personal Kung Fu Training',
  'Personal Adult Kickboxing',
  'Personal Fitness & Conditioning'
];

export const PACKAGE_PERKS = {
  'Taekwondo': { '3 Months': 'Free Uniform' },
  'Kids Taekwondo': { '3 Months': 'Free Uniform' },
  'Karate': { '3 Months': 'Free Uniform' },
  'Kids Karate': { '3 Months': 'Free Uniform' },
  'Little Kids Karate': { '3 Months': 'Free Uniform' },
  'Kickboxing': { '3 Months': 'Free Gloves' },
  'Adult Kickboxing': { '3 Months': 'Free Gloves' }
};

export const PRICING_MATRIX = {
  'Little Kids Karate': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Kids Karate': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
  'Kids Taekwondo': {
    '1 Month': { '2 classes/week': 300, '3 classes/week': 350 },
    '3 Months': { '2 classes/week': 800, '3 classes/week': 900 },
    '6 Months': { '2 classes/week': 1400, '3 classes/week': 1400 },
    '1 Year': { '2 classes/week': 2550, '3 classes/week': 2550 }
  },
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
  'Fitness': {
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
  
  { id: 7, className: 'Little Kids Karate', days: 'Tue, Thu, Sat', time: '4:00 PM - 5:00 PM', capacity: 12, enrolled: 1 },
  { id: 8, className: 'Kids Karate', days: 'Tue, Thu, Sat', time: '5:00 PM - 6:00 PM', capacity: 15, enrolled: 11 },
  { id: 9, className: 'Kids Karate', days: 'Tue, Thu, Sat', time: '6:00 PM - 7:00 PM', capacity: 15, enrolled: 7 },
  { id: 10, className: 'Adult Kickboxing', days: 'Tue, Thu, Sat', time: '7:00 PM - 8:00 PM', capacity: 15, enrolled: 6 },
  { id: 11, className: 'Adult Karate', days: 'Tue, Thu, Sat', time: '8:00 PM - 9:00 PM', capacity: 15, enrolled: 8 },
];

export const SCHEDULE_TIMETABLE_MATRIX = [
  {
    time: '4:00 PM - 5:00 PM',
    monday: 'Kids Taekwondo',
    tuesday: 'Little Kids Karate',
    wednesday: 'Kids Taekwondo',
    thursday: 'Little Kids Karate',
    friday: 'Kids Taekwondo',
    saturday: 'Little Kids Karate'
  },
  {
    time: '5:00 PM - 6:00 PM',
    monday: 'Kids Taekwondo',
    tuesday: 'Kids Karate',
    wednesday: 'Kids Taekwondo',
    thursday: 'Kids Karate',
    friday: 'Kids Karate',
    saturday: 'Kids Karate'
  },
  {
    time: '6:00 PM - 7:00 PM',
    monday: 'Kids Taekwondo',
    tuesday: 'Kids Karate',
    wednesday: 'Kids Taekwondo',
    thursday: 'Kids Karate',
    friday: 'Kids Taekwondo',
    saturday: 'Kids Karate'
  },
  {
    time: '7:00 PM - 8:00 PM',
    monday: 'Kids Taekwondo',
    tuesday: 'Adult Kickboxing',
    wednesday: 'Kids Taekwondo',
    thursday: 'Adult Kickboxing',
    friday: 'Kids Taekwondo',
    saturday: 'Adult Kickboxing'
  },
  {
    time: '8:00 PM - 9:00 PM',
    monday: 'Kids Taekwondo',
    tuesday: 'Adult Karate',
    wednesday: 'Kids Taekwondo',
    thursday: 'Adult Karate',
    friday: 'Kids Taekwondo',
    saturday: 'Adult Karate'
  }
];

export const DISCLAIMER_TEXT = `As per N & T TEAKWONDO&KARATE CENTER Management:
All the activity fees are non-refundable. The management does not accept any responsibility for any loss, theft or damage caused to valuables or personal belonging brought into the club. Lockers are provided for the convenience of the members for clothes and personal belongings. All persons entering the club do so at their own risk. The club does not accept any responsibility whatsoever for any injury, death of members/dependents, guests or damage to personal properties within the club premises.
I have read the rules and regulations attached to this document regarding the sports activity.`;

export const MOUZA_REGISTRATION_DATA = {
  parentInfo: {
    name: 'Safeya Almuharrami',
    phone: '0506199709',
    email: 'safeya.almuharrami@example.com'
  },
  trainees: [{
    name: 'Mouza Almuharrami',
    age: '3',
    gender: 'Female',
    emiratesId: '784-2023-1234567-1',
    medicalIssues: 'None',
    service: 'Little Kids Karate',
    frequency: '3 classes/week'
  }],
  schedule: {
    slot: 'Little Kids Karate: Tue, Thu, Sat @ 4:00 PM - 5:00 PM',
    daysPerWeek: 3,
    duration: 1,
    location: 'Main Dojo'
  },
  payment: {
    amount: '300',
    method: 'Cash',
    status: 'Paid',
    currency: 'AED',
    duration: '1 Month',
    durationValue: 1,
    durationUnit: 'Month'
  }
};

export const getSlotForCell = (day, time, activity) => {
  const dayLower = (day || '').toLowerCase();
  const timeNorm = (time || '').replace(/\s+/g, ' ');

  if (timeNorm.includes('4:00 PM')) {
    if (activity.toLowerCase().includes('little kids')) {
      return 'Little Kids Karate: Tue, Thu, Sat @ 4:00 PM - 5:00 PM';
    }
    return 'Kids Taekwondo: Mon, Wed, Fri @ 4:00 PM - 5:00 PM';
  }

  if (timeNorm.includes('5:00 PM')) {
    if (dayLower === 'friday') {
      return 'Kids Karate: Fri @ 5:00 PM - 6:00 PM';
    }
    if (dayLower === 'monday' || dayLower === 'wednesday') {
      return 'Kids Taekwondo: Mon, Wed @ 5:00 PM - 6:00 PM';
    }
    return 'Kids Karate: Tue, Thu, Sat @ 5:00 PM - 6:00 PM';
  }

  if (timeNorm.includes('6:00 PM')) {
    if (dayLower === 'monday' || dayLower === 'wednesday' || dayLower === 'friday') {
      return 'Kids Taekwondo: Mon, Wed, Fri @ 6:00 PM - 7:00 PM';
    }
    return 'Kids Karate: Tue, Thu, Sat @ 6:00 PM - 7:00 PM';
  }

  if (timeNorm.includes('7:00 PM')) {
    if (dayLower === 'monday' || dayLower === 'wednesday' || dayLower === 'friday') {
      return 'Kids Taekwondo: Mon, Wed, Fri @ 7:00 PM - 8:00 PM';
    }
    return 'Adult Kickboxing: Tue, Thu, Sat @ 7:00 PM - 8:00 PM';
  }

  if (timeNorm.includes('8:00 PM')) {
    if (dayLower === 'monday' || dayLower === 'wednesday' || dayLower === 'friday') {
      return 'Kids Taekwondo: Mon, Wed, Fri @ 8:00 PM - 9:00 PM';
    }
    return 'Adult Karate: Tue, Thu, Sat @ 8:00 PM - 9:00 PM';
  }

  return `${activity}: ${day} @ ${time}`;
};

export const isCellSelected = (cellDay, cellTime, cellActivity, selectedSlot) => {
  if (!selectedSlot) return false;
  const slotLower = selectedSlot.toLowerCase();
  const dayLower = (cellDay || '').toLowerCase();
  const timeLower = (cellTime || '').toLowerCase();

  const startTime = timeLower.split(' - ')[0].trim();
  if (!slotLower.includes(startTime)) {
    return false;
  }

  const dayShort = dayLower.substring(0, 3);
  if (!slotLower.includes(dayShort) && !slotLower.includes(dayLower)) {
    return false;
  }

  const actKey = (cellActivity || '').toLowerCase().replace(/kids\s+|adult\s+/g, '').trim();
  return slotLower.includes(actKey) || slotLower.includes((cellActivity || '').toLowerCase());
};

export const PERSONAL_DEFAULTS = {
  daysPerWeek: 3,
  duration: 1, // 1 hour
  minDays: 1,
  maxDays: 7,
  minDuration: 0.5, // 30 mins
  maxDuration: 4, // 4 hours
  minAge: 2,
};


