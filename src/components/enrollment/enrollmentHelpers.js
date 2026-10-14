import { ADULT_AGE, MIN_MEMBER_AGE, OPENING_HOURS, PERSONAL_DEFAULTS } from '../../config/scheduleConfig';
import { parseClock } from '../../utils/classSessions';

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' }
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export const EMIRATES_ID_PATTERN = /^784-?\d{4}-?\d{7}-?\d$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{5,28}$/;
// Letters from any script, spaces, hyphens, apostrophes and periods (matches the backend).
const NAME_PATTERN = /^\p{L}[\p{L}\s\-'.]*$/u;

// ----- Packages ---------------------------------------------------------------

export const planPrice = (plan) => (plan ? Number(plan.price) || 0 : 0);

/** Active backend packages in display order. */
export const activePlans = (plans = []) =>
  plans
    .filter((plan) => plan && plan.is_active !== false)
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);

export const planDurationLabel = (plan) => {
  if (!plan) return '';
  if (plan.duration_label) return plan.duration_label;
  const months = plan.duration_months;
  if (months) return months === 12 ? '1 year' : `${months} ${months === 1 ? 'month' : 'months'}`;
  if (plan.duration_days) return `${plan.duration_days} days`;
  return '';
};

export const planSummary = (plan) => {
  if (!plan) return '';
  const parts = [plan.program, planDurationLabel(plan)];
  if (plan.classes_per_week) parts.push(`${plan.classes_per_week}x/week`);
  return parts.filter(Boolean).join(' · ');
};

export const groupPlansByProgram = (plans = []) => {
  const groups = new Map();
  plans.forEach((plan) => {
    const program = plan.program || 'Other';
    if (!groups.has(program)) groups.set(program, []);
    groups.get(program).push(plan);
  });
  return [...groups.entries()];
};

// ----- Class slots ------------------------------------------------------------

const isLittleKidsClass = (template) => /little\s*kids/i.test(template.className || '');

/**
 * Class slots that fit a package's program and the trainee's age, e.g. a Karate
 * package suggests classes with "Karate" in the title; children aged 6 or under
 * go to Little Kids Karate.
 */
export const suggestedTemplates = (templates = [], plan, age) => {
  if (!plan?.program) return templates;
  const program = plan.program.toLowerCase();
  const years = age === '' || age === null || age === undefined ? null : Number(age);
  const matching = templates.filter((template) => (template.className || '').toLowerCase().includes(program));
  const hasLittleKids = matching.some(isLittleKidsClass);
  return matching.filter((template) => {
    const title = (template.className || '').toLowerCase();
    if (years === null || Number.isNaN(years)) return true;
    if (isLittleKidsClass(template)) return years <= 6;
    if (years <= 6 && hasLittleKids) return false;
    if (years >= ADULT_AGE && /\bkids?\b/.test(title)) return false;
    if (years < 13 && /\badults?\b/.test(title)) return false;
    return true;
  });
};

export const isTemplateFull = (template) =>
  template.capacity !== null && template.capacity !== undefined && (template.enrolled ?? 0) >= template.capacity;

export const groupTemplatesByClass = (templates = []) => {
  const groups = new Map();
  templates.forEach((template) => {
    const name = template.className || 'Class';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(template);
  });
  return [...groups.entries()];
};

// ----- Personal sessions -------------------------------------------------------

const clockMinutes = (value) => {
  const clock = parseClock(value);
  return clock ? clock.hours * 60 + clock.minutes : null;
};

/**
 * Concrete personal-training sessions: every selected weekday, for `weeks` weeks,
 * starting on `startDate` ('YYYY-MM-DD'), at `startTime` for `duration` hours.
 */
export const buildPersonalSessions = ({ startDate, startTime, duration, days, weeks, trainer, program }) => {
  const clock = parseClock(startTime);
  if (!startDate || !clock) return [];
  const [year, month, day] = startDate.split('-').map(Number);
  const first = new Date(year, month - 1, day);
  const wanted = new Set(days.map((d) => WEEKDAY_INDEX[d]));
  const minutes = Math.round(Number(duration) * 60);
  const sessions = [];
  for (let offset = 0; offset < Number(weeks) * 7; offset += 1) {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + offset);
    if (!wanted.has(date.getDay())) continue;
    const start = new Date(date);
    start.setHours(clock.hours, clock.minutes, 0, 0);
    const end = new Date(start.getTime() + minutes * 60000);
    sessions.push({ start, end, trainer: trainer?.trim() || null, title: program });
  }
  return sessions;
};

export const validatePersonalSchedule = (schedule) => {
  const errors = [];
  const start = clockMinutes(schedule.startTime);
  const open = clockMinutes(OPENING_HOURS.open);
  const close = clockMinutes(OPENING_HOURS.close);
  const duration = Number(schedule.duration);
  if (!schedule.startDate) errors.push('Choose the first session date.');
  if (start === null) errors.push('Enter a valid session start time.');
  if (!duration || duration < PERSONAL_DEFAULTS.minDuration || duration > PERSONAL_DEFAULTS.maxDuration) {
    errors.push(`Session length must be between ${PERSONAL_DEFAULTS.minDuration} and ${PERSONAL_DEFAULTS.maxDuration} hours.`);
  }
  if (start !== null && duration && (start < open || start + duration * 60 > close)) {
    errors.push('Personal sessions must fit inside opening hours (4:00 PM – 9:00 PM).');
  }
  if (!schedule.days.length) errors.push('Pick at least one training day.');
  if (!Number(schedule.weeks) || Number(schedule.weeks) < 1) errors.push('Number of weeks must be at least 1.');
  return errors;
};

