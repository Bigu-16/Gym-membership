import React, { useState } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { GROUP_SCHEDULE_SLOTS, PERSONAL_DEFAULTS } from '../config/scheduleConfig';

const EnrollmentForm = ({ onEnroll }) => {
  const [trainingType, setTrainingType] = useState('group'); // 'group' or 'personal'
  const [personalType, setPersonalType] = useState('individual'); // 'individual' or 'group'
  
  const [families, setFamilies] = useState([
    {
      id: Date.now(),
      parentInfo: { name: '', phone: '', email: '' },
      trainees: [{ name: '', age: '', service: 'Group Taekwondo' }]
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

  const [payment, setPayment] = useState({ amount: '', method: 'Cash', status: 'Paid', currency: 'AED', duration: '1 Month' });
  const [isSuccess, setIsSuccess] = useState(false);

  const addFamily = () => {
    setFamilies([...families, {
      id: Date.now(),
      parentInfo: { name: '', phone: '', email: '' },
      trainees: [{ name: '', age: '', service: 'Personal Taekwondo Training' }]
    }]);
  };

  const removeFamily = (familyId) => {
    if (families.length > 1) {
      setFamilies(families.filter(f => f.id !== familyId));
    }
  };

  const addTrainee = (familyIndex) => {
    const newFamilies = [...families];
    newFamilies[familyIndex].trainees.push({ name: '', age: '', service: trainingType === 'group' ? 'Group Taekwondo' : 'Personal Taekwondo Training' });
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

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m === 0 ? '00' : m}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allMembers = [];
    const allSessions = [];
    
    families.forEach(family => {
      family.trainees.forEach(t => {
        const monthsToAdd = 
          payment.duration === '3 Months' ? 3 :
          payment.duration === '6 Months' ? 6 :
          payment.duration === '1 Year' ? 12 : 1;

        const newMember = {
          id: Math.random(),
          name: t.name,
          plan: t.service,
          expiryDate: new Date(new Date().setMonth(new Date().getMonth() + monthsToAdd)).toISOString(),
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random&color=fff`,
          parentName: family.parentInfo.name,
          parentPhone: family.parentInfo.phone,
          trainingType,
          schedule: {
            ...schedule,
            location: trainingType === 'personal' ? schedule.location : 'Gym Facility'
          },
          payment
        };

        allMembers.push(newMember);

        // Create a schedule entry
        if (trainingType === 'personal') {
          // For personal training, create a specific session for this person
          allSessions.push({
            id: Math.random(),
            title: `PT: ${t.name}`,
            trainer: 'Assigned Trainer',
            location: schedule.location || 'VIP Zone',
            start: new Date(new Date().setHours(14, 0, 0, 0)), // Default to 2 PM today for demo
            end: new Date(new Date().setHours(15, 30, 0, 0)),
            status: 'upcoming',
            type: 'personal',
            checklist: [
              { id: 1, text: 'Initial assessment', checked: false },
              { id: 2, text: 'Goal setting', checked: false }
            ]
          });
        } else if (schedule.slot) {
          // For group training, we could add them to an existing slot or create a session if it doesn't exist
          // For this demo, we'll create a session that matches their selected slot
          allSessions.push({
            id: Math.random(),
            title: t.service,
            trainer: 'Group Coach',
            location: 'Main Studio',
            start: new Date(new Date().setHours(16, 0, 0, 0)), // Default to 4 PM today for demo
            end: new Date(new Date().setHours(17, 30, 0, 0)),
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
      setPersonalType('individual');
      setFamilies([{
        id: Date.now(),
        parentInfo: { name: '', phone: '', email: '' },
        trainees: [{ name: '', age: '', service: 'Group Taekwondo' }]
      }]);
      setPayment({ amount: '', method: 'Cash', status: 'Paid', currency: 'AED', duration: '1 Month' });
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] glass-card p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 mb-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-light uppercase tracking-luxury mb-4">Enrollment Successful</h2>
        <p className="text-[var(--text-secondary)] text-lg max-w-md">
          The registration for <span className="text-[var(--text-primary)] font-bold">{families[0].parentInfo.name}'s</span> family has been processed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Training Type Selection */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xs uppercase tracking-luxury font-bold">Select Training Program</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            type="button"
            onClick={() => {
              setTrainingType('group');
              setFamilies([families[0]]); // Reset to one family for group
            }}
            className={`training-type-btn ${trainingType === 'group' ? 'active' : ''}`}
          >
            <div className="icon-container">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Group Training</h3>
              <p className="text-[10px] opacity-60">Standard classes at the gym facility</p>
            </div>
          </button>

          <div className="space-y-4">
            <button 
              type="button"
              onClick={() => setTrainingType('personal')}
              className={`training-type-btn w-full ${trainingType === 'personal' ? 'active' : ''}`}
            >
              <div className="icon-container">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Personal Training</h3>
                <p className="text-[10px] opacity-60">Tailored sessions and flexible timing</p>
              </div>
            </button>
            
            {trainingType === 'personal' && (
              <div className="flex gap-2 p-1 glass-card rounded-xl">
                <button 
                  type="button"
                  onClick={() => {
                    setPersonalType('individual');
                    setFamilies([families[0]]);
                  }}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-luxury font-bold rounded-lg transition-all ${personalType === 'individual' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
                >
                  Individual
                </button>
                <button 
                  type="button"
                  onClick={() => setPersonalType('group')}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-luxury font-bold rounded-lg transition-all ${personalType === 'group' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
                >
                  Group (Multi-Family)
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Families Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-xs uppercase tracking-luxury font-bold">
              {trainingType === 'personal' && personalType === 'group' ? 'Registered Families' : 'Registration Details'}
            </h2>
          </div>
          {trainingType === 'personal' && personalType === 'group' && (
            <button 
              type="button"
              onClick={addFamily}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Family
            </button>
          )}
        </div>

        <div className="space-y-12">
          {families.map((family, fIndex) => (
            <div key={family.id} className="family-group relative animate-in fade-in slide-in-from-left-8 duration-500">
              <span className="family-badge">Family #{fIndex + 1}</span>
              
              {/* Parent Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Parent Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={family.parentInfo.name}
                    onChange={(e) => handleParentChange(fIndex, 'name', e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Phone Number</label>
                  <div className="luxury-phone-input">
                    <PhoneInput
                      defaultCountry="ae"
                      value={family.parentInfo.phone}
                      onChange={(phone) => handleParentChange(fIndex, 'phone', phone)}
                      inputClassName="!w-full !bg-[var(--bg-primary)] !border-[var(--glass-border)] !rounded-r-xl !h-[46px] !text-sm !focus:ring-2 !focus:ring-[var(--text-primary)]/20 !transition-all !text-[var(--text-primary)]"
                      countrySelectorStyleProps={{
                        buttonClassName: "!bg-transparent !border-[var(--glass-border)] !rounded-l-xl !px-3",
                        dropdownClassName: "!bg-[var(--bg-secondary)] !text-[var(--text-primary)] !border-[var(--glass-border)] !rounded-xl !shadow-luxury",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2 flex flex-row items-end gap-4">
                  <div className="flex-grow">
                    <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={family.parentInfo.email}
                      onChange={(e) => handleParentChange(fIndex, 'email', e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  {families.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeFamily(family.id)}
                      className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Trainees for this family */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--text-secondary)]">Kids / Trainees</h4>
                  <button 
                    type="button"
                    onClick={() => addTrainee(fIndex)}
                    className="text-[9px] uppercase tracking-luxury font-bold text-[var(--text-primary)] hover:opacity-60 transition-opacity"
                  >
                    + Add Kid
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {family.trainees.map((trainee, tIndex) => (
                    <div key={tIndex} className="glass-card p-5 flex gap-4 items-center group relative">
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Kid's Full Name</label>
                          <input 
                            required
                            type="text" 
                            value={trainee.name}
                            onChange={(e) => handleTraineeChange(fIndex, tIndex, 'name', e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                            placeholder="e.g. Leo Smith"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Age</label>
                          <input 
                            required
                            type="number" 
                            min={PERSONAL_DEFAULTS.minAge}
                            value={trainee.age}
                            onChange={(e) => handleTraineeChange(fIndex, tIndex, 'age', e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                            placeholder="Age"
                          />
                        </div>
                      </div>
                      {family.trainees.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeTrainee(fIndex, tIndex)}
                          className="p-2 rounded-lg text-rose-500/40 group-hover:text-rose-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule Selection */}
      <section className="glass-card p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xs uppercase tracking-luxury font-bold">Training Schedule</h2>
        </div>

        {trainingType === 'group' ? (
          <div className="space-y-8">
            <div className="flex gap-4 p-1 glass-card rounded-xl max-w-sm">
              <button 
                type="button"
                onClick={() => setScheduleMode('preset')}
                className={`flex-1 py-2.5 text-[10px] uppercase tracking-luxury font-bold rounded-lg transition-all ${scheduleMode === 'preset' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5'}`}
              >
                Pre-set Schedule
              </button>
              <button 
                type="button"
                onClick={() => setScheduleMode('custom')}
                className={`flex-1 py-2.5 text-[10px] uppercase tracking-luxury font-bold rounded-lg transition-all ${scheduleMode === 'custom' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5'}`}
              >
                Custom Schedule
              </button>
            </div>

            {scheduleMode === 'preset' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Available Pre-set Schedules</label>
                  <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Click to select</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GROUP_SCHEDULE_SLOTS.map(slot => {
                    const isFull = slot.enrolled >= slot.capacity;
                    const slotText = `${slot.days} @ ${slot.time}`;
                    return (
                      <div 
                        key={slot.id}
                        onClick={() => !isFull && setSchedule({...schedule, slot: slotText})}
                        className={`slot-pill flex flex-col items-center justify-center py-4 px-2 relative ${schedule.slot === slotText ? 'active ring-2 ring-[var(--text-primary)]' : ''} ${isFull ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer hover:border-[var(--text-primary)]'}`}
                      >
                        <span className="text-[10px] font-bold mb-1">{slot.days}</span>
                        <span className="text-[12px] font-light opacity-80">{slot.time}</span>
                        
                        <div className="mt-3 flex items-center gap-2 w-full px-4">
                          <div className="flex-grow h-1 bg-[var(--glass-border)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-1000" 
                              style={{ width: `${(slot.enrolled / slot.capacity) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[8px] font-bold opacity-60">
                            {slot.enrolled}/{slot.capacity}
                          </span>
                        </div>
                        {isFull && <span className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/80 text-rose-500 text-[8px] font-bold tracking-widest uppercase">Full</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Build Custom Schedule</label>
                  <button 
                    type="button" 
                    onClick={() => setCustomScheduleSlots([...customScheduleSlots, { day: 'Monday', time: '12:00' }])}
                    className="text-[9px] uppercase tracking-widest text-[var(--text-primary)] hover:opacity-70 font-bold flex items-center gap-1"
                  >
                    + Add Day
                  </button>
                </div>
                
                <div className="space-y-4">
                  {customScheduleSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 glass-card rounded-2xl relative group border border-[var(--glass-border)] hover:border-[var(--text-primary)]/30 transition-all">
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Day of Week</label>
                          <select 
                            value={slot.day}
                            onChange={(e) => {
                              const newSlots = [...customScheduleSlots];
                              newSlots[index].day = e.target.value;
                              setCustomScheduleSlots(newSlots);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer"
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Time</label>
                          <input 
                            type="time" 
                            value={slot.time}
                            onChange={(e) => {
                              const newSlots = [...customScheduleSlots];
                              newSlots[index].time = e.target.value;
                              setCustomScheduleSlots(newSlots);
                            }}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all cursor-pointer"
                          />
                        </div>
                      </div>
                      {customScheduleSlots.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const newSlots = customScheduleSlots.filter((_, i) => i !== index);
                            setCustomScheduleSlots(newSlots);
                          }}
                          className="p-2 rounded-lg text-rose-500/40 hover:bg-rose-500 hover:text-white transition-all self-end mb-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Days Per Week</label>
                  <span className="text-[12px] font-bold text-[var(--text-primary)]">{schedule.daysPerWeek} Days</span>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min={PERSONAL_DEFAULTS.minDays}
                    max={PERSONAL_DEFAULTS.maxDays}
                    step="1"
                    value={schedule.daysPerWeek}
                    onChange={(e) => setSchedule({...schedule, daysPerWeek: e.target.value})}
                    className="flex-grow accent-[var(--text-primary)] cursor-pointer"
                  />
                  <input 
                    type="number"
                    min={PERSONAL_DEFAULTS.minDays}
                    max={PERSONAL_DEFAULTS.maxDays}
                    value={schedule.daysPerWeek}
                    onChange={(e) => setSchedule({...schedule, daysPerWeek: e.target.value})}
                    className="w-16 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-2 py-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20"
                  />
                </div>
                <div className="flex justify-between text-[8px] uppercase tracking-widest text-[var(--text-secondary)] opacity-40 px-1">
                  <span>Min: {PERSONAL_DEFAULTS.minDays}</span>
                  <span>Max: {PERSONAL_DEFAULTS.maxDays}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Session Duration (Hours)</label>
                  <span className="text-[12px] font-bold text-[var(--text-primary)]">{formatDuration(schedule.duration)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min={PERSONAL_DEFAULTS.minDuration}
                    max={PERSONAL_DEFAULTS.maxDuration}
                    step="0.5"
                    value={schedule.duration}
                    onChange={(e) => setSchedule({...schedule, duration: parseFloat(e.target.value)})}
                    className="flex-grow accent-[var(--text-primary)] cursor-pointer"
                  />
                  <input 
                    type="number"
                    min={PERSONAL_DEFAULTS.minDuration}
                    max={PERSONAL_DEFAULTS.maxDuration}
                    step="0.5"
                    value={schedule.duration}
                    onChange={(e) => setSchedule({...schedule, duration: parseFloat(e.target.value)})}
                    className="w-16 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-2 py-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20"
                  />
                </div>
                <div className="flex justify-between text-[8px] uppercase tracking-widest text-[var(--text-secondary)] opacity-40 px-1">
                  <span>Min: {formatDuration(PERSONAL_DEFAULTS.minDuration)}</span>
                  <span>Max: {formatDuration(PERSONAL_DEFAULTS.maxDuration)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Training Location / Preferred Area</label>
              </div>
              <input 
                required
                type="text" 
                value={schedule.location}
                onChange={(e) => setSchedule({...schedule, location: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                placeholder="e.g. Member's Villa, Specific Park, or Gym Facility"
              />
            </div>
          </div>
        )}
      </section>

      {/* Payment */}
      <section className="glass-card p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-xs uppercase tracking-luxury font-bold">Payment Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Duration</label>
            <div className="relative">
              <select 
                value={payment.duration}
                onChange={(e) => setPayment({...payment, duration: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10"
              >
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>1 Year</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Currency</label>
            <div className="relative">
              <select 
                value={payment.currency}
                onChange={(e) => setPayment({...payment, currency: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10"
              >
                <option>AED</option>
                <option>USD</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Total Amount</label>
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-secondary)]">
                  {payment.currency === 'AED' ? 'AED' : '$'}
                </span>
                <input 
                  required
                  type="text" 
                  list="amount-presets"
                  value={payment.amount}
                  onChange={(e) => setPayment({...payment, amount: e.target.value})}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl pl-12 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none"
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] opacity-40 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <datalist id="amount-presets">
                  <option value="500" />
                  <option value="1000" />
                  <option value="1500" />
                  <option value="2000" />
                  <option value="2500" />
                  <option value="3000" />
                </datalist>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Method</label>
            <div className="relative">
              <select 
                value={payment.method}
                onChange={(e) => setPayment({...payment, method: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10"
              >
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Bank Transfer</option>
                <option>Mobile Pay</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Initial Status</label>
            <div className="relative">
              <select 
                value={payment.status}
                onChange={(e) => setPayment({...payment, status: e.target.value})}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-10"
              >
                <option>Paid</option>
                <option>Partial</option>
                <option>Pending</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button 
          type="submit"
          className="group relative px-12 py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
        >
          <span className="relative z-10 text-xs uppercase tracking-luxury font-bold">Confirm Enrollment</span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </button>
      </div>
    </form>
  );
};

export default EnrollmentForm;
