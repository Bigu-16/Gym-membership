import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { DAY_END_HOUR, DAY_START_HOUR, formatTimeRange } from '../utils/classSessions';
import { Spinner, useFeedback } from './common/Feedback';
import TemplateModal from './schedule/TemplateModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const parseDays = (days) => {
  const values = Array.isArray(days) ? days : String(days || '').split(',');
  const lookup = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  return values.map((day) => lookup[day.trim()] || day.trim()).filter(Boolean);
};

const timeTo24 = (value) => {
  const raw = String(value || '').split(' - ')[0].trim();
  if (!raw) return '16:00';
  if (!/[AP]M/i.test(raw)) return raw.slice(0, 5);
  const [clock, modifier] = raw.split(/\s+/);
  let [hour, minute = '00'] = clock.split(':');
  let numericHour = Number(hour) % 12;
  if (modifier.toUpperCase() === 'PM') numericHour += 12;
  return `${String(numericHour).padStart(2, '0')}:${minute}`;
};

const addHour = (value) => {
  const [hour, minute] = value.split(':').map(Number);
  return `${String((hour + 1) % 24).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
};

const formatHour = (value) => {
  const [hour, minute = '00'] = value.split(':');
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;
};

const CLASS_COLORS = [
  { match: (n) => n.includes('taekwondo'), card: 'border-sky-500/30 bg-sky-500/10 text-info hover:border-sky-400', dot: 'bg-sky-500' },
  { match: (n) => n.includes('little kids'), card: 'border-purple-500/30 bg-purple-500/10 text-violet hover:border-purple-400', dot: 'bg-purple-500' },
  { match: (n) => n.includes('kickboxing'), card: 'border-rose-500/30 bg-rose-500/10 text-danger hover:border-rose-400', dot: 'bg-rose-500' },
  { match: (n) => n.includes('adult karate'), card: 'border-amber-500/30 bg-amber-500/10 text-warning hover:border-amber-400', dot: 'bg-amber-500' },
  { match: (n) => n.includes('karate'), card: 'border-emerald-500/30 bg-emerald-500/10 text-success hover:border-emerald-400', dot: 'bg-emerald-500' }
];
const DEFAULT_COLOR = { card: 'border-orange-500/25 bg-orange-500/10 text-brand hover:border-orange-400', dot: 'bg-orange-500' };

const classColor = (name = '') => CLASS_COLORS.find((c) => c.match(name.toLowerCase())) || DEFAULT_COLOR;

const TemplateManagement = ({
  scheduleTemplates = [],
  onAddScheduleTemplate,
  onUpdateScheduleTemplate,
  onDeleteScheduleTemplate,
  onLoadOfficialTimetable
}) => {
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [className, setClassName] = useState('Kids Taekwondo');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [capacity, setCapacity] = useState(''); // '' = no limit
  const [trainer, setTrainer] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(false);

  // Only real, saved slots are shown; an empty timetable gets a one-click loader instead.
  const activeTemplates = scheduleTemplates;

  const classNames = useMemo(() => Array.from(new Set([
    'Kids Taekwondo',
    'Little Kids Karate',
    'Kids Karate',
    'Adult Kickboxing',
    'Adult Karate',
    ...activeTemplates.map((template) => template.className).filter(Boolean)
  ])), [activeTemplates]);

  // Every hour of the working day (8 AM–9 PM starts), plus any class at an odd time.
  const gridTimes = useMemo(() => Array.from(new Set([
    ...Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => `${String(DAY_START_HOUR + i).padStart(2, '0')}:00`),
    ...activeTemplates.map((template) => timeTo24(template.time))
  ])).sort(), [activeTemplates]);

  const openScheduleEditor = (template = null, day = null, time = null) => {
    setEditingSchedule(template);
    setClassName(template?.className || 'Kids Taekwondo');
    setSelectedDays(template ? parseDays(template.days) : (day ? [day] : []));
    const nextStart = template ? timeTo24(template.time) : (time || '16:00');
    const rawEnd = template?.time?.includes(' - ') ? timeTo24(template.time.split(' - ')[1]) : addHour(nextStart);
    setStartTime(nextStart);
    setEndTime(rawEnd);
    setCapacity(template?.capacity ?? '');
    setTrainer(template?.trainer || '');
    setScheduleEditorOpen(true);
  };

  const closeScheduleEditor = () => {
    setScheduleEditorOpen(false);
    setEditingSchedule(null);
  };

  const { confirm } = useFeedback();

  // Success messages come from the data layer; errors stay on this page.
  const run = async (action) => {
    setError('');
    try {
      return await action();
    } catch (actionError) {
      setError(actionError.message || 'Action failed');
      throw actionError;
    }
  };

  const initializePhotoSchedule = async () => {
    const ok = await confirm({
      title: 'Load the official timetable?',
      message: 'Any class from the registration form that is missing here is added. Existing classes are not changed or removed.',
      confirmLabel: 'Load timetable'
    });
    if (!ok) return;
    setInitializing(true);
    setError('');
    try {
      await onLoadOfficialTimetable();
    } catch (actionError) {
      setError(actionError.message || 'Unable to load shift schedule');
    } finally {
      setInitializing(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (onDeleteScheduleTemplate) {
        await run(() => onDeleteScheduleTemplate(pendingDelete.id));
      }
      setPendingDelete(null);
    } catch {
      // Error already handled in run()
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="glass-card p-5 border border-[var(--glass-border)] flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-orange-500" />
            <h2 className="text-lg font-semibold">Weekly timetable</h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 ml-4.5">
            The repeating Monday–Saturday classes from the registration form
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={initializing}
            type="button"
            onClick={initializePhotoSchedule}
            className="px-4 py-2.5 rounded-xl border border-orange-500/30 text-brand text-xs font-bold disabled:opacity-50 hover:bg-orange-500/10 transition-colors"
          >
            {initializing ? <Spinner label="Loading…" /> : 'Load official timetable'}
          </button>
          <button
            type="button"
            onClick={() => openScheduleEditor()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--glass-border)] hover:border-[var(--text-primary)] text-xs font-bold transition-colors"
          >
            <Plus size={14} /> New class
          </button>
        </div>
      </div>

      
      {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-danger">{error}</div>}

      {/* Timetable Legend */}
      <div className="flex flex-wrap items-center gap-4 px-2 py-1 text-xs">
        <span className="text-[var(--text-secondary)] font-medium">Classes:</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Kids Taekwondo</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Little Kids Karate</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Kids Karate</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Adult Kickboxing</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Adult Karate</span>
      </div>

      {activeTemplates.length === 0 && (
        <div className="glass-card p-6 border border-amber-500/30 text-sm space-y-2">
          <p className="font-semibold">No classes saved yet.</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Press <strong>Load official timetable</strong> to add the Monday–Saturday classes from the registration form
            (Kids Taekwondo, Little Kids Karate, Kids Karate, Adult Kickboxing, Adult Karate, 4–9 PM), or add classes one by one.
          </p>
        </div>
      )}

      {/* Monday - Saturday Weekly Shift Grid */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)]">
        <div className="min-w-[980px] grid grid-cols-[100px_repeat(6,minmax(140px,1fr))] bg-[var(--glass-bg)]">
          <div className="p-3 border-b border-r border-[var(--glass-border)] text-xs text-[var(--text-secondary)]">Time</div>
          {DAYS.map((day) => (
            <div key={day} className="p-3 border-b border-r last:border-r-0 border-[var(--glass-border)] text-center text-xs font-bold">
              {day}
            </div>
          ))}
          {gridTimes.flatMap((time) => {
            const rowHasClass = activeTemplates.some((template) => timeTo24(template.time) === time);
            return [
            <div key={`${time}-label`} className="p-3 border-b border-r border-[var(--glass-border)] text-xs font-bold text-[var(--text-secondary)]">
              {formatHour(time)}
            </div>,
            ...DAYS.map((day) => {
              const matches = activeTemplates.filter(
                (template) => parseDays(template.days).includes(day) && timeTo24(template.time) === time
              );
              return (
                <div key={`${day}-${time}`} className={`${rowHasClass ? 'min-h-28' : 'min-h-12'} p-2 border-b border-r last:border-r-0 border-[var(--glass-border)] space-y-2 group/cell`}>
                  {matches.map((template) => (
                    <button
                      key={template.id || `${template.className}-${day}-${time}`}
                      type="button"
                      onClick={() => openScheduleEditor(template)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors ${classColor(template.className).card}`}
                    >
                      <span className="block text-xs font-bold">{template.className}</span>
                      <span className="block text-xs mt-1">{formatTimeRange(template.time)}</span>
                      <span className="block text-xs mt-0.5">
                        {template.enrolled || 0} enrolled{template.capacity ? ` / ${template.capacity}` : ''}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => openScheduleEditor(null, day, time)}
                    className="w-full py-2 rounded-lg border border-dashed border-[var(--glass-border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    + Add
                  </button>
                </div>
              );
            })
            ];
          })}
        </div>
      </div>

      {/* Schedule Templates Card Roster */}
      {activeTemplates.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-[var(--text-secondary)]">
            Active Schedule Templates ({activeTemplates.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeTemplates.map((template) => (
              <div key={template.id || `${template.className}-${template.days}-${template.time}`} className="glass-card p-4 border border-[var(--glass-border)] flex items-center justify-between gap-3">
                <div className="cursor-pointer" onClick={() => openScheduleEditor(template)}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${classColor(template.className).dot}`} />
                    <h4 className="text-xs font-bold">{template.className}</h4>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{template.days} · {formatTimeRange(template.time)}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {template.enrolled || 0} enrolled{template.capacity ? ` of ${template.capacity}` : ''}{template.trainer ? ` · ${template.trainer}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Edit schedule template"
                    onClick={() => openScheduleEditor(template)}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    title="Delete schedule template"
                    onClick={() => setPendingDelete(template)}
                    className="p-2 rounded-lg text-danger hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Edit Modal */}
      {scheduleEditorOpen && (
        <TemplateModal
          isOpen
          handleCloseModal={closeScheduleEditor}
          editingTemplate={editingSchedule}
          selectedClassOption={className}
          setSelectedClassOption={setClassName}
          uniqueClassNames={classNames}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          capacity={capacity}
          setCapacity={setCapacity}
          trainer={trainer}
          setTrainer={setTrainer}
          onAddTemplate={(template) => run(() => onAddScheduleTemplate && onAddScheduleTemplate(template))}
          onUpdateTemplate={(template) => run(() => onUpdateScheduleTemplate && onUpdateScheduleTemplate(template))}
        />
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card max-w-sm w-full p-6 border border-[var(--glass-border)] bg-[var(--bg-secondary)]">
            <h3 className="text-sm font-bold">Delete template?</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-3">
              Delete “{pendingDelete.className}” ({pendingDelete.days} @ {formatTimeRange(pendingDelete.time)})?
              {pendingDelete.enrolled ? ` ${pendingDelete.enrolled} enrolled ${pendingDelete.enrolled === 1 ? 'member' : 'members'} will be removed from this slot; past sessions are kept.` : ''}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-danger-solid text-white text-xs font-bold"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;
