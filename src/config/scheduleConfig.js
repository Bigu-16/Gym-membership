export const ACTIVITIES = [
  'Taekwondo',
  'Kickboxing',
  'Karate',
  'Kung Fu',
  'Fitness'
];

export const PERSONAL_TRAINING_PROGRAMS = [
  'Personal Taekwondo Training',
  'Personal Karate Training',
  'Personal Kickboxing Training',
  'Personal Kung Fu Training',
  'Personal Adult Kickboxing',
  'Personal Fitness & Conditioning'
];

const THREE_MONTH_PERKS = {
  Taekwondo: 'Free uniform',
  Kickboxing: 'Free gloves',
  Karate: 'Free uniform'
};

export const PACKAGE_TEMPLATES = ACTIVITIES.flatMap((program) => {
  const slug = program.toLowerCase().replace(/\s+/g, '-');
  return [
    {
      id: `${slug}-1m-2x`,
      name: `${program} One Month - 2 Classes`,
      program,
      durationMonths: 1,
      classesPerWeek: 2,
      price: 300,
      currency: 'AED',
      includedItem: null
    },
    {
      id: `${slug}-1m-3x`,
      name: `${program} One Month - 3 Classes`,
      program,
      durationMonths: 1,
      classesPerWeek: 3,
      price: 350,
      currency: 'AED',
      includedItem: null
    },
    {
      id: `${slug}-3m-3x`,
      name: `${program} Three Month - 3 Classes`,
      program,
      durationMonths: 3,
      classesPerWeek: 3,
      price: 900,
      currency: 'AED',
      includedItem: THREE_MONTH_PERKS[program] || null
    }
  ];
});

export const membershipPlanToPackageTemplate = (plan) => ({
  id: plan.id,
  planId: plan.id,
  name: plan.name,
  program: plan.program,
  durationLabel: plan.duration_label ?? plan.durationLabel,
  durationMonths: plan.duration_months ?? plan.durationMonths,
  classesPerWeek: plan.classes_per_week ?? plan.classesPerWeek,
  price: Number(plan.price),
  currency: plan.currency || 'AED',
  includedItems: plan.included_items ?? plan.includedItems ?? [],
  includedItem: (plan.included_items ?? plan.includedItems ?? [])[0] || null,
  description: plan.description || '',
  isActive: plan.is_active ?? plan.isActive ?? true,
  sortOrder: plan.sort_order ?? plan.sortOrder ?? 0
});

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

export const PERSONAL_DEFAULTS = {
  daysPerWeek: 3,
  duration: 1, // 1 hour
  minDays: 1,
  maxDays: 7,
  minDuration: 0.5, // 30 mins
  maxDuration: 4, // 4 hours
  minAge: 2,
};
