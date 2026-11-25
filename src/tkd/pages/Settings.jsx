import { useState } from 'react';
import { KeyRound, Pencil, Plus, Power, Save, Trash2, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import { api, session } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { useI18n } from '../i18n/context';
import { useToast } from '../ui/toastContext';
import { Button, Card, Checkbox, ChoiceGroup, ConfirmDialog, Dialog, ErrorNote, Field, Input, Loading, PageHeader, Select, TabPanel, Tabs } from '../ui/kit';
import { SlotText } from '../ui/shared';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

function DayPicker({ legend, value, onChange }) {
  const { weekday } = useI18n();
  return (
    <fieldset>
      <legend className="mb-2 font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const on = value.includes(d);
          return (
            <label key={d} className={clsx('flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 font-semibold',
              on ? 'border-brand bg-tint text-brand' : 'border-line bg-white text-ink')}>
              <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={on}
                onChange={(e) => onChange(e.target.checked ? [...value, d].sort() : value.filter((x) => x !== d))} />
              {weekday(d)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function MonthDay({ label, value, onChange }) {
  const { t } = useI18n();
  const [m, d] = value.split('-');
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  return (
    <fieldset>
      <legend className="mb-2 font-semibold text-ink">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('settings.month')}>
          <Select value={m} onChange={(e) => onChange(`${e.target.value}-${d}`)}>
            {months.map((mm) => <option key={mm} value={mm}>{t(`months.${Number(mm)}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('settings.day')}>
          <Select value={d} onChange={(e) => onChange(`${m}-${e.target.value}`)}>
            {days.map((dd) => <option key={dd} value={dd}>{Number(dd)}</option>)}
          </Select>
        </Field>
      </div>
    </fieldset>
  );
}

function BranchForm() {
  const { t } = useI18n();
  const { club, refreshClub } = useApp();
  const toast = useToast();
  const [form, setForm] = useState(club);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.updateClub({
        name: form.name, name_am: form.name_am || null,
        monthly_fee: String(form.monthly_fee || 0), uniform_price: String(form.uniform_price || 0),
        summer_start: form.summer_start, summer_end: form.summer_end,
        term_days: form.term_days, summer_days: form.summer_days,
        expiring_days: Number(form.expiring_days), critical_days: Number(form.critical_days),
        low_stock_threshold: Number(form.low_stock_threshold),
      });
      await refreshClub();
      toast.success(t('common.saved'));
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="flex flex-col gap-6" noValidate>
      <Card title={t('settings.branchDetails')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('settings.nameEn')} required><Input value={form.name} onChange={(e) => set('name')(e.target.value)} /></Field>
          <Field label={t('settings.nameAm')} optional><Input lang="am" value={form.name_am || ''} onChange={(e) => set('name_am')(e.target.value)} /></Field>
        </div>
      </Card>
      <Card title={t('settings.prices')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('settings.monthlyFee')} hint={t('settings.monthlyFeeHint')} required>
            <Input type="number" min="0" inputMode="decimal" value={form.monthly_fee} onChange={(e) => set('monthly_fee')(e.target.value)} />
          </Field>
          <Field label={t('settings.uniformPrice')} hint={t('settings.uniformPriceHint')}>
            <Input type="number" min="0" inputMode="decimal" value={form.uniform_price} onChange={(e) => set('uniform_price')(e.target.value)} />
          </Field>
        </div>
      </Card>
      <Card title={t('settings.seasons')}>
        <div className="flex flex-col gap-5">
          <p className="text-muted">{t('settings.seasonsHelp')}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <MonthDay label={t('settings.summerStart')} value={form.summer_start} onChange={set('summer_start')} />
            <MonthDay label={t('settings.summerEnd')} value={form.summer_end} onChange={set('summer_end')} />
          </div>
          <DayPicker legend={t('settings.termDays')} value={form.term_days} onChange={set('term_days')} />
          <DayPicker legend={t('settings.summerDays')} value={form.summer_days} onChange={set('summer_days')} />
        </div>
      </Card>
      <Card title={t('settings.warnings')}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t('settings.yellowDays')} hint={t('settings.yellowHint')}><Input type="number" min="1" max="60" value={form.expiring_days} onChange={(e) => set('expiring_days')(e.target.value)} /></Field>
          <Field label={t('settings.redDays')} hint={t('settings.redHint')}><Input type="number" min="0" max="30" value={form.critical_days} onChange={(e) => set('critical_days')(e.target.value)} /></Field>
          <Field label={t('settings.lowStock')} hint={t('settings.lowStockHint')}><Input type="number" min="0" value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold')(e.target.value)} /></Field>
        </div>
      </Card>
      <ErrorNote error={error} />
      <Button type="submit" icon={Save} loading={busy} className="self-start">{t('common.save')}</Button>
    </form>
  );
}

/** Remount the form when the branch (or its saved settings) change, so it starts from the server's values. */
function BranchFormKeyed() {
  const { club } = useApp();
  return <BranchForm key={JSON.stringify(club)} />;
}

function SlotDialog({ slot, onClose }) {
  const { t } = useI18n();
  const { refreshClub } = useApp();
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    start_time: (slot.start_time || '09:00').slice(0, 5),
    end_time: (slot.end_time || '10:00').slice(0, 5),
    weekdays: slot.weekdays || [0, 1, 2, 3, 4, 5, 6],
    is_active: slot.is_active ?? true,
  }));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const body = { ...form, start_time: `${form.start_time}:00`, end_time: `${form.end_time}:00` };
      if (slot.id) await api.updateSlot(slot.id, body); else await api.createSlot(body);
      await refreshClub();
      toast.success(t('common.saved'));
      onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Dialog open title={slot.id ? t('settings.editClass') : t('settings.addClass')} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></>}>
      <div className="flex flex-col gap-4">
        <p className="text-muted">{t('settings.timeHelp')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('settings.start')}>
            <Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
          </Field>
          <Field label={t('settings.end')}>
            <Input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
          </Field>
        </div>
        {form.start_time && form.end_time ? (
          <p className="font-semibold">{t('settings.preview')}: <SlotText slot={{ start_time: form.start_time, end_time: form.end_time }} inline /></p>
        ) : null}
        <DayPicker legend={t('settings.runsOn')} value={form.weekdays} onChange={(v) => setForm((f) => ({ ...f, weekdays: v }))} />
        <Checkbox label={t('settings.classOn')} checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

function ClassesPanel() {
  const { t, formatSlot } = useI18n();
  const { slots, refreshClub } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // a slot, or {} for a new one
  const [removing, setRemoving] = useState(null);
  const remove = async (slot) => {
    try { await api.deleteSlot(slot.id); await refreshClub(); toast.success(t('settings.classRemoved')); } catch (err) { toast.error(err.message); }
    setRemoving(null);
  };
  return (
    <Card title={t('settings.classes')} action={<Button size="sm" icon={Plus} onClick={() => setEditing({})}>{t('settings.addClass')}</Button>}>
      <p className="mb-4 text-muted">{t('settings.classesHelp')}</p>
      <ul className="flex flex-col gap-2">
        {slots.map((s) => (
          <li key={s.id} className={clsx('flex flex-wrap items-center gap-3 rounded-lg border border-line-soft p-3', !s.is_active && 'opacity-70')}>
            <div className="min-w-0 flex-1">
              <SlotText slot={s} />
              <p className="text-[0.95rem] text-muted">{s.weekdays.length === 7 ? t('settings.everyClassDay') : t('settings.notOn', { days: DAYS.filter((d) => !s.weekdays.includes(d)).map((d) => t(`weekdays.long.${d}`)).join(', ') })}</p>
            </div>
            {!s.is_active ? <span className="font-semibold text-muted">{t('settings.off')}</span> : null}
            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(s)}>{t('common.edit')}</Button>
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setRemoving(s)}>{t('common.delete')}</Button>
          </li>
        ))}
      </ul>
      {editing ? <SlotDialog slot={editing} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(removing)}
        title={t('settings.removeClassTitle')}
        confirmLabel={t('common.delete')}
        icon={Trash2}
        onClose={() => setRemoving(null)}
        onConfirm={() => remove(removing)}
      >
        {removing ? <p>{t('settings.removeClassText', { time: formatSlot(removing) })}</p> : null}
      </ConfirmDialog>
    </Card>
  );
}

function StaffDialog({ staff, onClose, onDone }) {
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState(() => (staff.id
    ? { full_name: staff.full_name, email: staff.email, role: staff.role }
    : { full_name: '', email: '', password: '', role: 'staff' }));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      // New logins always join this club; there is no way to add someone to another club.
      const body = { full_name: form.full_name, email: form.email, role: form.role };
      if (staff.id) await api.updateUser(staff.id, body); else await api.createUser({ ...body, password: form.password });
      toast.success(t('common.saved'));
      onDone();
      onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Dialog open title={staff.id ? t('settings.editStaff') : t('settings.addStaff')} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label={t('settings.fullName')} required><Input value={form.full_name} onChange={(e) => set('full_name')(e.target.value)} /></Field>
        <Field label={t('login.email')} required><Input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} /></Field>
        {!staff.id ? (
          <Field label={t('login.password')} hint={t('settings.passwordRule')} required>
            <Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password')(e.target.value)} />
          </Field>
        ) : null}
        <ChoiceGroup legend={t('settings.role')} name="role" value={form.role} onChange={set('role')}
          options={[{ value: 'staff', label: t('settings.roleStaff'), hint: t('settings.roleStaffHint') }, { value: 'admin', label: t('settings.roleAdmin'), hint: t('settings.roleAdminHint') }]} />
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

function ResetPasswordDialog({ staff, onClose }) {
  const { t } = useI18n();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api.resetPassword(staff.id, password); toast.success(t('settings.passwordReset')); onClose(); } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Dialog open title={t('settings.resetFor', { name: staff.full_name })} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label={t('settings.newPassword')} hint={t('settings.passwordRule')} required>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

function StaffPanel() {
  const { t } = useI18n();
  const { user } = useApp();
  const toast = useToast();
  const users = useAsync(() => api.users(), []);
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const toggle = async (u) => {
    try { await api.updateUser(u.id, { is_active: !u.is_active }); users.reload(); } catch (err) { toast.error(err.message); }
  };
  if (users.loading && !users.data) return <Loading />;
  return (
    <Card title={t('settings.staff')} action={<Button size="sm" icon={UserPlus} onClick={() => setEditing({})}>{t('settings.addStaff')}</Button>}>
      <ErrorNote error={users.error} onRetry={users.reload} />
      <ul className="flex flex-col gap-2">
        {(users.data || []).map((u) => (
          <li key={u.id} className={clsx('flex flex-wrap items-center gap-3 rounded-lg border border-line-soft p-3', !u.is_active && 'opacity-70')}>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{u.full_name}{u.id === user.id ? ` (${t('settings.you')})` : ''}</p>
              <p className="text-[0.95rem] text-muted">{u.email} · {u.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleStaff')}{u.is_active ? '' : ` · ${t('settings.disabled')}`}</p>
            </div>
            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(u)}>{t('common.edit')}</Button>
            <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => setResetting(u)}>{t('settings.resetPassword')}</Button>
            {u.id !== user.id ? <Button size="sm" variant="ghost" icon={Power} onClick={() => toggle(u)}>{u.is_active ? t('settings.disable') : t('settings.enable')}</Button> : null}
          </li>
        ))}
      </ul>
      {editing ? <StaffDialog staff={editing} onClose={() => setEditing(null)} onDone={users.reload} /> : null}
      {resetting ? <ResetPasswordDialog staff={resetting} onClose={() => setResetting(null)} /> : null}
    </Card>
  );
}

function AccountPanel() {
  const { t } = useI18n();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { access_token: token } = await api.changePassword({ current_password: current, new_password: next });
      session.setToken(token);
      setCurrent(''); setNext('');
      toast.success(t('settings.passwordChanged'));
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Card title={t('settings.changePassword')}>
      <form onSubmit={save} className="flex max-w-md flex-col gap-4" noValidate>
        <Field label={t('settings.currentPassword')} required><Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label={t('settings.newPassword')} hint={t('settings.passwordRule')} required><Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <ErrorNote error={error} />
        <Button type="submit" icon={KeyRound} loading={busy} className="self-start" disabled={!current || !next}>{t('settings.changePassword')}</Button>
      </form>
    </Card>
  );
}

export default function Settings() {
  const { t } = useI18n();
  const { isAdmin } = useApp();
  const [tab, setTab] = useState(isAdmin ? 'branch' : 'account');
  // Club settings and staff are for admins; everyone can change their own password.
  const tabs = [
    ...(isAdmin ? [
      { value: 'branch', label: t('settings.tabBranch') },
      { value: 'classes', label: t('settings.tabClasses') },
      { value: 'staff', label: t('settings.tabStaff') },
    ] : []),
    { value: 'account', label: t('settings.tabAccount') },
  ];
  return (
    <>
      <PageHeader title={t('settings.title')} />
      <Tabs label={t('settings.title')} tabs={tabs} value={tab} onChange={setTab} />
      <TabPanel value={tab}>
        {tab === 'branch' && isAdmin ? <BranchFormKeyed /> : null}
        {tab === 'classes' && isAdmin ? <ClassesPanel /> : null}
        {tab === 'staff' && isAdmin ? <StaffPanel /> : null}
        {tab === 'account' ? <AccountPanel /> : null}
      </TabPanel>
    </>
  );
}
