import React from 'react';

const PaymentDetailsSection = ({
  payment,
  setPayment,
  handleDurationValueChange,
  handleDurationUnitChange
}) => {
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Duration</label>
            <div className="flex gap-2">
              {/* Stepper Input Button */}
              <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl overflow-hidden shadow-sm hover:border-[var(--text-primary)]/30 transition-all">
                <button
                  type="button"
                  onClick={() => handleDurationValueChange(payment.durationValue - 1)}
                  className="px-3 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-colors border-r border-[var(--glass-border)]"
                  aria-label="Decrease duration"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="0"
                  value={payment.durationValue}
                  onChange={(e) => handleDurationValueChange(e.target.value)}
                  className="w-12 bg-transparent text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => handleDurationValueChange(payment.durationValue + 1)}
                  className="px-3 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-colors border-l border-[var(--glass-border)]"
                  aria-label="Increase duration"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Unit Selector */}
              <div className="relative flex-grow min-w-[100px]">
                <select
                  value={payment.durationUnit}
                  onChange={(e) => handleDurationUnitChange(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10 text-[var(--text-primary)]"
                >
                  <option value="Day">Days</option>
                  <option value="Month">Months</option>
                  <option value="Year">Years</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Currency</label>
            <div className="relative">
              <select 
                value={payment.currency}
                onChange={(e) => setPayment({...payment, currency: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10 text-[var(--text-primary)]"
              >
                <option>AED</option>
                <option>USD</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Total Amount</label>
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-secondary)]">
                  {payment.currency === 'AED' ? 'AED' : '$'}
                </span>
                <input 
                  required
                  type="text" 
                  list="amount-presets"
                  value={payment.amount}
                  onChange={(e) => setPayment({...payment, amount: e.target.value})}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl pl-12 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none"
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] opacity-40 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <datalist id="amount-presets">
                  <option value="500" />
                  <option value="1000" />
                  <option value="1500" />
                  <option value="2000" />
                  <option value="2500" />
                  <option value="3000" />
                </datalist>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Method</label>
            <div className="relative">
              <select 
                value={payment.method}
                onChange={(e) => setPayment({...payment, method: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10"
              >
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Mobile Pay</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Initial Status</label>
            <div className="relative">
              <select 
                value={payment.status}
                onChange={(e) => setPayment({...payment, status: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10"
              >
                <option>Paid</option>
                <option>Partial</option>
                <option>Pending</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
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
