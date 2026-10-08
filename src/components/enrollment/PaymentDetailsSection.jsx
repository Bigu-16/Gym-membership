
const PaymentDetailsSection = ({
  payment,
  setPayment,
  trainingType,
  selectedPackage,
  participantCount
}) => {
  const isGroupPackage = trainingType === 'group';

  return (
    <>
      <section className="glass-card p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-xs uppercase tracking-luxury font-bold">Payment Details</h2>
        </div>

        {isGroupPackage && (
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="block text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">Selected package</span>
              <span className="block text-sm font-black mt-1">
                {selectedPackage.program} · {selectedPackage.durationMonths} {selectedPackage.durationMonths === 1 ? 'month' : 'months'} · {selectedPackage.classesPerWeek} classes/week
              </span>
              {selectedPackage.includedItem && (
                <span className="inline-flex mt-2 rounded-full bg-amber-500/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                  {selectedPackage.includedItem}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="block text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">
                {participantCount} {participantCount === 1 ? 'trainee' : 'trainees'}
              </span>
              <span className="block text-2xl font-black mt-1">AED {payment.amount}</span>
            </div>
          </div>
        )}

        {!isGroupPackage && (
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-primary)] p-4 text-[11px] text-[var(--text-secondary)]">
            Personal training pricing is custom. Enter agreed amount; no package price is assumed.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">
              {isGroupPackage ? 'Total Amount' : 'Agreed Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-secondary)]">AED</span>
              <input
                required
                readOnly={isGroupPackage}
                type="text"
                value={payment.amount}
                onChange={(event) => setPayment((current) => ({ ...current, amount: event.target.value }))}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl pl-14 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Method</label>
            <select
              value={payment.method}
              onChange={(event) => setPayment((current) => ({ ...current, method: event.target.value }))}
              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
            >
              <option>Cash</option>
              <option>Credit Card</option>
              <option>Bank Transfer</option>
              <option>Mobile Pay</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Initial Status</label>
            <select
              value={payment.status}
              onChange={(event) => setPayment((current) => ({ ...current, status: event.target.value }))}
              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
            >
              <option>Paid</option>
              <option>Partial</option>
              <option>Pending</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="group relative px-12 py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
        >
          <span className="relative z-10 text-xs uppercase tracking-luxury font-bold">Confirm Enrollment</span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </button>
      </div>
    </>
  );
};

export default PaymentDetailsSection;
