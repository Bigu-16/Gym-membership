import { useMemo, useState } from 'react';
import { useFeedback } from './common/Feedback';
import FormSection from './enrollment/FormSection';
import FamilyRegistrationSection, { ParentSection } from './enrollment/FamilyRegistrationSection';
import PaymentDetailsSection from './enrollment/PaymentDetailsSection';
import EnrollmentSuccess from './enrollment/EnrollmentSuccess';
import { activePlans, buildRegistration, validateRegistration } from './enrollment/enrollmentHelpers';

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

const EnrollmentForm = ({ onEnroll, scheduleTemplates = [], membershipPlans = [], onLoadOfficialPackages }) => {
  const plans = useMemo(() => activePlans(membershipPlans), [membershipPlans]);
  const plansById = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);

  const [registrant, setRegistrant] = useState('child');
  const [parent, setParent] = useState(createParent);
  const [trainees, setTrainees] = useState(() => [createTrainee()]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const { confirm } = useFeedback();

  const resetForm = () => {
    setRegistrant('child');
    setParent(createParent());
    setTrainees([createTrainee()]);
    setTermsAccepted(false);
    setPaymentMethod('cash');
    setErrors([]);
  };

  const updateTrainee = (key, changes) => {
    setTrainees((current) => current.map((t) => (t.key === key ? { ...t, ...changes } : t)));
  };

  // A new sibling starts on the same package as the trainee above.
  const addTrainee = () => {
    setTrainees((current) => [...current, createTrainee(current[current.length - 1]?.planId ?? null)]);
  };

  const removeTrainee = (key) => {
    setTrainees((current) => (current.length > 1 ? current.filter((t) => t.key !== key) : current));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const validationErrors = validateRegistration({ registrant, parent, trainees, plansById, termsAccepted });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const registration = buildRegistration({
      registrant,
      parent,
      trainees,
      paymentMethod,
      plansById
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

  const isChild = registrant === 'child';
  const step = (name) => ({ registrant: 1, parent: 2, trainees: isChild ? 3 : 2, payment: isChild ? 4 : 3 })[name];

  return (
    <form noValidate onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
      <FormSection number={step('registrant')} title="Who is registering?" id="enroll-registrant">
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-[var(--glass-border)] p-1" role="group" aria-label="Who is registering">
          {[
            ['child', 'Child (parent/guardian registers)'],
            ['adult', 'Adult (registers themself)']
          ].map(([value, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={registrant === value}
              onClick={() => setRegistrant(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                registrant === value
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </FormSection>

      {isChild && (
        <ParentSection
          number={step('parent')}
          parent={parent}
          onParentChange={(changes) => setParent((current) => ({ ...current, ...changes }))}
        />
      )}

      <FamilyRegistrationSection
        number={step('trainees')}
        registrant={registrant}
        trainees={trainees}
        onTraineeChange={updateTrainee}
        onAddTrainee={addTrainee}
        onRemoveTrainee={removeTrainee}
        plans={plans}
        plansById={plansById}
        scheduleTemplates={scheduleTemplates}
        onLoadOfficialPackages={onLoadOfficialPackages}
      />

      <PaymentDetailsSection
        number={step('payment')}
        trainees={trainees}
        plansById={plansById}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        termsAccepted={termsAccepted}
        onTermsAcceptedChange={setTermsAccepted}
        onAmountChange={(key, amount) => updateTrainee(key, { amount })}
        onClear={async () => {
          const hasInput = parent.name || parent.phone || trainees.some((t) => t.name || t.age || t.phone);
          if (!hasInput || await confirm({
            title: 'Clear the form?',
            message: 'Everything typed into this registration will be removed.',
            confirmLabel: 'Clear form',
            tone: 'danger'
          })) resetForm();
        }}
        errors={errors}
        submitting={submitting}
      />
    </form>
  );
};

export default EnrollmentForm;
