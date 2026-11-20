import { useMemo, useState } from 'react';
import { Check, CheckCheck, Eraser, Save, Users, X } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { addDays, slotRunsOn, todayKey } from '../lib/dates';
import { useI18n } from '../i18n/context';
import { useToast } from '../ui/toastContext';
import { Button, EmptyState, ErrorNote, Loading, Notice, PageHeader, StatusBadge } from '../ui/kit';
import { DateField } from '../ui/shared';

export default function Attendance({ params }) {
  const { t, formatDate } = useI18n();
  const { activeSlots, club } = useApp();
  const toast = useToast();
  const [day, setDay] = useState(params.date || todayKey());
  const runningSlots = useMemo(() => activeSlots.filter((s) => slotRunsOn(club, s, day)), [activeSlots, day, club]);
  const [pickedSlot, setSlotId] = useState(params.slot ? Number(params.slot) : null);
  const slotId = activeSlots.some((s) => s.id === pickedSlot) ? pickedSlot : (runningSlots[0] || activeSlots[0])?.id ?? null;
  const [present, setPresent] = useState(new Set());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const register = useAsync(() => (slotId ? api.register(day, slotId) : Promise.resolve(null)), [day, slotId, club?.id]);

  // When a register loads (or is saved), start from what it says.
  const [loadedFor, setLoadedFor] = useState(null);
  if (register.data && register.data !== loadedFor) {
    setLoadedFor(register.data);
    setPresent(new Set(register.data.rows.filter((r) => r.status === 'present').map((r) => r.student_id)));
    setDirty(false);
  }

  const toggle = (id) => {
    setPresent((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const saved = await api.saveRegister({ date: day, slot_id: slotId, present_ids: [...present] });
      register.setData(saved);
      toast.success(t('attendance.savedToast', { present: present.size, total: saved.rows.length }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const rows = register.data?.rows || [];
  const isFuture = day > todayKey();

  return (
    <>
      <PageHeader title={t('attendance.title')} subtitle={formatDate(day, { withWeekday: true })} />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64"><DateField label={t('attendance.date')} value={day} max={todayKey()} onChange={(v) => v && setDay(v)} /></div>
        <Button variant="secondary" onClick={() => setDay(addDays(day, -1))}>{t('attendance.prevDay')}</Button>
        {day !== todayKey() ? <Button variant="secondary" onClick={() => setDay(todayKey())}>{t('attendance.today')}</Button> : null}
      </div>

      <fieldset className="mb-5">
        <legend className="mb-2 font-semibold text-ink">{t('attendance.chooseClass')}</legend>
        <div className="flex flex-wrap gap-2">
          {activeSlots.map((s) => {
            const runs = runningSlots.some((r) => r.id === s.id);
            const selected = s.id === slotId;
            return (
              <button key={s.id} type="button" aria-pressed={selected} onClick={() => setSlotId(s.id)}
                className={clsx('min-h-[56px] rounded-lg border-2 px-4 py-1 text-left',
                  selected ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand', !runs && !selected && 'opacity-80')}>
                <SlotTextOn slot={s} selected={selected} />
                {!runs ? <span className={clsx('block text-[0.85rem]', selected ? 'text-white' : 'text-muted')}>{t('attendance.notThisDay')}</span> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {register.data && !register.data.is_class_day ? (
        <div className="mb-4"><Notice tone="warn">{t('attendance.notClassDay')}</Notice></div>
      ) : null}
      {isFuture ? <Notice tone="warn">{t('attendance.future')}</Notice> : null}
      <ErrorNote error={register.error} onRetry={register.reload} />
      {register.loading && !register.data ? <Loading /> : null}

      {register.data && !rows.length ? (
        <EmptyState icon={Users} title={t('attendance.noKids')} text={t('attendance.noKidsHint')} />
      ) : null}

      {rows.length ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="mr-auto text-lg font-bold text-ink" aria-live="polite">{t('attendance.counter', { present: present.size, total: rows.length })}</p>
            <Button size="sm" variant="secondary" icon={CheckCheck} onClick={() => { setPresent(new Set(rows.map((r) => r.student_id))); setDirty(true); }}>{t('attendance.allPresent')}</Button>
            <Button size="sm" variant="ghost" icon={Eraser} onClick={() => { setPresent(new Set()); setDirty(true); }}>{t('attendance.clear')}</Button>
          </div>
          <ul className="flex flex-col gap-2">
            {rows.map((row) => {
              const on = present.has(row.student_id);
              return (
                <li key={row.student_id}>
                  <button type="button" aria-pressed={on} onClick={() => toggle(row.student_id)}
                    className={clsx('flex w-full min-h-[64px] items-center gap-3 rounded-xl border-2 bg-white px-4 py-2 text-left',
                      on ? 'border-ok-strong bg-ok-soft' : 'border-line-soft hover:border-brand')}>
                    <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                      on ? 'border-ok-strong bg-ok-strong text-white' : 'border-line text-muted')} aria-hidden="true">
                      {on ? <Check className="h-6 w-6" /> : <X className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold text-ink">{row.name}</span>
                      <span className="block font-semibold text-muted">{on ? t('attendance.present') : register.data.saved ? t('attendance.absent') : t('attendance.tapToMark')}</span>
                    </span>
                    {row.expiry_status !== 'active' ? <StatusBadge status={row.expiry_status} daysLeft={row.days_left} compact /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-20 z-20 mt-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-brand bg-white p-3 shadow-lg lg:bottom-4">
            <p className="flex-1 font-semibold text-ink">
              {dirty ? t('attendance.unsaved') : register.data.saved ? t('attendance.saved') : t('attendance.notSaved')}
            </p>
            <Button icon={Save} loading={busy} disabled={isFuture} onClick={save}>{t('attendance.save')}</Button>
          </div>
        </>
      ) : null}
    </>
  );
}

function SlotTextOn({ slot, selected }) {
  const { formatSlot, slotHint } = useI18n();
  return (
    <span className="flex flex-col leading-tight">
      <span className="font-semibold">{formatSlot(slot)}</span>
      <span className={clsx('text-[0.9rem]', selected ? 'text-white' : 'text-muted')}>{slotHint(slot)}</span>
    </span>
  );
}

