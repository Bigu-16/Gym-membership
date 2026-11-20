import { useMemo, useState } from 'react';
import { Banknote, Shirt, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { useI18n } from '../i18n/context';
import { Card, ErrorNote, Loading, PageHeader, Stat } from '../ui/kit';
import { METHODS } from '../lib/constants';
import { RangePicker } from '../ui/RangePicker';
import { PRESETS } from '../lib/ranges';

export default function Payments() {
  const { t, formatDate, formatMoney } = useI18n();
  const { club } = useApp();
  const [range, setRange] = useState({ preset: 'thisMonth', ...PRESETS.thisMonth() });
  const data = useAsync(async () => {
    const [money, fees, sales, kids] = await Promise.all([
      api.moneyReport({ start: range.start, end: range.end }),
      api.fees({ start: range.start, end: range.end }),
      api.sales({ start: range.start, end: range.end, limit: 2000 }),
      api.students({ include_inactive: true }),
    ]);
    return { money, fees, sales, kids };
  }, [range.start, range.end, club?.id]);

  const kidById = useMemo(() => Object.fromEntries((data.data?.kids || []).map((k) => [k.id, k])), [data.data]);

  return (
    <>
      <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle', { from: formatDate(range.start), to: formatDate(range.end) })} />
      <RangePicker value={range} onChange={setRange} presets={['thisMonth', 'lastMonth', 'last3m']} />
      <ErrorNote error={data.error} onRetry={data.reload} />
      {data.loading && !data.data ? <Loading /> : null}
      {data.data ? (
        <>
          <section aria-label={t('payments.totals')} className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat icon={Wallet} label={t('payments.total')} value={formatMoney(data.data.money.total)} />
            <Stat icon={Banknote} label={t('payments.fees')} value={formatMoney(data.data.money.fees)} hint={t('payments.feeCount', { count: data.data.money.fee_payments, n: data.data.money.fee_payments })} />
            <Stat icon={Shirt} label={t('payments.uniforms')} value={formatMoney(data.data.money.uniforms)} hint={t('uniforms.pieces', { count: data.data.money.uniforms_sold, n: data.data.money.uniforms_sold })} />
          </section>

          <Card title={t('payments.byMethod')} className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-muted">
                  <th scope="col" className="px-2 py-2">{t('pay.method')}</th>
                  <th scope="col" className="px-2 py-2 text-right">{t('payments.fees')}</th>
                  <th scope="col" className="px-2 py-2 text-right">{t('payments.uniforms')}</th>
                  <th scope="col" className="px-2 py-2 text-right">{t('payments.total')}</th>
                </tr></thead>
                <tbody>
                  {METHODS.map((m) => {
                    const row = data.data.money.by_method[m] || { fees: 0, uniforms: 0 };
                    return (
                      <tr key={m} className="border-t border-line-soft">
                        <th scope="row" className="px-2 py-2 font-semibold">{t(`methods.${m}`)}</th>
                        <td className="px-2 py-2 text-right tabular-nums">{formatMoney(row.fees)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{formatMoney(row.uniforms)}</td>
                        <td className="px-2 py-2 text-right font-bold tabular-nums">{formatMoney(Number(row.fees) + Number(row.uniforms))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title={t('payments.feeList')} className="mb-6">
            {data.data.fees.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="text-muted">
                    {['date', 'kid', 'period', 'method', 'amount'].map((c) => <th key={c} scope="col" className="px-2 py-2">{t(`family.col.${c}`)}</th>)}
                  </tr></thead>
                  <tbody>
                    {data.data.fees.map((p) => {
                      const kid = kidById[p.student_id];
                      return (
                        <tr key={p.id} className="border-t border-line-soft">
                          <td className="px-2 py-2">{formatDate(p.paid_on)}</td>
                          <td className="px-2 py-2">
                            {kid ? <a href={`#/family/${kid.guardian_id}`} className="font-semibold text-brand underline">{kid.name}</a> : '—'}
                            {kid ? <span className="block text-[0.9rem] text-muted">{kid.guardian_name}</span> : null}
                          </td>
                          <td className="px-2 py-2">{t('pay.monthCount', { count: p.months, n: p.months })}<span className="block text-[0.9rem] text-muted">{t('payments.until', { date: formatDate(p.period_end) })}</span></td>
                          <td className="px-2 py-2">{t(`methods.${p.method}`)}{p.reference ? <span className="block text-[0.9rem] text-muted">{p.reference}</span> : null}</td>
                          <td className="px-2 py-2 font-semibold tabular-nums">{formatMoney(p.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted">{t('payments.none')}</p>}
          </Card>

          <Card title={t('payments.uniformList')}>
            {data.data.sales.length ? (
              <ul className="flex flex-col gap-1">
                {data.data.sales.map((s) => (
                  <li key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-line-soft py-2">
                    <span>{formatDate(s.sold_on)} · {s.buyer} · {t('uniforms.sizeQty', { size: s.size, n: s.quantity })} · {t(`methods.${s.method}`)}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(s.total)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted">{t('payments.none')}</p>}
          </Card>
        </>
      ) : null}
    </>
  );
}
