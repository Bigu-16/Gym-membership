import { useState } from 'react';
import { formatTimeRange } from '../../utils/classSessions';
import { groupTemplatesByClass, isTemplateFull, suggestedTemplates } from './enrollmentHelpers';

/**
 * Checkbox list of weekly class slots. Suggests slots that match the package's
 * program (and the trainee's age); staff can switch to the full timetable.
 */
const ClassSlotPicker = ({ templates = [], plan, age, selectedIds = [], onChange, label = 'Class slots' }) => {
  const [showAll, setShowAll] = useState(false);
  const selected = new Set(selectedIds);
  const suggested = suggestedTemplates(templates, plan, age);
  const canFilter = Boolean(plan?.program) && suggested.length !== templates.length;
  const visible = showAll || !canFilter
    ? templates
    : templates.filter((t) => suggested.includes(t) || selected.has(t.id));

  const toggle = (id) => {
    onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div role="group" aria-label={label} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">
          {label} {selectedIds.length > 0 && <span className="text-[var(--text-primary)] font-bold">({selectedIds.length} selected)</span>}
        </p>
        {canFilter && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="text-[9px] uppercase tracking-luxury font-bold text-[var(--text-primary)] hover:opacity-60"
          >
            {showAll ? `Only ${plan.program} classes` : 'Show all classes'}
          </button>
        )}
      </div>

      {templates.length === 0 ? (
        <p className="text-[11px] text-[var(--text-secondary)] rounded-xl border border-dashed border-[var(--glass-border)] p-3">
          No classes in the timetable yet. Add them under Templates, or assign classes later from the member profile.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-[11px] text-[var(--text-secondary)] rounded-xl border border-dashed border-[var(--glass-border)] p-3">
          No {plan?.program} classes suit this age. Use “Show all classes” to pick another slot.
        </p>
      ) : (
        <div className="space-y-3">
          {groupTemplatesByClass(visible).map(([className, slots]) => (
            <div key={className} className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] opacity-80">{className}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const isSelected = selected.has(slot.id);
                  const full = isTemplateFull(slot) && !isSelected;
                  const time = formatTimeRange(slot.time);
                  return (
                    <label
                      key={slot.id}
                      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs transition-all ${
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-[var(--glass-border)] bg-[var(--bg-primary)]'
                      } ${full ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--text-primary)]/40'}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-emerald-500"
                        checked={isSelected}
                        disabled={full}
                        onChange={() => toggle(slot.id)}
                        aria-label={`${className}, ${slot.days}, ${time}`}
                      />
                      <span className="flex-grow">
                        <span className="block font-semibold">{slot.days}</span>
                        <span className="block text-[11px] text-[var(--text-secondary)]">{time}</span>
                      </span>
                      <span className={`text-[10px] font-bold whitespace-nowrap ${full ? 'text-rose-500' : 'text-[var(--text-secondary)]'}`}>
                        {slot.capacity ? `${slot.enrolled ?? 0}/${slot.capacity}` : `${slot.enrolled ?? 0} enrolled`}
                        {full && ' · Full'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassSlotPicker;
