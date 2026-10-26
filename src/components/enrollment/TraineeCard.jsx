import { ADULT_AGE, MIN_MEMBER_AGE } from '../../config/scheduleConfig';
import ClassSlotPicker from './ClassSlotPicker';
import { groupPlansByProgram, planOptionLabel } from './enrollmentHelpers';
import { inputClass, selectClass, labelClass } from './fieldStyles';

/** One trainee: personal details, package and weekly classes. */
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
    <div className={`space-y-4 ${index > 0 ? 'pt-5 border-t border-[var(--glass-border)]' : ''}`} data-testid="trainee-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{heading}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-danger hover:underline">
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2">
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
          />
        </div>
        <div>
          <label htmlFor={id('gender')} className={labelClass}>Gender</label>
          <select id={id('gender')} value={trainee.gender} onChange={set('gender')} className={selectClass}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label htmlFor={id('phone')} className={labelClass}>
            Mobile{isAdult ? '' : ' (optional)'}
          </label>
          <input
            id={id('phone')}
            type="tel"
            value={trainee.phone}
            onChange={set('phone')}
            className={inputClass}
            placeholder="+971 50 123 4567"
          />
          <label className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={trainee.whatsappSameAsMobile}
              onChange={(event) => onChange({ whatsappSameAsMobile: event.target.checked })}
            />
            WhatsApp same as mobile
          </label>
        </div>
        {!trainee.whatsappSameAsMobile && (
          <div>
            <label htmlFor={id('whatsapp')} className={labelClass}>WhatsApp number</label>
            <input
              id={id('whatsapp')}
              type="tel"
              value={trainee.whatsappNumber}
              onChange={set('whatsappNumber')}
              className={inputClass}
              placeholder="+971 50 123 4567"
            />
          </div>
        )}
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
        {isAdult && (
          <div>
            <label htmlFor={id('email')} className={labelClass}>Email (optional)</label>
            <input id={id('email')} type="email" value={trainee.email} onChange={set('email')} className={inputClass} placeholder="name@example.com" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div role="radiogroup" aria-labelledby={id('medicalLabel')} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span id={id('medicalLabel')} className="label">Medical condition?</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name={id('medical')} checked={!trainee.hasMedical} onChange={() => onChange({ hasMedical: false })} />
            No
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name={id('medical')} checked={trainee.hasMedical} onChange={() => onChange({ hasMedical: true })} />
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
              className={`${inputClass} h-16 resize-none`}
              placeholder="e.g. Asthma, carries an inhaler"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor={id('plan')} className={labelClass}>Package</label>
        <select
          id={id('plan')}
          value={trainee.planId ?? ''}
          onChange={(event) => onChange({ planId: event.target.value ? Number(event.target.value) : null, amount: null })}
          className={selectClass}
          disabled={plans.length === 0}
        >
          <option value="">Choose a package…</option>
          {groupPlansByProgram(plans).map(([program, items]) => (
            <optgroup key={program} label={program}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{planOptionLabel(item)}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {plan?.included_items?.length > 0 && (
          <p className="mt-1 text-xs font-semibold text-warning">Includes: {plan.included_items.join(', ')}</p>
        )}
      </div>

      <ClassSlotPicker
        templates={scheduleTemplates}
        plan={plan}
        age={trainee.age}
        selectedIds={trainee.templateIds}
        onChange={(templateIds) => onChange({ templateIds })}
        label="Classes"
      />
    </div>
  );
};

export default TraineeCard;
