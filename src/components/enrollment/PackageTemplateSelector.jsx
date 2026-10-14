import { useState } from 'react';
import { formatMoney } from '../../utils/membership';
import { groupPlansByProgram, planDurationLabel, planPrice } from './enrollmentHelpers';

/**
 * Official packages from the backend. Clicking a card applies that package to every
 * trainee on the form (each trainee can still change theirs individually).
 */
const PackageTemplateSelector = ({ plans = [], selectedPlanId, onSelect, onLoadOfficialPackages }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOfficial = async () => {
    if (!onLoadOfficialPackages) return;
    setLoading(true);
    setError('');
    try {
      await onLoadOfficialPackages();
    } catch (err) {
      setError(err?.message || 'Could not load the official packages.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 px-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)] font-black text-[9px]">
          AED
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-luxury font-bold">Package Templates</h2>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">
            Official N &amp; T packages. Selecting one applies it to every trainee below.
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="glass-card p-6 text-center space-y-3">
          <p className="text-sm font-semibold">No packages are set up yet.</p>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Load the official N &amp; T price list (Taekwondo, Karate, Kickboxing, Kung Fu and Fitness) to start registering members.
          </p>
          {onLoadOfficialPackages && (
            <button
              type="button"
              onClick={loadOfficial}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load official packages'}
            </button>
          )}
          {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {groupPlansByProgram(plans).map(([program, items]) => (
            <div key={program} className="glass-card p-5 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider">{program}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((plan) => {
                  const selected = plan.id === selectedPlanId;
                  const duration = planDurationLabel(plan);
                  const perWeek = plan.classes_per_week ? `${plan.classes_per_week} classes per week` : 'unlimited classes';
                  const price = planPrice(plan);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`Select ${program}, ${duration}, ${perWeek}, ${price} ${plan.currency || 'AED'}`}
                      onClick={() => onSelect(plan)}
                      className={`relative rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                        selected
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20'
                          : 'border-[var(--glass-border)] bg-[var(--bg-primary)] hover:border-orange-500/60'
                      }`}
                    >
                      <span className="block text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">{duration}</span>
                      <span className="block text-lg font-black mt-1">{formatMoney(price, plan.currency || 'AED')}</span>
                      {plan.classes_per_week ? (
                        <span className="block text-[10px] text-[var(--text-secondary)] mt-1">{plan.classes_per_week} classes / week</span>
                      ) : null}
                      {(plan.included_items || []).map((item) => (
                        <span key={item} className="inline-flex mt-2 mr-1 rounded-full bg-amber-500/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                          {item}
                        </span>
                      ))}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PackageTemplateSelector;
