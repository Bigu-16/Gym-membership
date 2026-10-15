import { ADULT_AGE, MIN_MEMBER_AGE } from '../../config/scheduleConfig';
import { formatMoney } from '../../utils/membership';
import ClassSlotPicker from './ClassSlotPicker';
import { groupPlansByProgram, planDurationLabel, planPrice } from './enrollmentHelpers';
import { inputClass, labelClass } from './fieldStyles';

const TraineeCard = ({
  trainee,
  index,
  registrant,
  plans,
  plansById,
  scheduleTemplates,
  canRemove,
  onChange,
  onRemove
}) => {
  const id = (field) => `trainee-${trainee.key}-${field}`;
  const set = (field) => (event) => onChange({ [field]: event.target.value });
  const isAdult = registrant === 'adult';
  const plan = plansById.get(Number(trainee.planId)) || null;
  const heading = isAdult ? (index === 0 ? 'Member' : `Member ${index + 1}`) : `Child ${index + 1}`;

  return (
    <div className="glass-card p-5 space-y-5 relative" data-testid="trainee-card">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-secondary)]">{heading}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[9px] uppercase tracking-luxury font-bold text-rose-500 hover:opacity-70"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label htmlFor={id('name')} className={labelClass}>Full name</label>
          <input
            id={id('name')}
            type="text"
            value={trainee.name}
            onChange={set('name')}
            className={inputClass}
            placeholder="e.g. Leo Smith"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={id('age')} className={labelClass}>Age</label>
          <input
            id={id('age')}
            type="number"
            min={isAdult ? ADULT_AGE : MIN_MEMBER_AGE}
            max={100}
            value={trainee.age}
            onChange={set('age')}
            className={inputClass}
            placeholder="Age"
          />
        </div>
        <div>
          <label htmlFor={id('gender')} className={labelClass}>Gender</label>
          <select id={id('gender')} value={trainee.gender} onChange={set('gender')} className={inputClass}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor={id('phone')} className={labelClass}>
            Mobile {isAdult ? '' : '(optional)'}
          </label>
          <input
            id={id('phone')}
            type="tel"
            value={trainee.phone}
            onChange={set('phone')}
            className={inputClass}
            placeholder="+971 50 123 4567"
          />
        </div>
        <div>
          <label htmlFor={trainee.whatsappSameAsMobile ? undefined : id('whatsapp')} className={labelClass}>WhatsApp number</label>
          {trainee.whatsappSameAsMobile ? (
            <div className="flex items-center h-[42px] px-1 text-[11px] text-[var(--text-secondary)]">
              {trainee.phone || isAdult ? 'Same as mobile' : 'None (parent number is used)'}
            </div>
          ) : (
            <input
              id={id('whatsapp')}
              type="tel"
              value={trainee.whatsappNumber}
              onChange={set('whatsappNumber')}
              className={inputClass}
              placeholder="+971 50 123 4567"
            />
          )}
          <label className="flex items-center gap-2 mt-1.5 ml-1 text-[10px] text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={trainee.whatsappSameAsMobile}
              onChange={(event) => onChange({ whatsappSameAsMobile: event.target.checked })}
            />
            Same as mobile
          </label>
        </div>
        <div>
          <label htmlFor={id('emirates')} className={labelClass}>Emirates ID (optional)</label>
          <input
            id={id('emirates')}
            type="text"
            value={trainee.emiratesId}
            onChange={set('emiratesId')}
            className={`${inputClass} font-mono`}
            placeholder="784-YYYY-NNNNNNN-N"
          />
        </div>
      </div>

      {isAdult && (
        <div className="max-w-md">
          <label htmlFor={id('email')} className={labelClass}>Email (optional)</label>
          <input id={id('email')} type="email" value={trainee.email} onChange={set('email')} className={inputClass} placeholder="name@example.com" />
        </div>
      )}

      <div className="space-y-2">
        <p className={labelClass}>Any medical condition?</p>
        <div className="flex gap-4 ml-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={id('medical')}
              checked={!trainee.hasMedical}
              onChange={() => onChange({ hasMedical: false })}
            />
            No
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={id('medical')}
              checked={trainee.hasMedical}
              onChange={() => onChange({ hasMedical: true })}
            />
            Yes
          </label>
        </div>
        {trainee.hasMedical && (
          <div>
            <label htmlFor={id('medicalDetails')} className={labelClass}>Medical details</label>
            <textarea
              id={id('medicalDetails')}
              value={trainee.medicalIssues}
              onChange={set('medicalIssues')}
              className={`${inputClass} h-20 resize-none`}
              placeholder="e.g. Asthma — carries inhaler"
            />
          </div>
        )}
      </div>

      {(
        <div className="space-y-4 pt-2 border-t border-[var(--glass-border)]">
          <div className="max-w-md">
            <label htmlFor={id('plan')} className={labelClass}>Package</label>
            <select
              id={id('plan')}
              value={trainee.planId ?? ''}
              onChange={(event) => onChange({ planId: event.target.value ? Number(event.target.value) : null, amount: null })}
              className={inputClass}
            >
              <option value="">Choose a package…</option>
              {groupPlansByProgram(plans).map(([program, items]) => (
                <optgroup key={program} label={program}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {program} · {planDurationLabel(item)}
                      {item.classes_per_week ? ` · ${item.classes_per_week}x/week` : ''} · {formatMoney(planPrice(item), item.currency || 'AED')}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {plan?.included_items?.length > 0 && (
              <p className="mt-1.5 ml-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                Includes: {plan.included_items.join(', ')}
              </p>
            )}
          </div>

          <ClassSlotPicker
            templates={scheduleTemplates}
            plan={plan}
            age={trainee.age}
            selectedIds={trainee.templateIds}
            onChange={(templateIds) => onChange({ templateIds })}
            label="Weekly class slots"
          />
        </div>
      )}
    </div>
  );
};

export default TraineeCard;
