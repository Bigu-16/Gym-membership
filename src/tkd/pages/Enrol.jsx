import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, Plus, Printer, Trash2, UserPlus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { navigate } from '../lib/router';
import { useUnsavedWork } from '../lib/unsaved';
import { todayKey } from '../lib/dates';
import { useI18n } from '../i18n/context';
import { Button, Card, Checkbox, ChoiceGroup, ErrorNote, Field, IconButton, Input, Notice, PageHeader, Select, Textarea } from '../ui/kit';
import { DateField, MethodPicker, SlotText } from '../ui/shared';

const newKid = () => ({ key: Math.random().toString(36).slice(2), name: '', age: '', uniform_size: '', slot_id: '', buy_uniform: false, amount: '', notes: '' });

export default function Enrol({ params }) {
  const { t, formatMoney } = useI18n();
  const { club, activeSlots } = useApp();
  const [existing, setExisting] = useState(null); // family the kids join
  const [found, setFound] = useState(null); // family found by phone, not yet accepted
  const [parent, setParent] = useState({ name: '', phone: '', phone_alt: '' });
  const [kids, setKids] = useState([newKid()]);
  const [payment, setPayment] = useState({ months: 1, method: '', reference: '', paid_on: todayKey() });
  const [startDate, setStartDate] = useState(todayKey());
  const [sizes, setSizes] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.sizes().then(setSizes).catch(() => setSizes([])); }, [club?.id]);
  useEffect(() => {
    if (params.guardian) api.guardian(Number(params.guardian)).then(setExisting).catch(() => setExisting(null));
  }, [params.guardian]);

  const sizeByLabel = useMemo(() => Object.fromEntries(sizes.map((s) => [s.label, s])), [sizes]);
  const fee = Number(club.monthly_fee || 0) * payment.months;
  const feeFor = (k) => (k.amount === '' ? fee : Number(k.amount));
  const feesTotal = kids.reduce((sum, k) => sum + feeFor(k), 0);
  const uniformTotal = kids.reduce((sum, k) => sum + (k.buy_uniform && sizeByLabel[k.uniform_size] ? Number(sizeByLabel[k.uniform_size].effective_price) : 0), 0);

  const started = Boolean(parent.name.trim() || parent.phone.trim() || kids.some((k) => k.name.trim()));
  useUnsavedWork(started && !result && !busy);

  const setKid = (key, field, value) => setKids((list) => list.map((k) => (k.key === key ? { ...k, [field]: value } : k)));

  const lookupPhone = async () => {
    if (existing || parent.phone.replace(/\D/g, '').length < 9) return;
    try {
      const family = await api.guardianByPhone(parent.phone);
      setFound(family);
    } catch { /* lookup is a convenience only */ }
  };

  const validate = () => {
    const next = {};
    if (!existing) {
      if (!parent.name.trim()) next.parentName = t('enrol.err.parentName');
      if (parent.phone.replace(/\D/g, '').length < 9) next.phone = t('enrol.err.phone');
    }
    kids.forEach((k) => {
      if (!k.name.trim()) next[`${k.key}-name`] = t('enrol.err.kidName');
      if (!k.slot_id) next[`${k.key}-slot`] = t('enrol.err.class');
      if (k.buy_uniform && !k.uniform_size) next[`${k.key}-size`] = t('enrol.err.sizeForUniform');
    });
    if (!payment.method) next.method = t('pay.chooseMethod');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!validate()) {
      setError(new Error(t('enrol.err.fix')));
      return;
    }
    setBusy(true);
    try {
      const body = {
        ...(existing ? { guardian_id: existing.id } : { guardian: { name: parent.name, phone: parent.phone, phone_alt: parent.phone_alt || null } }),
        students: kids.map((k) => ({
          name: k.name,
          age: k.age === '' ? null : Number(k.age),
          uniform_size: k.uniform_size || null,
          slot_id: Number(k.slot_id),
          buy_uniform: k.buy_uniform,
          amount: k.amount === '' ? null : String(k.amount),
          notes: k.notes || null,
        })),
        payment: { method: payment.method, months: payment.months, reference: payment.reference || null, paid_on: payment.paid_on },
        start_date: startDate,
      };
      setResult(await api.enrol(body));
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.detail?.code === 'parent_exists') {
        const family = await api.guardian(err.detail.guardian_id).catch(() => null);
        setFound(family);
        setError(new Error(t('enrol.err.parentExists', { name: err.detail.name })));
      } else {
        setError(err);
      }
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setResult(null);
    setExisting(null);
    setFound(null);
    setParent({ name: '', phone: '', phone_alt: '' });
    setKids([newKid()]);
    setPayment({ months: 1, method: '', reference: '', paid_on: todayKey() });
    setErrors({});
    navigate('/enrol');
  };

  if (result) return <Receipt result={result} onAnother={reset} />;

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title={existing ? t('enrol.titleAdd', { name: existing.name }) : t('enrol.title')} subtitle={t('enrol.subtitle')} />

      {/* 1. Parent */}
      <Card title={t('enrol.step1')} className="mb-6">
        {existing ? (
          <Notice icon={Users} tone="ok">
            <p className="font-semibold">{t('enrol.joiningFamily', { name: existing.name, phone: existing.phone })}</p>
            {existing.students.length ? <p>{t('enrol.alreadyHas', { names: existing.students.map((s) => s.name).join(', ') })}</p> : null}
            <button type="button" className="mt-1 min-h-[44px] font-semibold underline" onClick={() => { setExisting(null); navigate('/enrol'); }}>
              {t('enrol.differentParent')}
            </button>
          </Notice>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t('enrol.phone')} hint={t('enrol.phoneHint')} error={errors.phone} required>
              <Input type="tel" inputMode="tel" autoComplete="off" value={parent.phone}
                onChange={(e) => { setParent((p) => ({ ...p, phone: e.target.value })); setFound(null); }} onBlur={lookupPhone} />
            </Field>
            <Field label={t('enrol.parentName')} error={errors.parentName} required>
              <Input autoComplete="off" value={parent.name} onChange={(e) => setParent((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label={t('enrol.phoneAlt')} optional>
              <Input type="tel" inputMode="tel" autoComplete="off" value={parent.phone_alt} onChange={(e) => setParent((p) => ({ ...p, phone_alt: e.target.value }))} />
            </Field>
            {found ? (
              <div className="md:col-span-2">
                <Notice icon={Info}>
                  <p className="font-semibold">{t('enrol.foundFamily', { name: found.name, count: found.students.length, n: found.students.length })}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => { setExisting(found); setFound(null); setError(null); }}>{t('enrol.useFamily')}</Button>
                  </div>
                </Notice>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {/* 2. Kids */}
      <Card title={t('enrol.step2')} className="mb-6">
        <div className="flex flex-col gap-5">
          {kids.map((kid, index) => {
            const size = sizeByLabel[kid.uniform_size];
            return (
              <fieldset key={kid.key} className="rounded-xl border border-line-soft p-4">
                <legend className="px-2 text-lg font-bold text-ink">{t('enrol.kidN', { n: index + 1 })}</legend>
                <div className="flex justify-end">
                  {kids.length > 1 ? (
                    <IconButton label={t('enrol.removeKid', { n: index + 1 })} icon={Trash2} onClick={() => setKids((l) => l.filter((k) => k.key !== kid.key))} />
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label={t('enrol.kidName')} error={errors[`${kid.key}-name`]} required className="md:col-span-2">
                    <Input autoComplete="off" value={kid.name} onChange={(e) => setKid(kid.key, 'name', e.target.value)} />
                  </Field>
                  <Field label={t('enrol.age')} optional>
                    <Input type="number" inputMode="numeric" min="2" max="80" value={kid.age} onChange={(e) => setKid(kid.key, 'age', e.target.value)} />
                  </Field>
                </div>
                <div className="mt-4">
                  <ChoiceGroup legend={`${t('enrol.class')} *`} name={`slot-${kid.key}`} value={kid.slot_id} columns={2}
                    error={errors[`${kid.key}-slot`]} onChange={(v) => setKid(kid.key, 'slot_id', v)}
                    options={activeSlots.map((s) => ({ value: String(s.id), label: <SlotText slot={s} inline />, hint: s.weekdays.includes(6) ? undefined : t('enrol.noSunday') }))} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label={t('enrol.size')} hint={t('enrol.sizeHint')} error={errors[`${kid.key}-size`]}>
                    <Select value={kid.uniform_size} onChange={(e) => setKid(kid.key, 'uniform_size', e.target.value)}>
                      <option value="">{t('enrol.sizeUnknown')}</option>
                      {sizes.filter((s) => s.is_active).map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
                    </Select>
                  </Field>
                  <div className="flex flex-col justify-end gap-1 pb-1">
                    <Checkbox
                      label={t('enrol.buyUniform')}
                      hint={size ? t('enrol.buyUniformHint', { price: formatMoney(size.effective_price), n: size.in_stock }) : t('enrol.pickSizeFirst')}
                      checked={kid.buy_uniform}
                      disabled={!size || size.in_stock < 1}
                      onChange={(e) => setKid(kid.key, 'buy_uniform', e.target.checked)}
                    />
                    {size && size.in_stock < 1 ? <p className="font-semibold text-crit">{t('enrol.outOfStock')}</p> : null}
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="min-h-[32px] cursor-pointer font-semibold text-brand">{t('enrol.moreOptions')}</summary>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <Field label={t('enrol.customFee')} hint={t('enrol.customFeeHint', { amount: formatMoney(fee) })} optional>
                      <Input type="number" min="0" inputMode="decimal" placeholder={String(fee)} value={kid.amount} onChange={(e) => setKid(kid.key, 'amount', e.target.value)} />
                    </Field>
                    <Field label={t('enrol.notes')} optional>
                      <Textarea value={kid.notes} onChange={(e) => setKid(kid.key, 'notes', e.target.value)} />
                    </Field>
                  </div>
                </details>
              </fieldset>
            );
          })}
          <Button variant="secondary" icon={Plus} onClick={() => setKids((l) => [...l, newKid()])} className="self-start">{t('enrol.addKid')}</Button>
        </div>
      </Card>

      {/* 3. Payment */}
      <Card title={t('enrol.step3')} className="mb-6">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t('pay.months')} hint={t('pay.monthlyFee', { amount: formatMoney(club.monthly_fee) })}>
              <Select value={payment.months} onChange={(e) => setPayment((p) => ({ ...p, months: Number(e.target.value) }))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{t('pay.monthCount', { count: m, n: m })}</option>)}
              </Select>
            </Field>
            <DateField label={t('enrol.startDate')} value={startDate} onChange={setStartDate} />
            <DateField label={t('pay.paidOn')} value={payment.paid_on} max={todayKey()} onChange={(v) => setPayment((p) => ({ ...p, paid_on: v }))} />
          </div>
          <MethodPicker value={payment.method} onChange={(v) => setPayment((p) => ({ ...p, method: v }))} error={errors.method} />
          {payment.method && payment.method !== 'cash' ? (
            <Field label={t('pay.reference')} hint={t('pay.referenceHint')} optional>
              <Input value={payment.reference} maxLength={64} autoComplete="off" onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))} />
            </Field>
          ) : null}
          {Number(club.monthly_fee) === 0 ? <Notice tone="warn" icon={Info}>{t('enrol.feeNotSet')}</Notice> : null}

          <dl className="grid gap-2 rounded-xl bg-tint p-4 text-brand sm:grid-cols-3">
            <div><dt>{t('enrol.feesTotal', { count: kids.length, n: kids.length })}</dt><dd className="text-xl font-bold tabular-nums">{formatMoney(feesTotal)}</dd></div>
            <div><dt>{t('enrol.uniformsTotal')}</dt><dd className="text-xl font-bold tabular-nums">{formatMoney(uniformTotal)}</dd></div>
            <div><dt>{t('enrol.grandTotal')}</dt><dd className="text-2xl font-bold tabular-nums">{formatMoney(feesTotal + uniformTotal)}</dd></div>
          </dl>
          <ErrorNote error={error} />
          <Button type="submit" icon={UserPlus} loading={busy} className="self-start">{t('enrol.submit')}</Button>
        </div>
      </Card>
    </form>
  );
}

function Receipt({ result, onAnother }) {
  const { t, formatDate, formatMoney, lang, formatSlot } = useI18n();
  const { club, slotById } = useApp();
  const g = result.guardian;
  const kidIds = new Set(result.payments.map((p) => p.student_id));
  const newKids = g.students.filter((s) => kidIds.has(s.id));
  return (
    <>
      <div className="no-print mb-6">
        <Notice tone="ok" icon={CheckCircle2}>
          <p className="text-lg font-bold">{t('enrol.done', { count: newKids.length, n: newKids.length })}</p>
        </Notice>
      </div>
      <Card className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line-soft pb-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">{lang === 'am' && club.name_am ? club.name_am : club.name}</h1>
            <p className="text-muted">{t('enrol.receipt')} {result.receipt_no}</p>
          </div>
          <p className="text-right text-muted">{formatDate(result.payments[0]?.paid_on)}</p>
        </div>
        <p className="mt-3"><span className="font-semibold">{t('enrol.parentName')}:</span> {g.name} · {g.phone}</p>
        <table className="mt-4 w-full text-left">
          <thead><tr className="text-muted">
            <th scope="col" className="py-1">{t('students.col.kid')}</th>
            <th scope="col" className="py-1">{t('students.col.class')}</th>
            <th scope="col" className="py-1">{t('enrol.paidUntil')}</th>
            <th scope="col" className="py-1 text-right">{t('family.col.amount')}</th>
          </tr></thead>
          <tbody>
            {result.payments.map((p) => {
              const kid = newKids.find((k) => k.id === p.student_id);
              return (
                <tr key={p.id} className="border-t border-line-soft">
                  <td className="py-2 font-semibold">{kid?.name}</td>
                  <td className="py-2">{formatSlot(slotById[kid?.slot_id])}</td>
                  <td className="py-2">{formatDate(p.period_end)}</td>
                  <td className="py-2 text-right tabular-nums">{formatMoney(p.amount)}</td>
                </tr>
              );
            })}
            {result.uniform_sales.map((s) => (
              <tr key={`u${s.id}`} className="border-t border-line-soft">
                <td className="py-2" colSpan={3}>{t('enrol.uniformLine', { size: s.size })}</td>
                <td className="py-2 text-right tabular-nums">{formatMoney(s.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 border-ink">
            <th scope="row" colSpan={3} className="py-2 text-left">{t('enrol.grandTotal')} · {t(`methods.${result.payments[0]?.method}`)}</th>
            <td className="py-2 text-right text-xl font-bold tabular-nums">{formatMoney(result.total)}</td>
          </tr></tfoot>
        </table>
        <div className="no-print mt-6 flex flex-wrap gap-2">
          <Button icon={Printer} onClick={() => window.print()}>{t('enrol.print')}</Button>
          <Button variant="secondary" onClick={() => navigate(`/family/${g.id}`)}>{t('enrol.openFamily')}</Button>
          <Button variant="secondary" icon={UserPlus} onClick={onAnother}>{t('enrol.another')}</Button>
        </div>
      </Card>
    </>
  );
}