// ----- Registration -----------------------------------------------------------

const clean = (value) => {
  const trimmed = String(value ?? '').trim();
  return trimmed === '' ? undefined : trimmed;
};

export const effectiveAmount = (trainee, plan) =>
  trainee.amount !== null && trainee.amount !== undefined ? trainee.amount : (plan ? String(planPrice(plan)) : '');

const whatsappFor = (trainee) => {
  if (trainee.whatsappSameAsMobile) return clean(trainee.phone);
  return clean(trainee.whatsappNumber);
};

export const validateRegistration = ({ registrant, parent, trainees, trainingType, plansById }) => {
  const errors = [];
  if (registrant === 'child') {
    if (!clean(parent.name)) errors.push('Parent/guardian name is required.');
    else if (!NAME_PATTERN.test(parent.name.trim())) errors.push('Parent/guardian name may contain only letters, spaces, hyphens and apostrophes.');
    if (!clean(parent.phone)) errors.push('Parent/guardian mobile number is required.');
    else if (!PHONE_PATTERN.test(parent.phone.trim())) errors.push('Parent/guardian mobile number is not valid.');
  }

  trainees.forEach((trainee, index) => {
    const label = clean(trainee.name) || `Trainee ${index + 1}`;
    if (!clean(trainee.name)) errors.push(`Trainee ${index + 1}: full name is required.`);
    else if (!NAME_PATTERN.test(trainee.name.trim())) errors.push(`${label}: name may contain only letters, spaces, hyphens and apostrophes.`);

    const age = Number(trainee.age);
    if (trainee.age === '' || !Number.isInteger(age)) errors.push(`${label}: age is required.`);
    else if (age < MIN_MEMBER_AGE || age > 100) errors.push(`${label}: age must be between ${MIN_MEMBER_AGE} and 100.`);
    else if (registrant === 'adult' && age < ADULT_AGE) {
      errors.push(`${label}: adults registering themselves must be ${ADULT_AGE}+. Register children under a parent/guardian.`);
    }

    if (registrant === 'adult' && !clean(trainee.phone)) errors.push(`${label}: mobile number is required.`);
    if (clean(trainee.phone) && !PHONE_PATTERN.test(trainee.phone.trim())) errors.push(`${label}: mobile number is not valid.`);
    const whatsapp = whatsappFor(trainee);
    if (whatsapp && !PHONE_PATTERN.test(whatsapp)) errors.push(`${label}: WhatsApp number is not valid.`);
    if (clean(trainee.emiratesId) && !EMIRATES_ID_PATTERN.test(trainee.emiratesId.replace(/\s/g, ''))) {
      errors.push(`${label}: Emirates ID must look like 784-YYYY-NNNNNNN-N.`);
    }
    if (trainee.hasMedical && !clean(trainee.medicalIssues)) errors.push(`${label}: describe the medical condition.`);

    if (trainingType === 'group' && !plansById.get(Number(trainee.planId))) errors.push(`${label}: choose a package.`);
    const plan = plansById.get(Number(trainee.planId));
    const amount = effectiveAmount(trainee, plan);
    if (clean(amount) && !(Number(amount) >= 0)) errors.push(`${label}: payment amount must be a number.`);
  });
  return errors;
};

/** Shape the form state into the `registration` object App's handleEnroll expects. */
export const buildRegistration = ({ registrant, parent, trainees, trainingType, paymentMethod, plansById, personalSessions = [] }) => ({
  parent: registrant === 'child'
    ? { name: parent.name.trim(), phone: parent.phone.trim(), email: clean(parent.email) || null }
    : null,
  trainees: trainees.map((trainee) => {
    const plan = trainingType === 'group' ? plansById.get(Number(trainee.planId)) : null;
    const amount = clean(effectiveAmount(trainee, plan));
    const result = {
      name: trainee.name.trim(),
      age: Number(trainee.age),
      gender: trainee.gender,
      planId: plan ? plan.id : null,
      payment: amount !== undefined ? { amount: Number(amount), method: paymentMethod } : null,
      templateIds: trainingType === 'group' ? [...trainee.templateIds] : []
    };
    const optional = {
      phone: clean(trainee.phone),
      whatsappNumber: whatsappFor(trainee),
      emiratesId: clean(trainee.emiratesId),
      email: clean(trainee.email),
      medicalIssues: trainee.hasMedical ? clean(trainee.medicalIssues) : undefined
    };
    Object.entries(optional).forEach(([key, value]) => {
      if (value !== undefined) result[key] = value;
    });
    return result;
  }),
  personalSessions: trainingType === 'personal' ? personalSessions : []
});
