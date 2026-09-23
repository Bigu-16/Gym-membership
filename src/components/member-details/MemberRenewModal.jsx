import React from 'react';

const MemberRenewModal = ({
  isOpen,
  onClose,
  localMember,
  daysRemaining,
  renewDurationValue,
  setRenewDurationValue,
  renewDurationUnit,
  setRenewDurationUnit,
  renewFromToday,
  setRenewFromToday,
  renewPaymentMethod,
  setRenewPaymentMethod,
  renewAmount,
  setRenewAmount,
  isRenewing,
  renewSuccess,
  calculateNewExpiryDate,
  handleConfirmRenewal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-card border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] space-y-6 text-left relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="text-base font-bold">↻</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Renew Membership</h3>
              <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">
                {localMember.isGroup ? `${localMember.name} (Family Group)` : localMember.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isRenewing && onClose()}
            className="p-2 rounded-xl glass-card hover:bg-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Current Status Box */}
        <div className={`p-4 rounded-2xl border ${
          daysRemaining <= 0 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-luxury font-bold">Current Expiry Status</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              daysRemaining <= 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {daysRemaining <= 0 ? 'Expired' : 'Active'}
            </span>
          </div>
          <p className="text-xs">
            {localMember.expiryDate 
              ? `Expiration Date: ${new Date(localMember.expiryDate).toLocaleDateString()}` 
              : 'No previous expiry date recorded'}
            <span className="opacity-80 block text-[11px] mt-0.5">
              {daysRemaining <= 0 
                ? `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} ago. Membership will be renewed anchoring from today's payment.`
                : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining.`}
            </span>
          </p>
        </div>

        {/* Duration Selector */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block">
            Select Renewal Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '1 Mo', val: 1, unit: 'Month', price: '300' },
              { label: '3 Mo', val: 3, unit: 'Month', price: '800' },
              { label: '6 Mo', val: 6, unit: 'Month', price: '1500' },
              { label: '1 Yr', val: 1, unit: 'Year', price: '2700' }
            ].map(preset => {
              const isSelected = renewDurationValue === preset.val && renewDurationUnit === preset.unit;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setRenewDurationValue(preset.val);
                    setRenewDurationUnit(preset.unit);
                    setRenewAmount(preset.price);
                  }}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                    isSelected 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/50' 
                      : 'bg-[var(--bg-primary)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-[9px] opacity-70">AED {preset.price}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Duration Fields */}
          <div className="flex gap-2 pt-1">
            <input
              type="number"
              min="1"
              max="365"
              value={renewDurationValue}
              onChange={(e) => setRenewDurationValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-24 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              placeholder="Qty"
            />
            <select
              value={renewDurationUnit}
              onChange={(e) => setRenewDurationUnit(e.target.value)}
              className="flex-grow bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            >
              <option value="Day">Day(s)</option>
              <option value="Week">Week(s)</option>
              <option value="Month">Month(s)</option>
              <option value="Year">Year(s)</option>
            </select>
          </div>
        </div>

        {/* Anchor Option */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block">
            Renewal Anchor Date
          </label>
          {daysRemaining <= 0 ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs text-emerald-300 font-medium">
                Anchored to <strong>Payment Date (Today: {new Date().toLocaleDateString()})</strong>
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRenewFromToday(false)}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  !renewFromToday
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-[var(--bg-primary)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-luxury font-bold">Extend Current</span>
                <span className="text-[11px] opacity-80">From {new Date(localMember.expiryDate).toLocaleDateString()}</span>
              </button>
              <button
                type="button"
                onClick={() => setRenewFromToday(true)}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  renewFromToday
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-[var(--bg-primary)] border-[var(--glass-border)] text-[var(--text-secondary)]'
                }`}
              >
                <span className="block text-[10px] uppercase tracking-luxury font-bold">Start From Today</span>
                <span className="text-[11px] opacity-80">{new Date().toLocaleDateString()} (Payment Date)</span>
              </button>
            </div>
          )}
        </div>

        {/* New Expiry Date Highlight */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border border-emerald-500/40 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-luxury text-emerald-400 font-bold block mb-0.5">
              Calculated New Expiry Date
            </span>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              {calculateNewExpiryDate().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <span className="text-base font-bold">✓</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block mb-1.5">
              Payment Method
            </label>
            <select
              value={renewPaymentMethod}
              onChange={(e) => setRenewPaymentMethod(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online Payment</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block mb-1.5">
              Amount Received (AED)
            </label>
            <input
              type="text"
              value={renewAmount}
              onChange={(e) => setRenewAmount(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
              placeholder="300"
            />
          </div>
        </div>

        {/* Group Warning / Note */}
        {localMember.isGroup && localMember.trainees && (
          <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--glass-border)]">
            ℹ️ <strong>Family Group Renewal:</strong> All <strong>{localMember.trainees.length} children</strong> in this family will be renewed simultaneously with this new expiration date.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={isRenewing}
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--glass-border)] text-xs uppercase tracking-luxury font-bold hover:bg-[var(--glass-border)] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isRenewing || renewSuccess}
            onClick={handleConfirmRenewal}
            className={`flex-1 py-3 rounded-xl text-xs uppercase tracking-luxury font-bold transition-all flex items-center justify-center gap-2 ${
              renewSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 disabled:opacity-50'
            }`}
          >
            {isRenewing ? (
              <>
                <span className="animate-spin inline-block mr-1">⟳</span>
                Renewing...
              </>
            ) : renewSuccess ? (
              <>
                <span>✓</span>
                Renewed Successfully!
              </>
            ) : (
              'Confirm & Renew'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default MemberRenewModal;
