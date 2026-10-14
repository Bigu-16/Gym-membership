import { useMemo, useState } from 'react';
import { PERSONAL_DEFAULTS, PERSONAL_TRAINING_PROGRAMS } from '../config/scheduleConfig';
import { toDateKey } from '../utils/classSessions';
import ProgramTypeSelector from './enrollment/ProgramTypeSelector';
import PackageTemplateSelector from './enrollment/PackageTemplateSelector';
import FamilyRegistrationSection from './enrollment/FamilyRegistrationSection';
import ScheduleSelectorSection from './enrollment/ScheduleSelectorSection';
import PaymentDetailsSection from './enrollment/PaymentDetailsSection';
import EnrollmentSuccess from './enrollment/EnrollmentSuccess';
import {
  activePlans,
  buildPersonalSessions,
  buildRegistration,
  validatePersonalSchedule,
  validateRegistration
} from './enrollment/enrollmentHelpers';

let nextTraineeKey = 1;

const createTrainee = (planId = null) => ({
  key: nextTraineeKey++,
  name: '',
  age: '',
  gender: 'Male',
  phone: '',
  whatsappSameAsMobile: true,
  whatsappNumber: '',
  emiratesId: '',
  email: '',
  hasMedical: false,
  medicalIssues: '',
  planId,
  templateIds: [],
  amount: null // null = use the package price
});

const createParent = () => ({ name: '', phone: '', email: '' });

const createPersonalSchedule = () => ({
  program: PERSONAL_TRAINING_PROGRAMS[0],
  trainer: '',
  startDate: toDateKey(new Date()),
  startTime: PERSONAL_DEFAULTS.startTime,
  duration: PERSONAL_DEFAULTS.duration,
  weeks: PERSONAL_DEFAULTS.weeks,
  days: [...PERSONAL_DEFAULTS.days]
});

const EnrollmentForm = ({ onEnroll, scheduleTemplates = [], membershipPlans = [], onLoadOfficialPackages }) => {
  const plans = useMemo(() => activePlans(membershipPlans), [membershipPlans]);
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);

  const [trainingType, setTrainingType] = useState('group');
  const [registrant, setRegistrant] = useState('child');
  const [parent, setParent] = useState(createParent);
  const [trainees, setTrainees] = useState(() => [createTrainee()]);
  const [personalSchedule, setPersonalSchedule] = useState(createPersonalSchedule);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  // The package highlighted in the cards: shared by every trainee, if they agree.
  const sharedPlanId = trainees.every((t) => t.planId === trainees[0].planId) ? trainees[0].planId : null;

  const resetForm = () => {
    setTrainingType('group');
    setRegistrant('child');
    setParent(createParent());
    setTrainees([createTrainee()]);
    setPersonalSchedule(createPersonalSchedule());
    setPaymentMethod('cash');
    setErrors([]);
  };

  const updateTrainee = (key, changes) => {
    setTrainees((current) => current.map((t) => (t.key === key ? { ...t, ...changes } : t)));
  };

  const applyPlanToAll = (plan) => {
    setTrainees((current) => current.map((t) => ({ ...t, planId: plan.id, amount: null })));
  };

  const addTrainee = () => {
    setTrainees((current) => [...current, createTrainee(sharedPlanId)]);
  };

  const removeTrainee = (key) => {
    setTrainees((current) => (current.length > 1 ? current.filter((t) => t.key !== key) : current));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const validationErrors = validateRegistration({ registrant, parent, trainees, trainingType, plansById });
    if (trainingType === 'personal') validationErrors.push(...validatePersonalSchedule(personalSchedule));
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const registration = buildRegistration({
      registrant,
      parent,
      trainees,
      trainingType,
      paymentMethod,
      plansById,
      personalSessions: trainingType === 'personal' ? buildPersonalSessions(personalSchedule) : []
    });

    setSubmitting(true);
    setErrors([]);
    try {
      const result = await onEnroll(registration);
      setSuccess({
        members: result?.members?.length ? result.members : registration.trainees,
        warnings: result?.warnings || [],
        parentName: registration.parent?.name || null
      });
      resetForm();
    } catch (err) {
      setErrors([err?.message || 'Registration failed. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <EnrollmentSuccess
        members={success.members}
        parentName={success.parentName}
        warnings={success.warnings}
        onDone={() => setSuccess(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 glass-card rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center font-bold text-lg">
            🥋
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-luxury text-[var(--text-primary)]">
              N & T Taekwondo & Karate Center
            </h3>
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">New member registration</p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] uppercase tracking-luxury font-bold transition-all border border-[var(--glass-border)] active:scale-95"
        >
          Reset Form
        </button>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-12 max-w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <ProgramTypeSelector
          trainingType={trainingType}
          onTrainingTypeChange={setTrainingType}
          registrant={registrant}
          onRegistrantChange={setRegistrant}
        />

        {trainingType === 'group' && (
          <PackageTemplateSelector
            plans={plans}
            selectedPlanId={sharedPlanId}
            onSelect={applyPlanToAll}
            onLoadOfficialPackages={onLoadOfficialPackages}
          />
        )}

        <FamilyRegistrationSection
          registrant={registrant}
          trainingType={trainingType}
          parent={parent}
          onParentChange={(changes) => setParent((current) => ({ ...current, ...changes }))}
          trainees={trainees}
          onTraineeChange={updateTrainee}
          onAddTrainee={addTrainee}
          onRemoveTrainee={removeTrainee}
          plans={plans}
          plansById={plansById}
          scheduleTemplates={scheduleTemplates}
        />

        {trainingType === 'personal' && (
          <ScheduleSelectorSection
            schedule={personalSchedule}
            onChange={(changes) => setPersonalSchedule((current) => ({ ...current, ...changes }))}
          />
        )}

        <PaymentDetailsSection
          trainees={trainees}
          trainingType={trainingType}
          plansById={plansById}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onAmountChange={(key, amount) => updateTrainee(key, { amount })}
          errors={errors}
          submitting={submitting}
        />
      </form>
    </div>
  );
};

export default EnrollmentForm;
