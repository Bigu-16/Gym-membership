import { addMonths, daysUntil, membershipStatus } from '../../utils/membership';
import { activePlans } from '../enrollment/enrollmentHelpers';

/** Active packages, plus the member's current package if it has since been retired. */
export const planOptionsFor = (membershipPlans = [], currentPlanId = null) => {
  const options = activePlans(membershipPlans);
  if (currentPlanId && !options.some((p) => p.id === currentPlanId)) {
    const current = membershipPlans.find((p) => p.id === currentPlanId);
    if (current) options.unshift(current);
  }
  return options;
};

export const planOptionLabel = (plan) => {
  const parts = [plan.name || plan.program];
  if (plan.price !== undefined && plan.price !== null) parts.push(`${Number(plan.price)} ${plan.currency || 'AED'}`);
  return parts.join(' — ') + (plan.is_active === false ? ' (retired)' : '');
};

/** Mirrors the backend: extend from expiry only while it is still in the future. */
export const previewRenewalExpiry = (member, plan, startFrom, today = new Date()) => {
  if (!plan) return null;
  const remaining = daysUntil(member?.expiryDate, today);
  const start = startFrom === 'expiry' && remaining !== null && remaining > 0
    ? member.expiryDate
    : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (plan.duration_months) return addMonths(start, plan.duration_months);
  const base = addMonths(start, 0);
  base.setDate(base.getDate() + (plan.duration_days || 30));
  return base;
};

export const EMIRATES_ID_PATTERN = /^784-?\d{4}-?\d{7}-?\d$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{5,28}$/;

export const memberToForm = (member) => ({
  name: member.name || '',
  phone: member.phone || '',
  whatsappNumber: member.whatsappNumber || '',
  emiratesId: member.emiratesId || '',
  email: member.email || '',
  gender: member.gender || '',
  age: member.age ?? '',
  planId: member.planId ?? '',
  expiryDate: member.expiryDate ? String(member.expiryDate).split('T')[0] : '',
  medicalIssues: member.medicalIssues || '',
  messagingOptIn: member.messagingOptIn !== undefined ? member.messagingOptIn : true
});

export const validateMemberForm = (form, member) => {
  const errors = [];
  if (!form.name.trim()) errors.push('Name is required.');
  const needsOwnPhone = !member.parentPhone && !member.familyId;
  if (needsOwnPhone && !form.phone.trim()) errors.push('Mobile number is required for adults without a parent/guardian.');
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) errors.push('Mobile number is not valid.');
  if (form.whatsappNumber.trim() && !PHONE_PATTERN.test(form.whatsappNumber.trim())) errors.push('WhatsApp number is not valid.');
  if (form.emiratesId.trim() && !EMIRATES_ID_PATTERN.test(form.emiratesId.replace(/\s/g, ''))) {
    errors.push('Emirates ID must look like 784-YYYY-NNNNNNN-N.');
  }
  if (form.age !== '' && form.age !== null) {
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 2 || age > 100) errors.push('Age must be a whole number between 2 and 100.');
  }
  return errors;
};

/** The full member with the form's values applied (unchanged fields keep their original value). */
export const applyMemberForm = (member, form) => ({
  ...member,
  name: form.name.trim(),
  phone: form.phone.trim() || null,
  whatsappNumber: form.whatsappNumber.trim() || null,
  emiratesId: form.emiratesId.trim() || null,
  email: form.email.trim() || null,
  gender: form.gender || member.gender || null,
  age: form.age === '' || form.age === null ? member.age : Number(form.age),
  planId: form.planId === '' || form.planId === null ? null : Number(form.planId),
  expiryDate: form.expiryDate || null,
  medicalIssues: form.medicalIssues,
  messagingOptIn: form.messagingOptIn
});

/** Short status for badges: Active / Expiring in N days / Expires today / Expired / Frozen / No expiry set. */
export const memberStatusLabel = (member, today = new Date()) => {
  const status = membershipStatus(member, today);
  if (status === 'frozen') return 'Frozen';
  if (status === 'no-expiry') return 'No expiry set';
  if (status === 'expired') return 'Expired';
  if (status === 'expiring') {
    const days = daysUntil(member.expiryDate, today);
    if (days === 0) return 'Expires today';
    return `Expiring in ${days} day${days === 1 ? '' : 's'}`;
  }
  return 'Active';
};

/** "10 days left" / "expires today" / "expired 5 days ago" — shown next to an expiry date. */
export const relativeExpiry = (expiryDate, today = new Date()) => {
  const days = daysUntil(expiryDate, today);
  if (days === null) return '';
  if (days === 0) return 'expires today';
  if (days < 0) return `expired ${Math.abs(days)} day${days === -1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} left`;
};

/** Shared input style for member forms. */
export const fieldClass =
  'w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]';
