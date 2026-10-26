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
    <div role="group" aria-label={label} className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label">
          {label} {selectedIds.length > 0 && <span className="text-[var(--text-primary)]">({selectedIds.length} selected)</span>}
        </p>
        {canFilter && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="text-xs font-semibold text-[var(--text-primary)] underline-offset-2 hover:underline"
          >
            {showAll ? `Only ${plan.program} classes` : 'Show all classes'}
          </button>
        )}
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">
          No classes in the timetable yet. Add them under Templates, or assign classes later from the member profile.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)]">
          No {plan?.program} classes suit this age. Use “Show all classes” to pick another slot.
        </p>
      ) : (
        <div className="space-y-2">
          {groupTemplatesByClass(visible).map(([className, slots]) => (
            <div key={className} className="space-y-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{className}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {slots.map((slot) => {
                  const isSelected = selected.has(slot.id);
                  const full = isTemplateFull(slot) && !isSelected;
                  const time = formatTimeRange(slot.time);
                  return (
                    <label
                      key={slot.id}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-[var(--text-primary)] transition-colors ${
                        isSelected
                          ? 'border-[var(--accent-color)] bg-emerald-500/10'
                          : 'border-[var(--glass-border)] bg-[var(--bg-primary)]'
                      } ${full ? 'border-dashed cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--card-hover)]'}`}
                    >
                      <input
                        type="checkbox"
                        className="accent-emerald-700"
                        checked={isSelected}
                        disabled={full}
                        onChange={() => toggle(slot.id)}
                        aria-label={`${className}, ${slot.days}, ${time}`}
                      />
                      <span className="flex-grow">
                        <span className="font-semibold">{slot.days}</span>
                        <span className="text-[var(--text-secondary)]"> · {time}</span>
                      </span>
                      <span className={`text-xs font-semibold whitespace-nowrap ${full ? 'text-danger' : 'text-[var(--text-secondary)]'}`}>
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
