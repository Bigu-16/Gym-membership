import { useEffect, useMemo, useState } from 'react';
import { Banknote, Shirt } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { todayKey } from '../lib/dates';
import { useI18n } from '../i18n/context';
import { useToast } from './toastContext';
import { Button, Checkbox, ChoiceGroup, Dialog, ErrorNote, Field, Input, Select, StatusBadge } from './kit';

import { METHODS } from '../lib/constants';

/** "9:00–10:00 AM" with the Ethiopian clock under it (or the reverse in Amharic). */
export function SlotText({ slot, inline = false }) {
  const { formatSlot, slotHint } = useI18n();
  if (!slot) return <span className="text-muted">—</span>;
  if (inline) return <span>{formatSlot(slot)} <span className="text-muted">({slotHint(slot)})</span></span>;
  return (
    <span className="flex flex-col leading-tight">
      <span className="font-semibold">{formatSlot(slot)}</span>
      <span className="text-[0.9rem] text-muted">{slotHint(slot)}</span>
    </span>
  );
}

export function MethodPicker({ value, onChange, error }) {
  const { t } = useI18n();
  return (
    <ChoiceGroup
      legend={t('pay.method')}
      name="method"
      columns={4}
      value={value}
      onChange={onChange}
      error={error}
      options={METHODS.map((m) => ({ value: m, label: t(`methods.${m}`) }))}
    />
  );
}

export function DateField({ label, value, onChange, max, required = true }) {
  const { altDate } = useI18n();
  return (
    <Field label={label} hint={altDate(value)} required={required}>
      <Input type="date" value={value} max={max} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** Pay the monthly fee for one or more kids of the same family. */
export function RenewDialog(props) {
  return props.open ? <RenewDialogBody {...props} /> : null;
}

function RenewDialogBody({ open, students, onClose, onDone }) {
  const { t, formatMoney, formatDate } = useI18n();
  const { club } = useApp();
  const toast = useToast();
  const [picked, setPicked] = useState(() => Object.fromEntries(students.map((s) => [s.id, true])));
  const [amounts, setAmounts] = useState({});
  const [months, setMonths] = useState(1);
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(todayKey());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const fee = Number(club?.monthly_fee || 0) * months;
  const chosen = students.filter((s) => picked[s.id]);
  const amountFor = (s) => (amounts[s.id] === undefined || amounts[s.id] === '' ? fee : Number(amounts[s.id]));
  const total = chosen.reduce((sum, s) => sum + amountFor(s), 0);

  const submit = async () => {
    if (!method) { setError(new Error(t('pay.chooseMethod'))); return; }
    if (!chosen.length) { setError(new Error(t('pay.chooseKid'))); return; }
    setBusy(true);
    setError(null);
    try {
      await api.renew({
        items: chosen.map((s) => ({ student_id: s.id, amount: amounts[s.id] === undefined || amounts[s.id] === '' ? null : String(amounts[s.id]) })),
        payment: { method, months, reference: reference || null, paid_on: paidOn },
      });
      toast.success(t('pay.saved', { amount: formatMoney(total) }));
      onDone?.();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      title={t('pay.title')}
      onClose={onClose}
      wide
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button icon={Banknote} loading={busy} onClick={submit}>{t('pay.saveTotal', { amount: formatMoney(total) })}</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-semibold text-ink">{t('pay.whichKids')}</legend>
          {students.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line-soft p-3">
              <Checkbox
                className="flex-1"
                checked={Boolean(picked[s.id])}
                onChange={(e) => setPicked((p) => ({ ...p, [s.id]: e.target.checked }))}
                label={s.name}
                hint={s.expiry_date ? t('pay.currentEnd', { date: formatDate(s.expiry_date) }) : t('status.unpaid')}
              />
              <StatusBadge status={s.status} daysLeft={s.days_left} compact />
              {picked[s.id] ? (
                <Field label={t('pay.amountFor', { name: s.name })} className="w-40">
                  <Input type="number" min="0" step="1" inputMode="decimal" placeholder={String(fee)}
                    value={amounts[s.id] ?? ''} onChange={(e) => setAmounts((a) => ({ ...a, [s.id]: e.target.value }))} />
                </Field>
              ) : null}
            </div>
          ))}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('pay.months')} hint={t('pay.monthlyFee', { amount: formatMoney(club?.monthly_fee) })}>
            <Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{t('pay.monthCount', { count: m, n: m })}</option>)}
            </Select>
          </Field>
          <DateField label={t('pay.paidOn')} value={paidOn} onChange={setPaidOn} max={todayKey()} />
        </div>
        <MethodPicker value={method} onChange={setMethod} />
        {method && method !== 'cash' ? (
          <Field label={t('pay.reference')} hint={t('pay.referenceHint')} optional>
            <Input value={reference} maxLength={64} onChange={(e) => setReference(e.target.value)} autoComplete="off" />
          </Field>
        ) : null}
        <p className="text-muted">{t('pay.extendsNote')}</p>
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}

/** Sell a uniform on its own: to a kid already enrolled, or to anyone by name. */
export function SellDialog(props) {
  return props.open ? <SellDialogBody {...props} /> : null;
}

