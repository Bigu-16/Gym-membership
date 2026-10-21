import { useMemo, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import PackageTemplateModal from './templates/PackageTemplateModal';
import { formatMoney } from '../utils/membership';
import { Spinner, useFeedback } from './common/Feedback';

/** Membership packages (price list). Separate from the class timetable on purpose. */
const PackagesPage = ({ membershipPlans = [], onAddPlan, onUpdatePlan, onDeletePlan, onLoadOfficialPackages }) => {
  const [editor, setEditor] = useState({ open: false, plan: null });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
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

  const { confirm } = useFeedback();

  // Success messages come from the data layer; errors stay next to the table.
  const run = async (action) => {
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message || 'Action failed');
      throw err;
    }
  };

  const loadOfficial = async () => {
    const ok = await confirm({
      title: 'Load the official price list?',
      message: 'Missing official packages are added and any official package whose price was changed is set back to the official price. Your own extra packages are not touched.',
      confirmLabel: 'Load price list'
    });
    if (!ok) return;
    setLoading(true);
    try {
      await onLoadOfficialPackages();
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load the official packages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          Prices from the front-desk price card (1 and 3 months) and the registration form (6 months and 1 year).
        </p>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mr-1">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
          </label>
          <button type="button" disabled={loading} onClick={loadOfficial} className="btn-secondary">
            {loading ? <Spinner label="Loading…" /> : 'Load official packages'}
          </button>
          <button type="button" onClick={() => setEditor({ open: true, plan: null })} className="btn-primary">
            <Plus size={16} aria-hidden="true" /> New package
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-danger">{error}</div>}

      {programs.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-[var(--text-secondary)]">
          No packages yet. Press <strong>Load official packages</strong> to add the N &amp; T price list.
        </div>
      ) : (
        programs.map(([program, plans]) => (
          <section key={program} className="glass-card overflow-hidden" aria-labelledby={`program-${program}`}>
            <h2 id={`program-${program}`} className="section-title px-5 py-3 border-b border-[var(--glass-border)]">
              {program}
              {plans[0]?.description && <span className="font-normal text-sm text-[var(--text-secondary)]"> · {plans[0].description}</span>}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--text-secondary)]">
                    <th scope="col" className="px-5 py-2 font-semibold">Duration</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Classes / week</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Price</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Includes</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="px-5 py-2.5 font-medium">{plan.duration_label}</td>
                      <td className="px-3 py-2.5">{plan.classes_per_week || '—'}</td>
                      <td className="px-3 py-2.5 font-semibold">{formatMoney(plan.price, plan.currency)}</td>
                      <td className="px-3 py-2.5 text-[var(--text-secondary)]">{plan.included_items?.join(', ') || '—'}</td>
                      <td className="px-3 py-2.5">
                        {plan.is_active ? <span className="text-success font-semibold">Active</span> : <span className="text-[var(--text-secondary)]">Inactive</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => setEditor({ open: true, plan })} className="btn-secondary btn-sm" aria-label={`Edit ${plan.name}`}>
                            <Pencil size={14} aria-hidden="true" /> Edit
                          </button>
                          <button
                            type="button"
                            title={plan.is_active ? 'Deactivate package' : 'Activate package'}
                            aria-label={plan.is_active ? `Deactivate ${plan.name}` : `Activate ${plan.name}`}
                            onClick={async () => {
                              if (plan.is_active && !(await confirm({
                                title: `Deactivate ${plan.name}?`,
                                message: 'It will no longer be offered at registration. Members already on it keep it.',
                                confirmLabel: 'Deactivate'
                              }))) return;
                              run(() => onUpdatePlan({ ...plan, is_active: !plan.is_active })).catch(() => {});
                            }}
                            className="btn-secondary btn-sm"
                          >
                            <Power size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            title="Delete package"
                            aria-label={`Delete ${plan.name}`}
                            onClick={() => setPendingDelete(plan)}
                            className="btn-secondary btn-sm text-danger"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      {editor.open && (
        <PackageTemplateModal
          isOpen
          plan={editor.plan}
          onClose={() => setEditor({ open: false, plan: null })}
          onSave={(plan) => run(() => (plan.id ? onUpdatePlan(plan) : onAddPlan(plan)))}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
          <div className="glass-card max-w-sm w-full p-6 border border-[var(--glass-border)] bg-[var(--bg-secondary)]">
            <h3 className="text-sm font-bold">Delete package?</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-3">
              Delete “{pendingDelete.name}”? Packages that members are on cannot be deleted. Deactivate them instead.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => run(() => onDeletePlan(pendingDelete.id)).catch(() => {}).finally(() => setPendingDelete(null))}
                className="flex-1 py-3 rounded-xl bg-danger-solid text-white text-xs font-bold"
              >
                Delete
              </button>
              <button type="button" onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-xs font-bold">
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
