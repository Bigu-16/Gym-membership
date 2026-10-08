import { useState } from 'react';
import { X } from 'lucide-react';

const emptyPlan = {
  name: '',
  program: 'Taekwondo',
  duration_label: 'One Month',
  duration_months: 1,
  classes_per_week: 3,
  price: 350,
  currency: 'AED',
  included_items: [],
  description: '',
  sort_order: 0,
  is_active: true
};

const PackageTemplateModal = ({ plan, isOpen, onClose, onSave }) => {
  const initialPlan = plan ? { ...emptyPlan, ...plan } : emptyPlan;
  const [form, setForm] = useState(initialPlan);
  const [includedItems, setIncludedItems] = useState((initialPlan.included_items || []).join(', '));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const durationMonths = Number(form.duration_months);
      await onSave({
        ...(plan?.id ? { id: plan.id } : {}),
        name: form.name.trim(),
        program: form.program.trim(),
        duration_label: form.duration_label.trim(),
        duration_months: durationMonths,
        classes_per_week: Number(form.classes_per_week),
        price: Number(form.price),
        currency: 'AED',
        included_items: includedItems.split(',').map((item) => item.trim()).filter(Boolean),
        description: form.description?.trim() || null,
        duration_days: Number(form.duration_days || durationMonths * 30),
        sort_order: Number(form.sort_order || 0),
        is_active: Boolean(form.is_active)
      });
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save package template');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg h-full glass-card p-7 border border-[var(--glass-border)] bg-[var(--bg-secondary)] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-orange-500 font-bold">Package Configuration</span>
            <h2 className="text-2xl font-light uppercase tracking-luxury mt-2">{plan ? 'Edit Package' : 'New Package'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[var(--glass-border)]" aria-label="Close package editor">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Template name</span>
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={fieldClass} placeholder="Taekwondo One Month - 3 Classes" />
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Program</span>
            <input required value={form.program} onChange={(e) => update('program', e.target.value)} className={fieldClass} list="package-programs" />
            <datalist id="package-programs">
              {['Taekwondo', 'Kickboxing', 'Karate', 'Kung Fu', 'Fitness'].map((program) => <option key={program} value={program} />)}
            </datalist>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Duration label</span>
              <input required value={form.duration_label} onChange={(e) => update('duration_label', e.target.value)} className={fieldClass} />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Months</span>
              <input required min="1" max="120" type="number" value={form.duration_months} onChange={(e) => update('duration_months', e.target.value)} className={fieldClass} />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Classes / week</span>
              <input required min="1" max="14" type="number" value={form.classes_per_week} onChange={(e) => update('classes_per_week', e.target.value)} className={fieldClass} />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Price (AED)</span>
              <input required min="0" step="0.01" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} className={fieldClass} />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Included items</span>
            <input value={includedItems} onChange={(e) => setIncludedItems(e.target.value)} className={fieldClass} placeholder="Free uniform, Free gloves" />
            <span className="block text-[9px] text-[var(--text-secondary)]">Separate multiple items with commas.</span>
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Description</span>
            <textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} className={`${fieldClass} min-h-24 resize-y`} />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--glass-border)] p-4">
            <span>
              <span className="block text-xs font-bold uppercase tracking-luxury">Active</span>
              <span className="block text-[10px] text-[var(--text-secondary)] mt-1">Available during enrollment</span>
            </span>
            <input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} className="w-5 h-5 accent-orange-500" />
          </label>

          {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button disabled={saving} type="submit" className="flex-1 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Package'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury font-bold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageTemplateModal;
