import { useMemo, useState } from 'react';
import { CalendarDays, Package, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { GROUP_SCHEDULE_SLOTS, PACKAGE_TEMPLATES } from '../config/scheduleConfig';
import TemplateModal from './schedule/TemplateModal';
import PackageTemplateModal from './templates/PackageTemplateModal';

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
  const hour = Number(value.split(':')[0]);
  return `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
};

const scheduleKey = (template) => `${template.className}|${parseDays(template.days).sort().join(',')}|${timeTo24(template.time)}`;

const TemplateManagement = ({
  membershipPlans = [],
  scheduleTemplates = [],
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onAddScheduleTemplate,
  onUpdateScheduleTemplate,
  onDeleteScheduleTemplate
}) => {
  const [section, setSection] = useState('packages');
  const [packageEditor, setPackageEditor] = useState({ open: false, plan: null });
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [className, setClassName] = useState('Kids Taekwondo');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [capacity, setCapacity] = useState(15);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(false);
  const [initializingPackages, setInitializingPackages] = useState(false);

  const classNames = useMemo(() => Array.from(new Set([
    'Kids Taekwondo',
    'Little Kids Karate',
    'Kids Karate',
    'Adult Kickboxing',
    'Adult Karate',
    ...scheduleTemplates.map((template) => template.className).filter(Boolean)
  ])), [scheduleTemplates]);

  const gridTimes = useMemo(() => Array.from(new Set([
    '16:00', '17:00', '18:00', '19:00', '20:00',
    ...scheduleTemplates.map((template) => timeTo24(template.time))
  ])).sort(), [scheduleTemplates]);

  const programs = useMemo(() => {
    const grouped = new Map();
    membershipPlans.forEach((plan) => {
      const key = plan.program || 'General';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(plan);
    });
    return [...grouped.entries()];
  }, [membershipPlans]);

  const openScheduleEditor = (template = null, day = null, time = null) => {
    setEditingSchedule(template);
    setClassName(template?.className || 'Kids Taekwondo');
    setSelectedDays(template ? parseDays(template.days) : (day ? [day] : []));
    const nextStart = template ? timeTo24(template.time) : (time || '16:00');
    const rawEnd = template?.time?.includes(' - ') ? timeTo24(template.time.split(' - ')[1]) : addHour(nextStart);
    setStartTime(nextStart);
    setEndTime(rawEnd);
    setCapacity(template?.capacity || 15);
    setScheduleEditorOpen(true);
  };

  const closeScheduleEditor = () => {
    setScheduleEditorOpen(false);
    setEditingSchedule(null);
  };

  const run = async (action, successMessage) => {
    setError('');
    setNotice('');
    try {
      const result = await action();
      setNotice(successMessage);
      return result;
    } catch (actionError) {
      setError(actionError.message || 'Template action failed');
      throw actionError;
    }
  };

  const initializePhotoSchedule = async () => {
    setInitializing(true);
    setError('');
    const existing = new Set(scheduleTemplates.map(scheduleKey));
    const missing = GROUP_SCHEDULE_SLOTS.filter((slot) => !existing.has(scheduleKey(slot)));
    try {
      for (const slot of missing) {
        await onAddScheduleTemplate({ ...slot, id: undefined, enrolled: undefined, type: 'group' });
      }
      setNotice(missing.length ? `${missing.length} photo schedule templates created.` : 'Photo schedule already configured.');
    } catch (actionError) {
      setError(actionError.message || 'Unable to initialize photo schedule');
    } finally {
      setInitializing(false);
    }
  };

  const initializeOfficialPackages = async () => {
    setInitializingPackages(true);
    setError('');
    const existing = new Set(membershipPlans.map((plan) => `${plan.program}|${plan.duration_months}|${plan.classes_per_week}`));
    const missing = PACKAGE_TEMPLATES.filter((item) => !existing.has(`${item.program}|${item.durationMonths}|${item.classesPerWeek}`));
    try {
      for (const [index, item] of missing.entries()) {
        await onAddPlan({
          name: item.name,
          program: item.program,
          duration_label: item.durationMonths === 1 ? 'One Month' : `${item.durationMonths} Month`,
          duration_months: item.durationMonths,
          classes_per_week: item.classesPerWeek,
          price: item.price,
          currency: item.currency,
          included_items: item.includedItem ? [item.includedItem] : [],
          description: null,
          duration_days: item.durationMonths * 30,
          sort_order: 100 + index,
          is_active: true
        });
      }
      setNotice(missing.length ? `${missing.length} official package templates created.` : 'Official packages already configured.');
    } catch (actionError) {
      setError(actionError.message || 'Unable to initialize official packages');
    } finally {
      setInitializingPackages(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { kind, item } = pendingDelete;
    try {
      if (kind === 'package') await run(() => onDeletePlan(item.id), 'Package template deleted.');
      else await run(() => onDeleteScheduleTemplate(item.id), 'Schedule template deleted.');
      setPendingDelete(null);
    } catch {
      // Error already shown by run().
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass-card p-5 border border-[var(--glass-border)] flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div>
          <h2 className="text-lg font-light uppercase tracking-luxury">Template Studio</h2>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Backend-powered package and recurring class configuration</p>
        </div>
        <div className="flex rounded-2xl p-1 border border-[var(--glass-border)] bg-[var(--bg-primary)]">
          <button type="button" onClick={() => setSection('packages')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury ${section === 'packages' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}>
            <Package size={14} /> Packages
          </button>
          <button type="button" onClick={() => setSection('schedule')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury ${section === 'schedule' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}>
            <CalendarDays size={14} /> Weekly Schedule
          </button>
        </div>
      </div>

      {notice && <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500">{notice}</div>}
      {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">{error}</div>}

      {section === 'packages' ? (
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-luxury">Package Templates</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Changes immediately control enrollment package choices.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={initializingPackages} type="button" onClick={initializeOfficialPackages} className="px-4 py-3 rounded-xl border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50">{initializingPackages ? 'Loading…' : 'Load Official Packages'}</button>
              <button type="button" onClick={() => setPackageEditor({ open: true, plan: null })} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold">
                <Plus size={14} /> New Package
              </button>
            </div>
          </div>

          {programs.length === 0 ? (
            <div className="glass-card p-10 text-center text-sm text-[var(--text-secondary)]">No package templates configured.</div>
          ) : programs.map(([program, plans]) => (
            <div key={program} className="space-y-4">
              <div className="flex items-center gap-3"><div className="w-1 h-6 rounded-full bg-orange-500" /><h3 className="text-sm uppercase tracking-luxury font-bold">{program}</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <article key={plan.id} className={`glass-card border border-[var(--glass-border)] p-5 ${plan.is_active ? '' : 'opacity-60'}`}>
                    <div className="flex justify-between gap-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">{plan.duration_label} · {plan.classes_per_week}x weekly</span>
                        <h4 className="font-bold mt-2">{plan.name}</h4>
                      </div>
                      <span className="text-xl font-black whitespace-nowrap">{Number(plan.price)} <small className="text-[9px]">AED</small></span>
                    </div>
                    {(plan.included_items || []).length > 0 && <p className="mt-4 text-[10px] uppercase tracking-wider text-amber-500">{plan.included_items.join(' · ')}</p>}
                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[var(--glass-border)]">
                      <button type="button" onClick={() => setPackageEditor({ open: true, plan })} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] py-2 text-[10px] uppercase tracking-luxury"><Pencil size={12} /> Edit</button>
                      <button type="button" title={plan.is_active ? 'Deactivate package' : 'Activate package'} onClick={() => run(() => onUpdatePlan({ ...plan, is_active: !plan.is_active }), plan.is_active ? 'Package deactivated.' : 'Package activated.')} className="p-2.5 rounded-xl border border-[var(--glass-border)]"><Power size={13} /></button>
                      <button type="button" title="Delete package" onClick={() => setPendingDelete({ kind: 'package', item: plan })} className="p-2.5 rounded-xl border border-rose-500/20 text-rose-500"><Trash2 size={13} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-luxury">Weekly Schedule Engine</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Recurring Monday–Saturday grid based on the supplied timetable.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={initializing} type="button" onClick={initializePhotoSchedule} className="px-4 py-3 rounded-xl border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-luxury font-bold disabled:opacity-50">{initializing ? 'Loading…' : 'Load Photo Schedule'}</button>
              <button type="button" onClick={() => openScheduleEditor()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold"><Plus size={14} /> New Schedule</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)]">
            <div className="min-w-[980px] grid grid-cols-[100px_repeat(6,minmax(140px,1fr))] bg-[var(--glass-bg)]">
              <div className="p-3 border-b border-r border-[var(--glass-border)] text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">Time</div>
              {DAYS.map((day) => <div key={day} className="p-3 border-b border-r last:border-r-0 border-[var(--glass-border)] text-center text-[10px] uppercase tracking-luxury font-bold">{day}</div>)}
              {gridTimes.flatMap((time) => [
                <div key={`${time}-label`} className="p-3 border-b border-r border-[var(--glass-border)] text-[10px] font-bold text-[var(--text-secondary)]">{formatHour(time)}</div>,
                ...DAYS.map((day) => {
                  const matches = scheduleTemplates.filter((template) => parseDays(template.days).includes(day) && timeTo24(template.time) === time);
                  return (
                    <div key={`${day}-${time}`} className="min-h-28 p-2 border-b border-r last:border-r-0 border-[var(--glass-border)] space-y-2 group/cell">
                      {matches.map((template) => (
                        <button key={template.id} type="button" onClick={() => openScheduleEditor(template)} className="w-full text-left rounded-xl border border-orange-500/25 bg-orange-500/10 p-3 hover:border-orange-500 transition-colors">
                          <span className="block text-[10px] font-black uppercase tracking-wide">{template.className}</span>
                          <span className="block text-[9px] text-[var(--text-secondary)] mt-1">{template.time}</span>
                          <span className="block text-[9px] text-[var(--text-secondary)] mt-1">Capacity {template.capacity}</span>
                        </button>
                      ))}
                      <button type="button" onClick={() => openScheduleEditor(null, day, time)} className="w-full py-2 rounded-lg border border-dashed border-[var(--glass-border)] text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] opacity-40 group-hover/cell:opacity-100 hover:text-[var(--text-primary)]">+ Add</button>
                    </div>
                  );
                })
              ])}
            </div>
          </div>

          {scheduleTemplates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {scheduleTemplates.map((template) => (
                <div key={template.id} className="glass-card p-4 border border-[var(--glass-border)] flex items-center justify-between gap-3">
                  <div><h4 className="text-xs font-bold">{template.className}</h4><p className="text-[10px] text-[var(--text-secondary)] mt-1">{template.days} · {template.time}</p></div>
                  <button type="button" title="Delete schedule template" onClick={() => setPendingDelete({ kind: 'schedule', item: template })} className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {packageEditor.open && (
        <PackageTemplateModal
          key={packageEditor.plan?.id || 'new-package'}
          isOpen
          plan={packageEditor.plan}
          onClose={() => setPackageEditor({ open: false, plan: null })}
          onSave={(plan) => run(() => plan.id ? onUpdatePlan(plan) : onAddPlan(plan), plan.id ? 'Package template updated.' : 'Package template created.')}
        />
      )}

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
          onAddTemplate={(template) => run(() => onAddScheduleTemplate(template), 'Schedule template created.')}
          onUpdateTemplate={(template) => run(() => onUpdateScheduleTemplate(template), 'Schedule template updated.')}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full p-6 border border-[var(--glass-border)] bg-[var(--bg-secondary)]">
            <h3 className="text-sm font-bold uppercase tracking-luxury">Delete template?</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-3">Delete “{pendingDelete.item.name || pendingDelete.item.className}”? Existing member history stays intact.</p>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-[10px] uppercase tracking-luxury font-bold">Delete</button>
              <button type="button" onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-[10px] uppercase tracking-luxury font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;
