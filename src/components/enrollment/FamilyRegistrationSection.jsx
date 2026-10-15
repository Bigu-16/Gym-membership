import TraineeCard from './TraineeCard';
import { inputClass, labelClass, sectionTitleClass } from './fieldStyles';

/**
 * Parent/guardian details (for children) plus one card per trainee. Adults
 * registering themselves have no parent block and need their own mobile number.
 */
const FamilyRegistrationSection = ({
  registrant,
  parent,
  onParentChange,
  trainees,
  onTraineeChange,
  onAddTrainee,
  onRemoveTrainee,
  plans,
  plansById,
  scheduleTemplates
}) => {
  const isChild = registrant === 'child';
  const setParent = (field) => (event) => onParentChange({ [field]: event.target.value });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 px-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 className={sectionTitleClass}>Registration Details</h2>
      </div>

      {isChild && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-secondary)]">Parent / Guardian</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="parent-name" className={labelClass}>Parent/guardian full name</label>
              <input
                id="parent-name"
                type="text"
                value={parent.name}
                onChange={setParent('name')}
                className={inputClass}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label htmlFor="parent-phone" className={labelClass}>Parent/guardian mobile</label>
              <input
                id="parent-phone"
                type="tel"
                value={parent.phone}
                onChange={setParent('phone')}
                className={inputClass}
                placeholder="+971 50 123 4567"
              />
            </div>
            <div>
              <label htmlFor="parent-email" className={labelClass}>Parent/guardian email (optional)</label>
              <input
                id="parent-email"
                type="email"
                value={parent.email}
                onChange={setParent('email')}
                className={inputClass}
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {trainees.map((trainee, index) => (
          <TraineeCard
            key={trainee.key}
            trainee={trainee}
            index={index}
            registrant={registrant}
            plans={plans}
            plansById={plansById}
            scheduleTemplates={scheduleTemplates}
            canRemove={trainees.length > 1}
            onChange={(changes) => onTraineeChange(trainee.key, changes)}
            onRemove={() => onRemoveTrainee(trainee.key)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddTrainee}
        className="text-[10px] uppercase tracking-luxury font-bold text-[var(--text-primary)] hover:opacity-60 transition-opacity px-2"
      >
        {isChild ? '+ Add sibling' : '+ Add another adult'}
      </button>
    </section>
  );
};

export default FamilyRegistrationSection;
