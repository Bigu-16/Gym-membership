import React, { useState, useEffect } from 'react';
import { PERSONAL_DEFAULTS, PRICING_MATRIX } from '../config/scheduleConfig';
import ProgramTypeSelector from './enrollment/ProgramTypeSelector';
import FamilyRegistrationSection from './enrollment/FamilyRegistrationSection';
import ScheduleSelectorSection from './enrollment/ScheduleSelectorSection';
import PaymentDetailsSection from './enrollment/PaymentDetailsSection';
import EnrollmentSuccess from './enrollment/EnrollmentSuccess';

const EnrollmentForm = ({ onEnroll, scheduleTemplates = [] }) => {
  const [trainingType, setTrainingType] = useState('group'); // 'group' or 'personal'
  const [personalType, setPersonalType] = useState('individual'); // 'individual' or 'group'
  
  const [families, setFamilies] = useState([
    {
      id: Date.now(),
      parentInfo: { name: '', phone: '', email: '' },
      trainees: [{ name: '', age: '', gender: 'Male', medicalIssues: '', service: 'Taekwondo', frequency: '3 classes/week' }]
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

  const [payment, setPayment] = useState({ 
    amount: '', 
    method: 'Cash', 
    status: 'Paid', 
    currency: 'AED', 
    duration: '1 Month',
    durationValue: 1,
    durationUnit: 'Month'
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const addFamily = () => {
    setFamilies([...families, {
      id: Date.now(),
      parentInfo: { name: '', phone: '', email: '' },
      trainees: [{ name: '', age: '', gender: 'Male', medicalIssues: '', service: 'Personal Taekwondo Training', frequency: '3 classes/week' }]
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
      service: trainingType === 'group' ? 'Taekwondo' : 'Personal Taekwondo Training', 
      frequency: '3 classes/week' 
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

  const getStandardDurationKey = (value, unit) => {
    const v = parseInt(value, 10);
    const u = unit.toLowerCase();
    if (u.startsWith('month')) {
      if (v === 1) return '1 Month';
      if (v === 3) return '3 Months';
      if (v === 6) return '6 Months';
      if (v === 12) return '1 Year';
    } else if (u.startsWith('year')) {
      if (v === 1) return '1 Year';
    }
    return '1 Month';
  };

  const handleDurationValueChange = (val) => {
    const value = Math.max(0, parseInt(val, 10) || 0);
    setPayment(prev => {
      const unit = prev.durationUnit;
      const durationStr = `${value} ${value === 1 ? unit : unit + 's'}`;
      return {
        ...prev,
        durationValue: value,
        duration: durationStr
      };
    });
  };

  const handleDurationUnitChange = (unit) => {
    setPayment(prev => {
      const value = prev.durationValue;
      const durationStr = `${value} ${value === 1 ? unit : unit + 's'}`;
      return {
        ...prev,
        durationUnit: unit,
        duration: durationStr
      };
    });
  };

  // Calculate total amount automatically based on Pricing Matrix
  useEffect(() => {
    const standardDuration = getStandardDurationKey(payment.durationValue, payment.durationUnit);
    if (trainingType === 'personal') {
      let total = 0;
      families.forEach(family => {
        family.trainees.forEach(() => {
          total += 1000;
        });
      });
      const durationMult = standardDuration === '3 Months' ? 2.5 : standardDuration === '6 Months' ? 4.5 : standardDuration === '1 Year' ? 8 : 1;
      setPayment(prev => ({ ...prev, amount: String(Math.round(total * durationMult)) }));
    } else {
      let total = 0;
      families.forEach(family => {
        family.trainees.forEach(t => {
          const activity = t.service || 'Taekwondo';
          const freq = t.frequency || '3 classes/week';
          
          const pricing = PRICING_MATRIX[activity] || PRICING_MATRIX['Taekwondo'];
          const durationPricing = pricing[standardDuration] || pricing['1 Month'];
          const price = durationPricing[freq] || durationPricing['3 classes/week'] || 300;
          total += price;
        });
      });
      setPayment(prev => ({ ...prev, amount: String(total) }));
    }
  }, [families, payment.durationValue, payment.durationUnit, trainingType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allMembers = [];
    const allSessions = [];

    families.forEach(family => {
      family.trainees.forEach((t, tIndex) => {
        const basePhone = (family.parentInfo.phone || '').replace(/\s+/g, '');
        const traineePhone = tIndex === 0 ? basePhone : `${basePhone}-${tIndex}`;

        const val = parseInt(payment.durationValue, 10) || 0;
        const unit = payment.durationUnit.toLowerCase();
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
          medicalIssues: t.medicalIssues,
          plan: t.service,
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
          payment
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
        } else if (schedule.slot) {
          let title = t.service;
          let startTimeStr = '16:00';
          let endTimeStr = '17:00';
          
          if (schedule.slot.includes(' @ ')) {
            const parts = schedule.slot.split(' @ ');
            const headerParts = parts[0].split(': ');
            title = headerParts[0] || t.service;
            const timeStr = parts[1];
            if (timeStr && timeStr.includes(' - ')) {
              const timeParts = timeStr.split(' - ');
              const format12hTo24h = (t12) => {
                const parts12 = t12.trim().split(' ');
                const timeStrPart = parts12[0];
                const modifier = parts12[1];
                let [hours, minutes] = timeStrPart.split(':');
                if (hours === '12') hours = '00';
                if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
                return `${hours.padStart(2, '0')}:${minutes}`;
              };
              startTimeStr = format12hTo24h(timeParts[0]);
              endTimeStr = format12hTo24h(timeParts[1]);
            }
          }
          
          const startHours = parseInt(startTimeStr.split(':')[0], 10);
          const startMins = parseInt(startTimeStr.split(':')[1], 10);
          const endHours = parseInt(endTimeStr.split(':')[0], 10);
          const endMins = parseInt(endTimeStr.split(':')[1], 10);

          allSessions.push({
            id: Math.random(),
            title: title,
            trainer: 'Group Coach',
            location: 'Main Studio',
            start: new Date(new Date().setHours(startHours, startMins, 0, 0)),
            end: new Date(new Date().setHours(endHours, endMins, 0, 0)),
            status: 'upcoming',
            type: 'group',
            checklist: []
          });
        }
      });
    });

    onEnroll(allMembers, allSessions);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTrainingType('group');
      setFamilies([{
        id: Date.now(),
        parentInfo: { name: '', phone: '', email: '' },
        trainees: [{ name: '', age: '', gender: 'Male', medicalIssues: '', service: 'Taekwondo', frequency: '3 classes/week' }]
      }]);
      setPayment({
        amount: '',
        method: 'Cash',
        status: 'Paid',
        currency: 'AED',
        duration: '1 Month',
        durationValue: 1,
        durationUnit: 'Month'
      });
      setPersonalType('individual');
    }, 3000);
  };

  if (isSuccess) {
    return <EnrollmentSuccess families={families} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <ProgramTypeSelector 
        trainingType={trainingType}
        setTrainingType={setTrainingType}
        personalType={personalType}
        setPersonalType={setPersonalType}
        families={families}
        setFamilies={setFamilies}
      />

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
        payment={payment}
        setPayment={setPayment}
        handleDurationValueChange={handleDurationValueChange}
        handleDurationUnitChange={handleDurationUnitChange}
      />
    </form>
  );
};

export default EnrollmentForm;
