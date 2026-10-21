import { useMemo, useState } from 'react';
import { Package, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import PackageTemplateModal from './templates/PackageTemplateModal';
import { formatMoney } from '../utils/membership';

/** Membership packages (price list). Separate from the class timetable on purpose. */
const PackagesPage = ({ membershipPlans = [], onAddPlan, onUpdatePlan, onDeletePlan, onLoadOfficialPackages }) => {
  const [editor, setEditor] = useState({ open: false, plan: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const programs = useMemo(() => {
    const grouped = new Map();
    membershipPlans
      .filter((plan) => showInactive || plan.is_active)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.duration_months - b.duration_months)
      .forEach((plan) => {
        const key = plan.program || 'General';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(plan);
      });
    return [...grouped.entries()];
  }, [membershipPlans, showInactive]);

  const run = async (action, success) => {
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(success);
    } catch (err) {
      setError(err.message || 'Action failed');
      throw err;
    }
  };

  const loadOfficial = async () => {
    setLoading(true);
    try {
      const result = await onLoadOfficialPackages();
      setError('');
      setNotice(result.created || result.updated
        ? `Official price list applied: ${result.created} added, ${result.updated} corrected.`
        : 'All official packages are already up to date.');
    } catch (err) {
      setError(err.message || 'Could not load the official packages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass-card p-5 border border-[var(--glass-border)] flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div>
          <h2 className="text-lg font-light uppercase tracking-luxury flex items-center gap-2"><Package size={18} /> Packages</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
            Official prices combine the front-desk price card (1 and 3 months) with the registration form&apos;s
            6-month and 1-year packages. Where they disagreed, the price card is used.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs uppercase tracking-luxury text-[var(--text-secondary)] mr-2">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={loadOfficial}
            className="px-4 py-2.5 rounded-xl border border-orange-500/30 text-brand text-xs uppercase tracking-luxury font-bold disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load official packages'}
          </button>
          <button
            type="button"
            onClick={() => setEditor({ open: true, plan: null })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs uppercase tracking-luxury font-bold"
          >
            <Plus size={14} /> New package
          </button>
        </div>
      </div>

      {notice && <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-success">{notice}</div>}
      {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-danger">{error}</div>}

      {programs.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-[var(--text-secondary)]">
          No packages yet. Press <strong>Load official packages</strong> to add the N &amp; T price list.
        </div>
      ) : (
        programs.map(([program, plans]) => (
          <section key={program} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-luxury text-[var(--text-secondary)]">
              {program}{plans[0]?.description ? ` · ${plans[0].description}` : ''}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              {plans.map((plan) => (
                <article key={plan.id} className={`glass-card p-4 border border-[var(--glass-border)] flex flex-col gap-3 ${plan.is_active ? '' : 'border-dashed'}`}>
                  <div>
                    <p className="text-xs uppercase tracking-luxury text-[var(--text-secondary)]">{plan.duration_label}</p>
                    <p className="text-2xl font-light mt-1">{formatMoney(plan.price, plan.currency)}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {plan.classes_per_week ? `${plan.classes_per_week} classes / week` : 'Flexible'}
                    </p>
                    {plan.included_items?.length > 0 && (
                      <p className="text-xs text-success mt-1 font-semibold">{plan.included_items.join(', ')}</p>
                    )}
                    {!plan.is_active && <p className="text-xs text-danger mt-1 font-semibold">Inactive</p>}
                  </div>
                  <div className="flex gap-1.5 mt-auto">
                    <button type="button" onClick={() => setEditor({ open: true, plan })} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--glass-border)] py-2 text-xs uppercase tracking-luxury">
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      title={plan.is_active ? 'Deactivate package' : 'Activate package'}
                      aria-label={plan.is_active ? `Deactivate ${plan.name}` : `Activate ${plan.name}`}
                      onClick={() => run(() => onUpdatePlan({ ...plan, is_active: !plan.is_active }), plan.is_active ? 'Package deactivated.' : 'Package activated.').catch(() => {})}
                      className="p-2.5 rounded-xl border border-[var(--glass-border)]"
                    >
                      <Power size={13} />
                    </button>
                    <button
                      type="button"
                      title="Delete package"
                      aria-label={`Delete ${plan.name}`}
                      onClick={() => setPendingDelete(plan)}
                      className="p-2.5 rounded-xl border border-rose-500/20 text-danger"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {editor.open && (
        <PackageTemplateModal
          isOpen
          plan={editor.plan}
          onClose={() => setEditor({ open: false, plan: null })}
          onSave={(plan) => run(() => (plan.id ? onUpdatePlan(plan) : onAddPlan(plan)), plan.id ? 'Package updated.' : 'Package created.')}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="glass-card max-w-sm w-full p-6 border border-[var(--glass-border)] bg-[var(--bg-secondary)]">
            <h3 className="text-sm font-bold uppercase tracking-luxury">Delete package?</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-3">
              Delete “{pendingDelete.name}”? Packages that members are on cannot be deleted. Deactivate them instead.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => run(() => onDeletePlan(pendingDelete.id), 'Package deleted.').catch(() => {}).finally(() => setPendingDelete(null))}
                className="flex-1 py-3 rounded-xl bg-danger-solid text-white text-xs uppercase tracking-luxury font-bold"
              >
                Delete
              </button>
              <button type="button" onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-xs uppercase tracking-luxury font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
