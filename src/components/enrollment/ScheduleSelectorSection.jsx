import { OPENING_HOURS, PERSONAL_DEFAULTS, PERSONAL_TRAINING_PROGRAMS } from '../../config/scheduleConfig';
import { WEEKDAYS, buildPersonalSessions } from './enrollmentHelpers';
import { inputClass, labelClass, sectionTitleClass } from './fieldStyles';

/** Personal-training timetable: real dated sessions inside opening hours. */
const ScheduleSelectorSection = ({ schedule, onChange }) => {
  const set = (field) => (event) => onChange({ [field]: event.target.value });
  const toggleDay = (day) =>
    onChange({ days: schedule.days.includes(day) ? schedule.days.filter((d) => d !== day) : [...schedule.days, day] });
  const preview = buildPersonalSessions(schedule);

  return (
    <section className="glass-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className={sectionTitleClass}>Personal Training Schedule</h2>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Opening hours 4:00 PM – 9:00 PM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="pt-program" className={labelClass}>Personal training program</label>
          <select id="pt-program" value={schedule.program} onChange={set('program')} className={inputClass}>
            {PERSONAL_TRAINING_PROGRAMS.map((program) => (
              <option key={program} value={program}>{program}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pt-trainer" className={labelClass}>Trainer</label>
          <input id="pt-trainer" type="text" value={schedule.trainer} onChange={set('trainer')} className={inputClass} placeholder="Coach name" />
        </div>
        <div>
          <label htmlFor="pt-start-date" className={labelClass}>First session date</label>
          <input id="pt-start-date" type="date" value={schedule.startDate} onChange={set('startDate')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="pt-start-time" className={labelClass}>Start time</label>
          <input
            id="pt-start-time"
            type="time"
            min={OPENING_HOURS.open}
            max={OPENING_HOURS.close}
            step={1800}
            value={schedule.startTime}
            onChange={set('startTime')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="pt-duration" className={labelClass}>Session length (hours)</label>
          <input
            id="pt-duration"
            type="number"
            min={PERSONAL_DEFAULTS.minDuration}
            max={PERSONAL_DEFAULTS.maxDuration}
            step={0.5}
            value={schedule.duration}
            onChange={set('duration')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="pt-weeks" className={labelClass}>Number of weeks</label>
          <input
            id="pt-weeks"
            type="number"
            min={1}
            max={PERSONAL_DEFAULTS.maxWeeks}
            value={schedule.weeks}
            onChange={set('weeks')}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className={labelClass}>Training days</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <label
              key={day}
              className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                schedule.days.includes(day)
                  ? 'border-emerald-500/60 bg-emerald-500/10 font-bold'
                  : 'border-[var(--glass-border)]'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={schedule.days.includes(day)} onChange={() => toggleDay(day)} />
              {day}
            </label>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)]">
        {preview.length > 0
          ? `${preview.length} session${preview.length === 1 ? '' : 's'} will be booked, first on ${preview[0].start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}.`
          : 'No sessions match these settings yet.'}
      </p>
    </section>
  );
};

export default ScheduleSelectorSection;
