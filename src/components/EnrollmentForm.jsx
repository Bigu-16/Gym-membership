import { useMemo, useState } from 'react';
import { ACTIVITIES, PACKAGE_TEMPLATES, PERSONAL_DEFAULTS, membershipPlanToPackageTemplate } from '../config/scheduleConfig';
import ProgramTypeSelector from './enrollment/ProgramTypeSelector';
import PackageTemplateSelector from './enrollment/PackageTemplateSelector';
import FamilyRegistrationSection from './enrollment/FamilyRegistrationSection';
import ScheduleSelectorSection from './enrollment/ScheduleSelectorSection';
import PaymentDetailsSection from './enrollment/PaymentDetailsSection';
import EnrollmentSuccess from './enrollment/EnrollmentSuccess';

const DEFAULT_PACKAGE = PACKAGE_TEMPLATES.find((item) => item.id === 'taekwondo-1m-3x');

const createPackageTrainee = (packageTemplate = DEFAULT_PACKAGE) => ({
  name: '',
  age: '',
  gender: 'Male',
  emiratesId: '',
  medicalIssues: '',
  service: packageTemplate.program,
  frequency: `${packageTemplate.classesPerWeek} classes/week`,
  packageTemplateId: packageTemplate.id
});

const createPayment = () => ({
  amount: '',
  method: 'Cash',
  status: 'Paid',
  currency: 'AED',
  duration: '1 Month',
  durationValue: 1,
  durationUnit: 'Month'
});