function SellDialogBody({ open, onClose, onDone, student = null }) {
  const { t, formatMoney } = useI18n();
  const toast = useToast();
  const [sizes, setSizes] = useState([]);
  const [kids, setKids] = useState([]);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.sizes(), student ? Promise.resolve([]) : api.students()])
      .then(([sizeList, kidList]) => {
        setSizes(sizeList.filter((s) => s.is_active));
        setKids(kidList);
        const match = student ? sizeList.find((s) => s.label === student.uniform_size) : null;
        setForm({
          size_id: match ? String(match.id) : '',
          quantity: 1,
          unit_price: '',
          method: '',
          reference: '',
          sold_on: todayKey(),
          buyerType: student ? 'kid' : 'kid',
          student_id: student ? String(student.id) : '',
          buyer_name: '',
          buyer_phone: '',
        });
      })
      .catch(setError);
  }, [student]);

  const size = useMemo(() => sizes.find((s) => String(s.id) === String(form.size_id)), [sizes, form.size_id]);
  const unit = form.unit_price === '' || form.unit_price === undefined ? Number(size?.effective_price || 0) : Number(form.unit_price);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.size_id) return setError(new Error(t('uniforms.chooseSize')));
    if (!form.method) return setError(new Error(t('pay.chooseMethod')));
    if (form.buyerType === 'kid' && !form.student_id) return setError(new Error(t('uniforms.chooseBuyer')));
    if (form.buyerType === 'other' && !form.buyer_name.trim()) return setError(new Error(t('uniforms.typeBuyer')));
    setBusy(true);
    setError(null);
    try {
      await api.sell({
        size_id: Number(form.size_id),
        quantity: Number(form.quantity),
        unit_price: form.unit_price === '' ? null : String(form.unit_price),
        method: form.method,
        reference: form.reference || null,
        sold_on: form.sold_on,
        student_id: form.buyerType === 'kid' ? Number(form.student_id) : null,
        buyer_name: form.buyerType === 'other' ? form.buyer_name : null,
        buyer_phone: form.buyerType === 'other' ? form.buyer_phone || null : null,
      });
      toast.success(t('uniforms.soldToast', { amount: formatMoney(unit * form.quantity) }));
      onDone?.();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={student ? t('uniforms.sellTo', { name: student.name }) : t('uniforms.sell')}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button icon={Shirt} loading={busy} onClick={submit}>{t('uniforms.sellTotal', { amount: formatMoney(unit * (form.quantity || 1)) })}</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('uniforms.size')} required>
            <Select value={form.size_id || ''} onChange={(e) => set('size_id')(e.target.value)}>
              <option value="">{t('common.choose')}</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id} disabled={s.in_stock < 1}>
                  {s.label} — {t('uniforms.inStockN', { n: s.in_stock })}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('uniforms.quantity')} required>
            <Input type="number" min="1" max={size?.in_stock || 100} value={form.quantity || 1} onChange={(e) => set('quantity')(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label={t('uniforms.unitPrice')} hint={size ? t('uniforms.defaultPrice', { amount: formatMoney(size.effective_price) }) : undefined}>
            <Input type="number" min="0" inputMode="decimal" placeholder={size ? String(Number(size.effective_price)) : ''} value={form.unit_price ?? ''} onChange={(e) => set('unit_price')(e.target.value)} />
          </Field>
          <DateField label={t('uniforms.soldOn')} value={form.sold_on || todayKey()} onChange={set('sold_on')} max={todayKey()} />
        </div>
        {!student ? (
          <>
            <ChoiceGroup
              legend={t('uniforms.buyer')}
              name="buyerType"
              value={form.buyerType}
              onChange={set('buyerType')}
              options={[{ value: 'kid', label: t('uniforms.buyerKid') }, { value: 'other', label: t('uniforms.buyerOther'), hint: t('uniforms.buyerOtherHint') }]}
            />
            {form.buyerType === 'kid' ? (
              <Field label={t('uniforms.kid')} required>
                <Select value={form.student_id} onChange={(e) => {
                  const kid = kids.find((k) => String(k.id) === e.target.value);
                  const match = kid ? sizes.find((s) => s.label === kid.uniform_size) : null;
                  setForm((f) => ({ ...f, student_id: e.target.value, size_id: f.size_id || (match ? String(match.id) : '') }));
                }}>
                  <option value="">{t('common.choose')}</option>
                  {kids.map((k) => <option key={k.id} value={k.id}>{k.name} — {k.guardian_name}{k.uniform_size ? ` (${k.uniform_size})` : ''}</option>)}
                </Select>
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('uniforms.buyerName')} required>
                  <Input value={form.buyer_name} onChange={(e) => set('buyer_name')(e.target.value)} />
                </Field>
                <Field label={t('enrol.phone')} optional>
                  <Input type="tel" inputMode="tel" value={form.buyer_phone} onChange={(e) => set('buyer_phone')(e.target.value)} />
                </Field>
              </div>
            )}
          </>
        ) : null}
        <MethodPicker value={form.method} onChange={set('method')} />
        {form.method && form.method !== 'cash' ? (
          <Field label={t('pay.reference')} hint={t('pay.referenceHint')} optional>
            <Input value={form.reference} maxLength={64} onChange={(e) => set('reference')(e.target.value)} />
          </Field>
        ) : null}
        <ErrorNote error={error} />
      </div>
    </Dialog>
  );
}
