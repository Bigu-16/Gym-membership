import { useState } from 'react';
import FormSection from './FormSection';
import TraineeCard from './TraineeCard';
import { inputClass, labelClass } from './fieldStyles';

/** Shown instead of a package list when no active packages exist yet. */
const NoPackagesNotice = ({ onLoadOfficialPackages }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOfficial = async () => {
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
    <div className="rounded-xl bg-amber-500/10 p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-warning">
        <p className="font-semibold">No packages are set up yet.</p>
        <p className="text-xs">Load the official N &amp; T price list to start registering members.</p>
        {error && <p role="alert" className="text-xs text-danger mt-1">{error}</p>}
      </div>
      {onLoadOfficialPackages && (
        <button type="button" onClick={loadOfficial} disabled={loading} className="btn-secondary btn-sm">
          {loading ? 'Loading…' : 'Load official packages'}
        </button>
      )}
    </div>
  );
};

/** Parent/guardian contact details, only for children. */
export const ParentSection = ({ number, parent, onParentChange }) => {
  const setParent = (field) => (event) => onParentChange({ [field]: event.target.value });
  return (
    <FormSection number={number} title="Parent / guardian" id="enroll-parent">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label htmlFor="parent-name" className={labelClass}>Parent/guardian full name</label>
          <input id="parent-name" type="text" value={parent.name} onChange={setParent('name')} className={inputClass} placeholder="e.g. John Doe" />
        </div>
        <div>
          <label htmlFor="parent-phone" className={labelClass}>Parent/guardian mobile</label>
          <input id="parent-phone" type="tel" value={parent.phone} onChange={setParent('phone')} className={inputClass} placeholder="+971 50 123 4567" />
        </div>
        <div>
          <label htmlFor="parent-email" className={labelClass}>Parent/guardian email (optional)</label>
          <input id="parent-email" type="email" value={parent.email} onChange={setParent('email')} className={inputClass} placeholder="john@example.com" />
        </div>
      </div>
    </FormSection>
  );
};

/** One block per trainee, each with its own package and classes. */
const FamilyRegistrationSection = ({
  number,
  registrant,
  trainees,
  onTraineeChange,
  onAddTrainee,
  onRemoveTrainee,
  plans,
  plansById,
  scheduleTemplates,
  onLoadOfficialPackages
}) => {
  const isChild = registrant === 'child';

  return (
    <FormSection number={number} title={isChild ? 'Children' : 'Trainee'} id="enroll-trainees">
      {plans.length === 0 && <NoPackagesNotice onLoadOfficialPackages={onLoadOfficialPackages} />}

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

      {isChild && (
        <div className="pt-1">
          <button type="button" onClick={onAddTrainee} className="btn-secondary btn-sm">
            Add sibling
          </button>
        </div>
      )}
    </FormSection>
  );
};

export default FamilyRegistrationSection;