const EnrollmentForm = ({ onEnroll, scheduleTemplates = [], membershipPlans = [] }) => {
  const packageTemplates = useMemo(() => {
    const configured = membershipPlans
      .map(membershipPlanToPackageTemplate)
      .filter((plan) => plan.isActive && ACTIVITIES.includes(plan.program));
    return configured.length > 0 ? configured : PACKAGE_TEMPLATES;
  }, [membershipPlans]);

  const [trainingType, setTrainingType] = useState('group'); // 'group' or 'personal'
  const [personalType, setPersonalType] = useState('individual'); // 'individual' or 'group'
  const [selectedPackageId, setSelectedPackageId] = useState(DEFAULT_PACKAGE.id);
  
  const [families, setFamilies] = useState([
    {
      id: 'family-1',
      parentInfo: { name: '', phone: '', email: '' },
      trainees: [createPackageTrainee()]
    }
  ]);

  const [schedule, setSchedule] = useState({
    slot: '',
    daysPerWeek: PERSONAL_DEFAULTS.daysPerWeek,
    duration: PERSONAL_DEFAULTS.duration,
    location: ''
  });
  
  const [scheduleMode, setScheduleMode] = useState('preset'); // 'preset' or 'custom'
  const [customScheduleSlots, setCustomScheduleSlots] = useState([{ day: 'Monday', time: '08:00' }]);

  const [payment, setPayment] = useState(createPayment);
  const [isSuccess, setIsSuccess] = useState(false);

  const effectivePackageId = packageTemplates.some((item) => item.id === selectedPackageId)
    ? selectedPackageId
    : packageTemplates[0]?.id ?? DEFAULT_PACKAGE.id;
  const selectedPackage = packageTemplates.find((item) => item.id === effectivePackageId) || DEFAULT_PACKAGE;
  const traineeCount = families.reduce((count, family) => count + family.trainees.length, 0);
  const resolvedPayment = trainingType === 'group'
    ? {
        ...payment,
        amount: String(selectedPackage.price * traineeCount),
        currency: selectedPackage.currency,
        duration: `${selectedPackage.durationMonths} ${selectedPackage.durationMonths === 1 ? 'Month' : 'Months'}`,
        durationValue: selectedPackage.durationMonths,
        durationUnit: 'Month',
        packageTemplateId: selectedPackage.id
      }
    : payment;

  const clearForm = () => {
    setFamilies([
      {
        id: 'family-1',
        parentInfo: { name: '', phone: '', email: '' },
        trainees: [createPackageTrainee()]
      }
    ]);
    setSchedule({
      slot: '',
      daysPerWeek: PERSONAL_DEFAULTS.daysPerWeek,
      duration: PERSONAL_DEFAULTS.duration,
      location: ''
    });
    setSelectedPackageId(DEFAULT_PACKAGE.id);
    setPayment(createPayment());
  };

  const addFamily = () => {
    setFamilies([...families, {
      id: `family-${families.length + 1}`,
      parentInfo: { name: '', phone: '', email: '' },
      trainees: [trainingType === 'group'
        ? createPackageTrainee(selectedPackage)
        : { ...createPackageTrainee(), service: 'Personal Taekwondo Training' }]
    }]);
  };

  const removeFamily = (familyId) => {
    if (families.length > 1) {
      setFamilies(families.filter(f => f.id !== familyId));
    }
  };

  const addTrainee = (familyIndex) => {
    const newFamilies = [...families];
    newFamilies[familyIndex].trainees.push({ 
      name: '', 
      age: '', 
      gender: 'Male', 
      medicalIssues: '', 
      ...(trainingType === 'group'
        ? createPackageTrainee(selectedPackage)
        : { ...createPackageTrainee(), service: 'Personal Taekwondo Training' })
    });
    setFamilies(newFamilies);
  };

  const removeTrainee = (familyIndex, traineeIndex) => {
    const newFamilies = [...families];
    if (newFamilies[familyIndex].trainees.length > 1) {
      newFamilies[familyIndex].trainees.splice(traineeIndex, 1);
      setFamilies(newFamilies);
    }
  };

  const handleParentChange = (familyIndex, field, value) => {
    const newFamilies = [...families];
    newFamilies[familyIndex].parentInfo[field] = value;
    setFamilies(newFamilies);
  };

  const handleTraineeChange = (familyIndex, traineeIndex, field, value) => {
    const newFamilies = [...families];
    newFamilies[familyIndex].trainees[traineeIndex][field] = value;
    setFamilies(newFamilies);
  };

  const handleSelectPackage = (packageTemplate) => {
    setSelectedPackageId(packageTemplate.id);
    setFamilies((currentFamilies) => currentFamilies.map((family) => ({
      ...family,
      trainees: family.trainees.map((trainee) => ({
        ...trainee,
        service: packageTemplate.program,
        frequency: `${packageTemplate.classesPerWeek} classes/week`,
        packageTemplateId: packageTemplate.id
      }))
    })));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allMembers = [];
    const allSessions = [];

    families.forEach(family => {
      family.trainees.forEach((t, tIndex) => {
        const basePhone = (family.parentInfo.phone || '').replace(/\s+/g, '');
        const traineePhone = tIndex === 0 ? basePhone : `${basePhone}-${tIndex}`;

        const val = parseInt(resolvedPayment.durationValue, 10) || 1;
        const unit = resolvedPayment.durationUnit.toLowerCase();
        let expDate = new Date();
        if (unit.startsWith('day')) {
          expDate.setDate(expDate.getDate() + val);
        } else if (unit.startsWith('week')) {
          expDate.setDate(expDate.getDate() + val * 7);
        } else if (unit.startsWith('month')) {
          expDate.setMonth(expDate.getMonth() + val);
        } else if (unit.startsWith('year')) {
          expDate.setFullYear(expDate.getFullYear() + val);
        } else {
          expDate.setMonth(expDate.getMonth() + 1);
        }
        const expiryDateStr = expDate.toISOString();

        const newMember = {
          id: Math.random(),
          name: t.name,
          phone: traineePhone,
          age: t.age,
          gender: t.gender,
          emiratesId: t.emiratesId || '',
          medicalIssues: t.medicalIssues,
          plan: trainingType === 'group'
            ? `${selectedPackage.program} ${selectedPackage.durationMonths} Month - ${selectedPackage.classesPerWeek} Classes`
            : t.service,
          planId: trainingType === 'group' ? selectedPackage.planId : undefined,
          expiryDate: expiryDateStr,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random&color=fff`,
          parentName: family.parentInfo.name,
          parentPhone: family.parentInfo.phone,
          parentEmail: family.parentInfo.email,
          trainingType,
          schedule: {
            ...schedule,
            location: trainingType === 'personal' ? schedule.location : 'Gym Facility'
          },
          payment: resolvedPayment
        };

        allMembers.push(newMember);

        if (trainingType === 'personal') {
          allSessions.push({
            id: Math.random(),
            title: `PT: ${t.name}`,
            trainer: 'Assigned Trainer',
            location: schedule.location || 'VIP Zone',
            start: new Date(new Date().setHours(14, 0, 0, 0)),
            end: new Date(new Date().setHours(15, 30, 0, 0)),
            status: 'upcoming',
            type: 'personal',
            checklist: [
              { id: 1, text: 'Initial assessment', checked: false },
              { id: 2, text: 'Goal setting', checked: false }
            ]
          });
        }
      });
    });

    onEnroll(allMembers, allSessions);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTrainingType('group');
      clearForm();
      setPersonalType('individual');
    }, 3000);
  };

  if (isSuccess) {
    return <EnrollmentSuccess families={families} />;
  }

  return (
    <div className="space-y-6">
      {/* Official Template & Form Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 glass-card rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center font-bold text-lg">
            🥋
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-luxury text-[var(--text-primary)]">
              N & T Taekwondo & Karate Center
            </h3>
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">
              Photo-verified package enrollment
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearForm}
            className="px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] uppercase tracking-luxury font-bold transition-all border border-[var(--glass-border)] active:scale-95 flex items-center gap-1.5"
          >
            🔄 Reset Form
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12 max-w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <ProgramTypeSelector 
          trainingType={trainingType}
          setTrainingType={setTrainingType}
          personalType={personalType}
          setPersonalType={setPersonalType}
          families={families}
          setFamilies={setFamilies}
          selectedPackage={selectedPackage}
        />

        {trainingType === 'group' && (
          <PackageTemplateSelector
            packageTemplates={packageTemplates}
            selectedPackageId={effectivePackageId}
            onSelect={handleSelectPackage}
          />
        )}

        <FamilyRegistrationSection 
          trainingType={trainingType}
          personalType={personalType}
          families={families}
          addFamily={addFamily}
          removeFamily={removeFamily}
          addTrainee={addTrainee}
          removeTrainee={removeTrainee}
          handleParentChange={handleParentChange}
          handleTraineeChange={handleTraineeChange}
          selectedPackage={selectedPackage}
        />

        <ScheduleSelectorSection 
          trainingType={trainingType}
          scheduleMode={scheduleMode}
          setScheduleMode={setScheduleMode}
          scheduleTemplates={scheduleTemplates}
          schedule={schedule}
          setSchedule={setSchedule}
          customScheduleSlots={customScheduleSlots}
          setCustomScheduleSlots={setCustomScheduleSlots}
        />

        <PaymentDetailsSection 
          payment={resolvedPayment}
          setPayment={setPayment}
          trainingType={trainingType}
          selectedPackage={selectedPackage}
          participantCount={traineeCount}
        />
      </form>
    </div>
  );
};

export default EnrollmentForm;
