import { useState } from 'react';
import { AlertTriangle, CalendarCheck, CalendarX, CheckCircle2, Clock, Settings as SettingsIcon, Shirt, UserPlus, Users, Wallet, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { useI18n } from '../i18n/context';
import { Button, Card, EmptyState, ErrorNote, Loading, Notice, PageHeader, Stat, StatusBadge } from '../ui/kit';
import { RenewDialog, SlotText } from '../ui/shared';
import { METHODS, STATUS_ROW } from '../lib/constants';
import { navigate } from '../lib/router';
import clsx from 'clsx';

export default function Dashboard() {
  const { t, formatDate, formatMoney, formatPercent, formatNumber } = useI18n();
  const { slotById, club, isAdmin } = useApp();
  const { data, error, loading, reload } = useAsync(() => api.dashboard(), [club?.id]);
  const [paying, setPaying] = useState(null);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorNote error={error} onRetry={reload} />;

  const { counts, money_month: money } = data;
  const seasonText = data.season === 'summer' ? t('dashboard.summer') : t('dashboard.term');

  return (
    <>
      <PageHeader
        title={formatDate(data.today, { withWeekday: true })}
        subtitle={seasonText}
        actions={<Button icon={UserPlus} onClick={() => navigate('/enrol')}>{t('nav.enrol')}</Button>}
      />

      {isAdmin && data.setup_needed.length ? (
        <div className="mb-6">
          <Notice tone="warn" icon={SettingsIcon}>
            <p className="font-semibold">{t('dashboard.setupTitle')}</p>
            <ul className="mt-1 list-disc pl-5">
              {data.setup_needed.map((item) => <li key={item}>{t(`dashboard.setup.${item}`)}</li>)}
            </ul>
            <a href="#/settings" className="mt-2 inline-block font-semibold underline">{t('dashboard.openSettings')}</a>
          </Notice>
        </div>
      ) : null}

      <section aria-labelledby="today-heading" className="mb-6">
        <h2 id="today-heading" className="mb-3 text-lg font-bold text-ink">{t('dashboard.todaysClasses')}</h2>
        {data.today_slots.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.today_slots.map((s) => (
              <a key={s.slot_id} href={`#/attendance?slot=${s.slot_id}`}
                className="flex flex-col gap-2 rounded-xl border border-line-soft bg-white p-4 hover:border-brand">
                <SlotText slot={slotById[s.slot_id] || s} />
                <p className="text-2xl font-bold tabular-nums text-ink">
                  {s.saved ? t('dashboard.presentOf', { present: s.present, total: s.expected }) : t('dashboard.kidsCount', { count: s.expected, n: s.expected })}
                </p>
                <span className={clsx('inline-flex items-center gap-1.5 font-semibold', s.saved ? 'text-ok' : 'text-brand')}>
                  {s.saved ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <CalendarCheck className="h-5 w-5" aria-hidden="true" />}
                  {s.saved ? t('dashboard.attendanceTaken') : t('dashboard.takeAttendance')}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <Notice icon={CalendarX}>
            {t('dashboard.noClassToday', { date: formatDate(data.next_class_day, { withWeekday: true }) })}
          </Notice>
        )}
      </section>

      <section aria-label={t('dashboard.overview')} className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={Users} label={t('dashboard.activeKids')} value={formatNumber(counts.active)} hint={t('dashboard.paidUp', { n: counts.paid })} />
        <Stat icon={Clock} tone="warn" label={t('dashboard.endingSoon')} value={formatNumber(counts.expiring)} hint={t('dashboard.withinDays', { n: club.expiring_days })} />
        <Stat icon={XCircle} tone="crit" label={t('dashboard.expired')} value={formatNumber(counts.expired + counts.unpaid)} hint={counts.unpaid ? t('dashboard.neverPaid', { n: counts.unpaid }) : undefined} />
        <Stat icon={CalendarCheck} tone="ok" label={t('dashboard.attendance4w')} value={formatPercent(data.attendance_rate_4w)} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card
          title={t('dashboard.needsAttention')}
          action={<a href="#/students?status=critical,expiring,expired,unpaid" className="font-semibold text-brand underline">{t('common.seeAll')}</a>}
        >
          {data.attention.length ? (
            <ul className="flex flex-col gap-2">
              {data.attention.map((kid) => (
                <li key={kid.id} className={clsx('flex flex-wrap items-center gap-3 rounded-lg border border-line-soft bg-white p-3', STATUS_ROW[kid.status])}>
                  <div className="min-w-0 flex-1">
                    <a href={`#/family/${kid.guardian_id}`} className="font-semibold text-ink underline-offset-2 hover:underline">{kid.name}</a>
                    <p className="text-[0.95rem] text-muted">{kid.guardian_name} · <a className="underline" href={`tel:${kid.guardian_phone}`}>{kid.guardian_phone}</a></p>
                  </div>
                  <StatusBadge status={kid.status} daysLeft={kid.days_left} />
                  <Button size="sm" variant="secondary" icon={Wallet} onClick={() => setPaying(kid)}>{t('pay.pay')}</Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckCircle2} title={t('dashboard.allPaid')} />
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card title={t('dashboard.moneyThisMonth')} action={<a href="#/payments" className="font-semibold text-brand underline">{t('common.details')}</a>}>
            <p className="text-3xl font-bold tabular-nums text-ink">{formatMoney(money.total, money.currency)}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <div><dt className="text-muted">{t('payments.fees')}</dt><dd className="font-semibold tabular-nums">{formatMoney(money.fees)}</dd></div>
              <div><dt className="text-muted">{t('payments.uniforms')}</dt><dd className="font-semibold tabular-nums">{formatMoney(money.uniforms)}</dd></div>
            </dl>
            <ul className="mt-3 flex flex-col gap-1 border-t border-line-soft pt-3">
              {METHODS.map((m) => {
                const row = money.by_method[m];
                const total = row ? Number(row.fees) + Number(row.uniforms) : 0;
                return (
                  <li key={m} className="flex justify-between"><span>{t(`methods.${m}`)}</span><span className="font-semibold tabular-nums">{formatMoney(total)}</span></li>
                );
              })}
            </ul>
          </Card>

          <Card title={t('dashboard.uniformStock')} action={<a href="#/uniforms" className="font-semibold text-brand underline">{t('common.details')}</a>}>
            {data.low_stock.length ? (
              <>
                <p className="mb-2 flex items-center gap-2 font-semibold text-warn"><AlertTriangle className="h-5 w-5" aria-hidden="true" />{t('dashboard.lowStock')}</p>
                <ul className="flex flex-wrap gap-2">
                  {data.low_stock.map((s) => (
                    <li key={s.size_id} className="rounded-lg border border-warn-strong bg-warn-soft px-3 py-1 font-semibold text-warn">
                      {t('dashboard.sizeLeft', { size: s.label, n: s.in_stock })}{s.pending ? ` · ${t('dashboard.onTheWay', { n: s.pending })}` : ''}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="flex items-center gap-2 font-semibold text-ok"><Shirt className="h-5 w-5" aria-hidden="true" />{t('dashboard.stockOk')}</p>
            )}
          </Card>
        </div>
      </div>

      <RenewDialog open={Boolean(paying)} students={paying ? [paying] : []} onClose={() => setPaying(null)} onDone={reload} />
    </>
  );
}
