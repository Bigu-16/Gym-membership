import React from 'react';
import { PERSONAL_DEFAULTS } from '../../config/scheduleConfig';

const ScheduleSelectorSection = ({
  trainingType,
  scheduleMode,
  setScheduleMode,
  scheduleTemplates = [],
  schedule,
  setSchedule,
  customScheduleSlots,
  setCustomScheduleSlots
}) => {
  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m === 0 ? '00' : m}`;
  };

  return (
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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Available Pre-set Schedules</label>
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Click to select</span>
              </div>
              
              {(() => {
                const grouped = scheduleTemplates.reduce((acc, t) => {
                  const cName = t.className || 'General Classes';
                  if (!acc[cName]) acc[cName] = [];
                  acc[cName].push(t);
                  return acc;
                }, {});
                
                return (
                  <div className="space-y-8">
                    {Object.entries(grouped).map(([cName, slots]) => (
                      <div key={cName} className="space-y-4">
                        <div className="flex items-center gap-3 mb-2 ml-1">
                          <div className="w-1.5 h-4 bg-[var(--text-primary)] rounded-full opacity-60"></div>
                          <h3 className="text-xs uppercase tracking-luxury font-bold text-[var(--text-primary)] opacity-80">{cName}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {slots.map(slot => {
                            const isFull = slot.enrolled >= slot.capacity;
                            const slotText = `${cName}: ${slot.days} @ ${slot.time}`;
                            return (
                              <div 
                                key={slot.id}
                                onClick={() => !isFull && setSchedule({...schedule, slot: slotText})}
                                className={`slot-pill flex flex-col items-center justify-center py-4 px-2 relative ${schedule.slot === slotText ? 'active ring-2 ring-[var(--text-primary)]' : ''} ${isFull ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer hover:border-[var(--text-primary)]'}`}
                              >
                                <span className="text-[10px] font-bold mb-1">{slot.days}</span>
                                <span className="text-[11px] font-light opacity-80">{slot.time}</span>
                                
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
                    ))}
                  </div>
                );
              })()}
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
  );
};

export default ScheduleSelectorSection;
