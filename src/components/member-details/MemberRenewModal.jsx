import { useState } from 'react';
import { daysUntil, formatDate, formatMoney } from '../../utils/membership';
import { PAYMENT_METHODS, planPrice } from '../enrollment/enrollmentHelpers';
import { planOptionLabel, planOptionsFor, previewRenewalExpiry } from './memberDetailsHelpers';

const fieldClass =
  'w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Renew Membership">
      <div className="w-full max-w-xl glass-card border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--glass-border)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Renew Membership</h3>
            <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">
              {member.isGroup ? `${member.name} (${people.length} trainees)` : member.name}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => !submitting && onClose()}
            className="p-2 rounded-xl glass-card hover:bg-[var(--glass-border)] text-[var(--text-secondary)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {people.map((person) => {
            const row = rows[person.id];
            const plan = plansById.get(Number(row.planId));
            const remaining = daysUntil(person.expiryDate);
            const newExpiry = previewRenewalExpiry(person, plan, startFrom);
            return (
              <div key={person.id} className="rounded-2xl border border-[var(--glass-border)] p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <span className="font-bold">{person.name}</span>
                  <span className="text-[var(--text-secondary)]">
                    {person.expiryDate
                      ? `Expires ${formatDate(person.expiryDate)} (${remaining < 0 ? `expired ${Math.abs(remaining)} days ago` : `${remaining} days left`})`
                      : 'No expiry recorded'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                  <div>
                    <label htmlFor={`renew-plan-${person.id}`} className="block text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">
                      Package
                    </label>
                    <select
                      id={`renew-plan-${person.id}`}
                      value={row.planId}
                      onChange={(e) => changePlan(person.id, e.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Choose a package…</option>
                      {planOptionsFor(membershipPlans, person.planId).map((option) => (
                        <option key={option.id} value={option.id}>{planOptionLabel(option)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`renew-amount-${person.id}`} className="block text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1">
                      Amount (AED)
                    </label>
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
                <p className="text-[11px] text-emerald-500">
                  New expiry: <strong>{newExpiry ? formatDate(newExpiry, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</strong>
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">New period starts</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'expiry', title: 'After current expiry', hint: anyActive ? 'Keeps the remaining days' : 'Expired — starts today' },
              { value: 'today', title: 'Today', hint: 'Remaining days are dropped' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={startFrom === option.value}
                onClick={() => setStartFrom(option.value)}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  startFrom === option.value
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-semibold'
                    : 'bg-[var(--bg-primary)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-luxury font-bold">{option.title}</span>
                <span className="text-[11px] opacity-80">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label htmlFor="renew-method" className="block text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold mb-1.5">
              Payment Method
            </label>
            <select id="renew-method" value={method} onChange={(e) => setMethod(e.target.value)} className={fieldClass}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="text-right">
            <span className="block text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">Total</span>
            <span className="block text-xl font-black">{formatMoney(total)}</span>
          </div>
        </div>

        {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--glass-border)] text-xs uppercase tracking-luxury font-bold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={confirm}
            className="flex-1 py-3 rounded-xl text-xs uppercase tracking-luxury font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white disabled:opacity-50"
          >
            {submitting ? 'Renewing…' : 'Confirm & Renew'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberRenewModal;
