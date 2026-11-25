import { useEffect, useMemo, useState } from 'react';
import { History, Pencil, Phone, RotateCcw, Shirt, Undo2, UserMinus, UserPlus, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { navigate } from '../lib/router';
import { useI18n } from '../i18n/context';
import { useToast } from '../ui/toastContext';
import { Button, Card, ChoiceGroup, Dialog, ErrorNote, Field, Input, Loading, Meter, PageHeader, Select, StatusBadge, Textarea } from '../ui/kit';
import { STATUS_ROW } from '../lib/constants';
import { DateField, RenewDialog, SellDialog, SlotText } from '../ui/shared';

export default function Family({ id }) {
  const { t, formatDate, formatMoney } = useI18n();
  const { slotById, club } = useApp();
  const toast = useToast();
  const family = useAsync(() => api.guardian(id), [id, club?.id]);
  const fees = useAsync(() => api.fees({ guardian_id: id, start: '2000-01-01' }), [id, club?.id]);
  const [paying, setPaying] = useState(null);
  const [selling, setSelling] = useState(null);
  const [editingKid, setEditingKid] = useState(null);
  const [editingParent, setEditingParent] = useState(false);
  const [history, setHistory] = useState(null);
  const [confirmUndo, setConfirmUndo] = useState(null);

  const reloadAll = () => { family.reload(); fees.reload(); };

  const latestPaymentIds = useMemo(() => {
    const latest = {};
    for (const p of fees.data || []) {
      const cur = latest[p.student_id];
      if (!cur || p.period_end > cur.period_end || (p.period_end === cur.period_end && p.id > cur.id)) latest[p.student_id] = p;
    }
    return new Set(Object.values(latest).map((p) => p.id));
  }, [fees.data]);

  if (family.loading && !family.data) return <Loading />;
  if (family.error && !family.data) return <ErrorNote error={family.error} onRetry={family.reload} />;
  const g = family.data;
  const active = g.students.filter((s) => s.is_active);
  const kidName = Object.fromEntries(g.students.map((s) => [s.id, s.name]));

  const setActive = async (kid, isActive) => {
    try {
      await api.updateStudent(kid.id, { is_active: isActive });
      toast.success(isActive ? t('family.broughtBack', { name: kid.name }) : t('family.markedLeft', { name: kid.name }));
      family.reload();
    } catch (err) { toast.error(err.message); }
  };

  const undoPayment = async () => {
    try {
      await api.voidFee(confirmUndo.id);
      toast.success(t('family.paymentUndone'));
      setConfirmUndo(null);
      reloadAll();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: t('nav.students'), href: '#/students' }]}
        title={g.name}
        subtitle={t('family.kidsCount', { count: g.students.length, n: g.students.length })}
        actions={(
          <>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditingParent(true)}>{t('family.editParent')}</Button>
            <Button variant="secondary" icon={UserPlus} onClick={() => navigate(`/enrol?guardian=${g.id}`)}>{t('family.addKid')}</Button>
            {active.length ? <Button icon={Wallet} onClick={() => setPaying(active)}>{active.length > 1 ? t('family.payAll') : t('pay.pay')}</Button> : null}
          </>
        )}
      />

      <Card className="mb-6" title={t('family.contact')} headingLevel={2}>
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${g.phone}`} className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-brand px-4 font-semibold text-brand hover:bg-tint">
            <Phone className="h-5 w-5" aria-hidden="true" /> {g.phone}
          </a>
          {g.phone_alt ? (
            <a href={`tel:${g.phone_alt}`} className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-line px-4 font-semibold text-ink hover:bg-tint">
              <Phone className="h-5 w-5" aria-hidden="true" /> {g.phone_alt}
            </a>
          ) : null}
        </div>
        {g.notes ? <p className="mt-3 text-muted">{g.notes}</p> : null}
      </Card>

      <h2 className="mb-3 text-xl font-bold text-ink">{t('family.kids')}</h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {g.students.map((kid) => (
          <article key={kid.id} className={clsx('rounded-xl border border-line-soft bg-white p-4', STATUS_ROW[kid.status])} aria-labelledby={`kid-${kid.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 id={`kid-${kid.id}`} className="text-lg font-bold text-ink">{kid.name}</h3>
                <p className="text-muted">{[kid.age ? t('students.age', { n: kid.age }) : null, kid.uniform_size ? t('students.sizeN', { n: kid.uniform_size }) : null].filter(Boolean).join(' · ') || ' '}</p>
              </div>
              <StatusBadge status={kid.status} daysLeft={kid.days_left} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div><dt className="text-[0.95rem] text-muted">{t('students.col.class')}</dt><dd><SlotText slot={slotById[kid.slot_id]} /></dd></div>
              <div>
                <dt className="text-[0.95rem] text-muted">{t('students.col.ends')}</dt>
                <dd className="font-semibold">{formatDate(kid.expiry_date)}</dd>
                {kid.classes_left !== null ? <dd className="text-[0.95rem] text-muted">{t('status.classesLeft', { count: kid.classes_left, n: kid.classes_left })}</dd> : null}
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {kid.is_active ? (
                <>
                  <Button size="sm" icon={Wallet} onClick={() => setPaying([kid])}>{t('pay.pay')}</Button>
                  <Button size="sm" variant="secondary" icon={Shirt} onClick={() => setSelling(kid)}>{t('uniforms.sell')}</Button>
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditingKid(kid)}>{t('common.edit')}</Button>
                  <Button size="sm" variant="ghost" icon={History} onClick={() => setHistory(kid)}>{t('family.history')}</Button>
                  <Button size="sm" variant="ghost" icon={UserMinus} onClick={() => setActive(kid, false)}>{t('family.markLeft')}</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => setActive(kid, true)}>{t('family.bringBack')}</Button>
                  <Button size="sm" variant="ghost" icon={History} onClick={() => setHistory(kid)}>{t('family.history')}</Button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <Card title={t('family.payments')}>
        {fees.data && fees.data.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-muted">
                {['date', 'kid', 'period', 'method', 'amount', 'action'].map((c) => <th key={c} scope="col" className="px-2 py-2 font-semibold">{t(`family.col.${c}`)}</th>)}
              </tr></thead>
              <tbody>
                {fees.data.map((p) => (
                  <tr key={p.id} className="border-t border-line-soft">
                    <td className="px-2 py-2">{formatDate(p.paid_on)}<span className="block text-[0.9rem] text-muted">{p.receipt_no}</span></td>
                    <td className="px-2 py-2">{kidName[p.student_id] || '—'}</td>
                    <td className="px-2 py-2">{formatDate(p.period_start, { withYear: false })} – {formatDate(p.period_end)}</td>
                    <td className="px-2 py-2">{t(`methods.${p.method}`)}{p.reference ? <span className="block text-[0.9rem] text-muted">{p.reference}</span> : null}</td>
                    <td className="px-2 py-2 font-semibold tabular-nums">{formatMoney(p.amount)}</td>
                    <td className="px-2 py-2">
                      {latestPaymentIds.has(p.id) ? (
                        <Button size="sm" variant="ghost" icon={Undo2} onClick={() => setConfirmUndo(p)}>{t('common.undo')}</Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-muted">{t('family.noPayments')}</p>}
      </Card>

      <RenewDialog open={Boolean(paying)} students={paying || []} onClose={() => setPaying(null)} onDone={reloadAll} />
      <SellDialog open={Boolean(selling)} student={selling} onClose={() => setSelling(null)} onDone={reloadAll} />
      <EditKidDialog kid={editingKid} onClose={() => setEditingKid(null)} onDone={family.reload} />
      <EditParentDialog open={editingParent} guardian={g} onClose={() => setEditingParent(false)} onDone={family.reload} />
      <HistoryDialog kid={history} onClose={() => setHistory(null)} />
      <Dialog
        open={Boolean(confirmUndo)}
        title={t('family.undoTitle')}
        onClose={() => setConfirmUndo(null)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirmUndo(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" icon={Undo2} onClick={undoPayment}>{t('family.undoConfirm')}</Button>
          </>
        )}
      >
        {confirmUndo ? <p>{t('family.undoText', { amount: formatMoney(confirmUndo.amount), name: kidName[confirmUndo.student_id] || '' })}</p> : null}
      </Dialog>
    </>
  );
}

function EditKidDialog(props) {
  return props.kid ? <EditKidForm {...props} /> : null;
}

function EditKidForm({ kid, onClose, onDone }) {
  const { t } = useI18n();
  const { activeSlots } = useApp();
  const toast = useToast();
  const [form, setForm] = useState(() => ({ name: kid.name, age: kid.age ?? '', uniform_size: kid.uniform_size || '', slot_id: kid.slot_id ? String(kid.slot_id) : '', notes: kid.notes || '', expiry_date: kid.expiry_date || '' }));
  const [sizes, setSizes] = useState([]);
  useEffect(() => { api.sizes().then(setSizes).catch(() => setSizes([])); }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);


  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        age: form.age === '' ? null : Number(form.age),
        uniform_size: form.uniform_size || null,
        slot_id: form.slot_id ? Number(form.slot_id) : null,
        notes: form.notes || null,
      };
      if ((form.expiry_date || null) !== (kid.expiry_date || null)) body.expiry_date = form.expiry_date || null;
      await api.updateStudent(kid.id, body);
      toast.success(t('common.saved'));
      onDone();
      onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  const sizeOptions = sizes.filter((s) => s.is_active || s.label === form.uniform_size);
  return (
    <Dialog open title={t('family.editKid', { name: kid.name })} onClose={onClose} wide
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('enrol.kidName')} required className="sm:col-span-2"><Input value={form.name} onChange={(e) => set('name')(e.target.value)} /></Field>
          <Field label={t('enrol.age')} optional><Input type="number" min="2" max="80" value={form.age} onChange={(e) => set('age')(e.target.value)} /></Field>
        </div>
        <Field label={t('enrol.size')}>
          <Select value={form.uniform_size} onChange={(e) => set('uniform_size')(e.target.value)}>
            <option value="">{t('enrol.sizeUnknown')}</option>
            {sizeOptions.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
          </Select>
        </Field>
        <ChoiceGroup legend={t('enrol.class')} name="edit-slot" value={form.slot_id} onChange={set('slot_id')}
          options={activeSlots.map((s) => ({ value: String(s.id), label: <SlotText slot={s} inline /> }))} />
        <Field label={t('enrol.notes')} optional><Textarea value={form.notes} onChange={(e) => set('notes')(e.target.value)} /></Field>
        <details className="rounded-lg border border-line-soft p-3">
          <summary className="min-h-[32px] cursor-pointer font-semibold">{t('family.fixExpiry')}</summary>
          <p className="my-2 text-muted">{t('family.fixExpiryHint')}</p>
          <DateField label={t('students.col.ends')} value={form.expiry_date} onChange={set('expiry_date')} required={false} />
        </details>
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

function EditParentDialog(props) {
  return props.open ? <EditParentForm {...props} /> : null;
}

function EditParentForm({ open, guardian, onClose, onDone }) {
  void open;
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState(() => ({ name: guardian.name, phone: guardian.phone, phone_alt: guardian.phone_alt || '', notes: guardian.notes || '' }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    try {
      await api.updateGuardian(guardian.id, { name: form.name, phone: form.phone, phone_alt: form.phone_alt || null, notes: form.notes || null });
      toast.success(t('common.saved'));
      onDone();
      onClose();
    } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} title={t('family.editParent')} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button loading={busy} onClick={save}>{t('common.save')}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label={t('enrol.parentName')} required><Input value={form.name || ''} onChange={set('name')} /></Field>
        <Field label={t('enrol.phone')} hint={t('enrol.phoneHint')} required><Input type="tel" inputMode="tel" value={form.phone || ''} onChange={set('phone')} /></Field>
        <Field label={t('enrol.phoneAlt')} optional><Input type="tel" inputMode="tel" value={form.phone_alt || ''} onChange={set('phone_alt')} /></Field>
        <Field label={t('enrol.notes')} optional><Textarea value={form.notes || ''} onChange={set('notes')} /></Field>
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

function HistoryDialog({ kid, onClose }) {
  const { t, formatDate, formatMoney } = useI18n();
  const detail = useAsync(() => (kid ? api.student(kid.id) : Promise.resolve(null)), [kid?.id]);
  if (!kid) return null;
  const d = detail.data;
  return (
    <Dialog open title={t('family.historyOf', { name: kid.name })} onClose={onClose} wide>
      {detail.loading && !d ? <Loading /> : null}
      <ErrorNote error={detail.error} />
      {d ? (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-2 text-lg font-bold">{t('family.attendance')}</h3>
            <Meter value={d.attendance_rate} label={t('reports.rate')} />
            {d.attendance.length ? (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('family.lastClasses')}>
                {d.attendance.slice(0, 24).map((a) => (
                  <li key={a.date} className={clsx('rounded-md border px-2 py-1 text-[0.95rem] font-semibold',
                    a.status === 'present' ? 'border-ok-strong bg-ok-soft text-ok' : 'border-crit-strong bg-crit-soft text-crit')}>
                    {formatDate(a.date, { withYear: false })} · {t(`attendance.${a.status}`)}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-muted">{t('family.noAttendance')}</p>}
          </section>
          <section>
            <h3 className="mb-2 text-lg font-bold">{t('family.payments')}</h3>
            {d.payments.length ? (
              <ul className="flex flex-col gap-1">
                {d.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-line-soft py-1">
                    <span>{formatDate(p.paid_on)} · {t(`methods.${p.method}`)} · {t('pay.monthCount', { count: p.months, n: p.months })}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(p.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted">{t('family.noPayments')}</p>}
          </section>
          <section>
            <h3 className="mb-2 text-lg font-bold">{t('nav.uniforms')}</h3>
            {d.uniform_sales.length ? (
              <ul className="flex flex-col gap-1">
                {d.uniform_sales.map((s) => (
                  <li key={s.id} className="flex justify-between border-b border-line-soft py-1">
                    <span>{formatDate(s.sold_on)} · {t('students.sizeN', { n: s.size })} × {s.quantity}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(s.total)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted">{t('family.noUniforms')}</p>}
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}
