import { useState } from 'react';
import { daysUntil, formatDate, formatMoney } from '../../utils/membership';
import { PAYMENT_METHODS, planPrice } from '../enrollment/enrollmentHelpers';
import { fieldClass, planOptionLabel, planOptionsFor, previewRenewalExpiry } from './memberDetailsHelpers';

/**
 * Renew one member, or every trainee of a family (each keeps their own package by
 * default). Calls onConfirm(renewal) where renewal is { planId, startFrom, payment }
 * for an individual, or a function trainee => renewal for a family.
 */
const MemberRenewModal = ({ member, membershipPlans = [], onClose, onConfirm }) => {
  const people = member.isGroup ? member.trainees || [] : [member];
  const plansById = new Map(membershipPlans.map((p) => [p.id, p]));

  const [rows, setRows] = useState(() =>
    Object.fromEntries(people.map((person) => {
      const plan = plansById.get(person.planId);
      return [person.id, { planId: person.planId ?? '', amount: plan ? String(planPrice(plan)) : '' }];
    }))
  );
  const [startFrom, setStartFrom] = useState('expiry');
  const [method, setMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateRow = (id, changes) => setRows((current) => ({ ...current, [id]: { ...current[id], ...changes } }));

  const changePlan = (id, value) => {
    const plan = plansById.get(Number(value));
    updateRow(id, { planId: value === '' ? '' : Number(value), amount: plan ? String(planPrice(plan)) : '' });
  };

  const total = people.reduce((sum, person) => sum + (Number(rows[person.id]?.amount) || 0), 0);
  const anyActive = people.some((person) => (daysUntil(person.expiryDate) ?? -1) > 0);

  const renewalFor = (person) => {
    const row = rows[person.id];
    return {
      planId: Number(row.planId),
      startFrom,
      payment: row.amount !== '' && row.amount !== null ? { amount: Number(row.amount), method } : null
    };
  };

  const confirm = async () => {
    const missing = people.filter((person) => !rows[person.id]?.planId);
    if (missing.length > 0) {
      setError(`Choose a package for ${missing.map((p) => p.name).join(', ')}.`);
      return;
    }
    const badAmount = people.find((person) => rows[person.id].amount !== '' && !(Number(rows[person.id].amount) >= 0));
    if (badAmount) {
      setError(`Amount for ${badAmount.name} must be a number.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(member.isGroup ? (trainee) => renewalFor(trainee) : renewalFor(member));
    } catch (err) {
      setError(err?.message || 'Renewal failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="renew-title">
      <div className="glass-card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="renew-title" className="text-lg font-semibold text-[var(--text-primary)]">Renew membership</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {member.isGroup ? `${member.name} · ${people.length} trainees` : member.name}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={() => !submitting && onClose()} className="btn-secondary btn-sm">
            ✕
          </button>
        </div>

        <ul className="mt-4 divide-y divide-[var(--glass-border)] border-y border-[var(--glass-border)]">
          {people.map((person) => {
            const row = rows[person.id];
            const plan = plansById.get(Number(row.planId));
            const remaining = daysUntil(person.expiryDate);
            const newExpiry = previewRenewalExpiry(person, plan, startFrom);
            return (
              <li key={person.id} className="space-y-3 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{person.name}</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {person.expiryDate
                      ? `Expires ${formatDate(person.expiryDate)} (${remaining < 0 ? `expired ${Math.abs(remaining)} days ago` : `${remaining} days left`})`
                      : 'No expiry recorded'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
                  <div>
                    <label htmlFor={`renew-plan-${person.id}`} className="label mb-1">Package</label>
                    <select
                      id={`renew-plan-${person.id}`}
                      value={row.planId}
                      onChange={(e) => changePlan(person.id, e.target.value)}
                      className={`${fieldClass} select-chevron pr-10`}
                    >
                      <option value="">Choose a package…</option>
                      {planOptionsFor(membershipPlans, person.planId).map((option) => (
                        <option key={option.id} value={option.id}>{planOptionLabel(option)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`renew-amount-${person.id}`} className="label mb-1">Amount (AED)</label>
                    <input
                      id={`renew-amount-${person.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(person.id, { amount: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  New expiry:{' '}
                  <strong className="font-semibold text-success">
                    {newExpiry ? formatDate(newExpiry, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </strong>
                </p>
              </li>
            );
          })}
        </ul>

        <fieldset className="mt-4">
          <legend className="label mb-2">New period starts</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'expiry', title: 'After current expiry', hint: anyActive ? 'Keeps the remaining days' : 'Expired, so it starts today' },
              { value: 'today', title: 'Today', hint: 'Remaining days are dropped' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={startFrom === option.value}
                onClick={() => setStartFrom(option.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  startFrom === option.value
                    ? 'border-[var(--text-primary)] bg-[var(--card-hover)]'
                    : 'border-[var(--glass-border)] hover:bg-[var(--card-hover)]'
                }`}
              >
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{option.title}</span>
                <span className="block text-xs text-[var(--text-secondary)]">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid grid-cols-2 items-end gap-3">
          <div>
            <label htmlFor="renew-method" className="label mb-1">Payment method</label>
            <select id="renew-method" value={method} onChange={(e) => setMethod(e.target.value)} className={`${fieldClass} select-chevron pr-10`}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="text-right">
            <span className="label">Total</span>
            <span className="block text-xl font-semibold text-[var(--text-primary)]">{formatMoney(total)}</span>
          </div>
        </div>

        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" disabled={submitting} onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" disabled={submitting} onClick={confirm} className="btn-primary">
            {submitting ? 'Renewing…' : 'Confirm & renew'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberRenewModal;
