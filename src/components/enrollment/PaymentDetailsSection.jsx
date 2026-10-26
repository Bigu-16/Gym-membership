import { formatMoney } from '../../utils/membership';
import FormSection from './FormSection';
import { PAYMENT_METHODS, effectiveAmount, planSummary } from './enrollmentHelpers';
import { inputClass, selectClass, labelClass } from './fieldStyles';

/** Amount per trainee, payment method, center terms, errors and the submit button. */
const PaymentDetailsSection = ({
  number,
  trainees,
  plansById,
  paymentMethod,
  onPaymentMethodChange,
  termsAccepted,
  onTermsAcceptedChange,
  onAmountChange,
  onClear,
  errors = [],
  submitting
}) => {
  const rows = trainees.map((trainee, index) => {
    const plan = plansById.get(Number(trainee.planId)) || null;
    return { trainee, index, plan, amount: effectiveAmount(trainee, plan) };
  });
  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  return (
    <FormSection number={number} title="Payment & terms" id="enroll-payment">
      <div className="divide-y divide-[var(--glass-border)]">
        {rows.map(({ trainee, index, plan, amount }) => (
          <div key={trainee.key} className="flex flex-wrap items-center justify-between gap-3 py-2 first:pt-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{trainee.name.trim() || `Trainee ${index + 1}`}</p>
              <p className="text-xs text-[var(--text-secondary)]">{plan ? planSummary(plan) : 'No package chosen'}</p>
            </div>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-secondary)]">AED</span>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                aria-label={`Amount paid for ${trainee.name.trim() || `trainee ${index + 1}`}`}
                value={amount}
                onChange={(event) => onAmountChange(trainee.key, event.target.value)}
                className={`${inputClass} pl-12 text-right`}
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-[var(--glass-border)]">
        <div className="w-48">
          <label htmlFor="payment-method" className={labelClass}>Payment method</label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(event) => onPaymentMethodChange(event.target.value)}
            className={selectClass}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </div>
        <p className="text-right">
          <span className="label">Total</span>
          <span className="block text-xl font-semibold text-[var(--text-primary)]" data-testid="payment-total">{formatMoney(total)}</span>
        </p>
      </div>

      {/* Terms printed on the N & T registration form */}
      <div className="space-y-2 pt-3 border-t border-[var(--glass-border)]">
        <p className="label">Center terms</p>
        <p tabIndex={0} role="region" aria-label="Center terms" className="max-h-24 overflow-y-auto rounded-xl border border-[var(--glass-border)] bg-[var(--bg-primary)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          As per N &amp; T Taekwondo &amp; Karate Center management: all activity fees are non-refundable. The management
          does not accept any responsibility for any loss, theft or damage caused to valuables or personal belongings
          brought into the club. Lockers are provided for the convenience of the members for clothes and personal
          belongings. All persons entering the club do so at their own risk. The club does not accept any responsibility
          whatsoever for any injury, death of members/dependents, guests or damage to personal properties within the
          club premises.
        </p>
        <label className="flex items-start gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => onTermsAcceptedChange(event.target.checked)}
            className="mt-1"
            required
          />
          <span>The student/parent has read and agrees to these rules and regulations.</span>
        </label>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-danger">
          <p className="font-semibold">Registration was not saved:</p>
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <button type="button" onClick={onClear} disabled={submitting} className="btn-secondary">
          Clear form
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Saving…' : 'Confirm enrollment'}
        </button>
      </div>
    </FormSection>
  );
};

export default PaymentDetailsSection;
