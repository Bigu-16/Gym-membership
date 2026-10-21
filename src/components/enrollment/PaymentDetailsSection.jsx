import { formatMoney } from '../../utils/membership';
import { PAYMENT_METHODS, effectiveAmount, planSummary } from './enrollmentHelpers';
import { inputClass, selectClass, labelClass, sectionTitleClass } from './fieldStyles';

const PaymentDetailsSection = ({
  trainees,
  plansById,
  paymentMethod,
  onPaymentMethodChange,
  termsAccepted,
  onTermsAcceptedChange,
  onAmountChange,
  errors = [],
  submitting
}) => {
  const rows = trainees.map((trainee, index) => {
    const plan = plansById.get(Number(trainee.planId)) || null;
    return { trainee, index, plan, amount: effectiveAmount(trainee, plan) };
  });
  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  return (
    <>
      <section className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className={sectionTitleClass}>Payment</h2>
        </div>

        <div className="space-y-3">
          {rows.map(({ trainee, index, plan, amount }) => (
            <div key={trainee.key} className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 items-center">
              <div>
                <p className="text-sm font-semibold">{trainee.name.trim() || `Trainee ${index + 1}`}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {plan ? planSummary(plan) : 'No package chosen'}
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-secondary)]">AED</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  aria-label={`Amount paid for ${trainee.name.trim() || `trainee ${index + 1}`}`}
                  value={amount}
                  onChange={(event) => onAmountChange(trainee.key, event.target.value)}
                  className={`${inputClass} pl-12`}
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-4 border-t border-[var(--glass-border)]">
          <div>
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
          <div className="sm:text-right">
            <span className="block text-xs uppercase tracking-luxury text-[var(--text-secondary)]">Total received</span>
            <span className="block text-2xl font-black mt-1" data-testid="payment-total">{formatMoney(total)}</span>
          </div>
        </div>
      </section>

      {/* Terms printed on the N & T registration form */}
      <section className="glass-card p-6 sm:p-8 space-y-4" aria-labelledby="terms-heading">
        <h2 id="terms-heading" className={sectionTitleClass}>Center terms</h2>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          As per N &amp; T Taekwondo &amp; Karate Center management: all activity fees are non-refundable. The management
          does not accept any responsibility for any loss, theft or damage caused to valuables or personal belongings
          brought into the club. Lockers are provided for the convenience of the members for clothes and personal
          belongings. All persons entering the club do so at their own risk. The club does not accept any responsibility
          whatsoever for any injury, death of members/dependents, guests or damage to personal properties within the
          club premises.
        </p>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => onTermsAcceptedChange(event.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--text-primary)]"
          />
          <span>The student/parent has read and agrees to these rules and regulations.</span>
        </label>
      </section>

      {errors.length > 0 && (
        <div role="alert" className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-danger space-y-1">
          <p className="font-bold">Registration was not saved:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="group relative px-12 py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-60 disabled:hover:scale-100"
        >
          <span className="relative z-10 text-xs uppercase tracking-luxury font-bold">
            {submitting ? 'Saving…' : 'Confirm Enrollment'}
          </span>
        </button>
      </div>
    </>
  );
};

export default PaymentDetailsSection;
