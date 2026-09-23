import React from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { PERSONAL_DEFAULTS, ACTIVITIES } from '../../config/scheduleConfig';

const FamilyRegistrationSection = ({
  trainingType,
  personalType,
  families,
  addFamily,
  removeFamily,
  addTrainee,
  removeTrainee,
  handleParentChange,
  handleTraineeChange
}) => {
  return (
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
                  pattern="^[a-zA-Z\s\-']+$"
                  title="Names should only contain letters, spaces, hyphens, and apostrophes."
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
                    <div className="flex-grow flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Kid's Full Name</label>
                          <input 
                            required
                            type="text" 
                            pattern="^[a-zA-Z\s\-']+$"
                            title="Names should only contain letters, spaces, hyphens, and apostrophes."
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
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Gender</label>
                          <div className="relative">
                            <select 
                              value={trainee.gender}
                              onChange={(e) => handleTraineeChange(fIndex, tIndex, 'gender', e.target.value)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-8"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {trainingType === 'group' ? (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Activity / Sport</label>
                              <div className="relative">
                                <select 
                                  value={trainee.service || 'Taekwondo'}
                                  onChange={(e) => handleTraineeChange(fIndex, tIndex, 'service', e.target.value)}
                                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-8"
                                >
                                  {ACTIVITIES.map(act => (
                                    <option key={act} value={act}>{act}</option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Classes per Week</label>
                              <div className="relative">
                                <select 
                                  value={trainee.frequency || '3 classes/week'}
                                  onChange={(e) => handleTraineeChange(fIndex, tIndex, 'frequency', e.target.value)}
                                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all appearance-none cursor-pointer pr-8"
                                >
                                  <option value="2 classes/week">2 Classes / Week</option>
                                  <option value="3 classes/week">3 Classes / Week</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Personal Training Program</label>
                            <input 
                              disabled
                              type="text"
                              value={trainee.service || 'Personal Training'}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm opacity-60 cursor-not-allowed"
                            />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Medical Issues (Optional)</label>
                          <input 
                            type="text" 
                            value={trainee.medicalIssues}
                            onChange={(e) => handleTraineeChange(fIndex, tIndex, 'medicalIssues', e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                            placeholder="e.g. Asthma, Allergies, or None"
                          />
                        </div>
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
  );
};

export default FamilyRegistrationSection;
