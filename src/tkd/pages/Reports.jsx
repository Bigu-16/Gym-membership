import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../lib/appContext';
import { useAsync } from '../lib/useAsync';
import { useI18n } from '../i18n/context';
import { Card, EmptyState, ErrorNote, Field, Loading, Meter, PageHeader, Select, Stat } from '../ui/kit';
import { RangePicker } from '../ui/RangePicker';
import { PRESETS } from '../lib/ranges';

/** Stacked present/absent bars per class day. Text summary + data table make it accessible. */
function DailyChart({ days }) {
  const { t, formatDate } = useI18n();
  const max = Math.max(1, ...days.map((d) => d.present + d.absent));
  const H = 160;
  const barW = Math.max(10, Math.min(36, Math.floor(640 / Math.max(days.length, 1)) - 6));
  const width = days.length * (barW + 6) + 8;
  return (
    <figure>
      <div className="overflow-x-auto">
        <svg width={Math.max(width, 280)} height={H + 28} role="img" aria-label={t('reports.chartLabel', { n: days.length })}>
          {days.map((d, i) => {
            const x = 4 + i * (barW + 6);
            const ph = (d.present / max) * H;
            const ah = (d.absent / max) * H;
            return (
              <g key={d.date}>
                <title>{`${formatDate(d.date)}: ${t('reports.presentN', { n: d.present })}, ${t('reports.absentN', { n: d.absent })}`}</title>
                <rect x={x} y={H - ph - ah} width={barW} height={ah} fill="var(--crit-bar)" rx="2" />
                <rect x={x} y={H - ph} width={barW} height={ph} fill="var(--ok-strong)" rx="2" />
                {days.length <= 16 ? (
                  <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize="12" fill="var(--muted)">{d.date.slice(8, 10)}</text>
                ) : null}
              </g>
            );
          })}
          <line x1="0" x2={Math.max(width, 280)} y1={H} y2={H} stroke="var(--line)" />
        </svg>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-4">
        <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-sm bg-ok-strong" aria-hidden="true" />{t('attendance.present')}</span>
        <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-sm bg-crit-bar" aria-hidden="true" />{t('attendance.absent')}</span>
      </figcaption>
      <details className="mt-3">
        <summary className="min-h-[32px] cursor-pointer font-semibold text-brand">{t('reports.showTable')}</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr className="text-muted"><th scope="col" className="py-1">{t('family.col.date')}</th><th scope="col" className="py-1 text-right">{t('attendance.present')}</th><th scope="col" className="py-1 text-right">{t('attendance.absent')}</th></tr></thead>
          <tbody>{days.map((d) => (
            <tr key={d.date} className="border-t border-line-soft"><td className="py-1">{formatDate(d.date, { withWeekday: true })}</td><td className="py-1 text-right">{d.present}</td><td className="py-1 text-right">{d.absent}</td></tr>
          ))}</tbody>
        </table>
      </details>
    </figure>
  );
}

const rateOf = (v) => (v.present + v.absent ? v.present / (v.present + v.absent) : null);

export default function Reports() {
  const { t, formatDate, formatPercent, formatSlot, weekday, formatNumber } = useI18n();
  const { activeSlots, slots, slotById, club } = useApp();
  const [range, setRange] = useState({ preset: 'last4w', ...PRESETS.last4w() });
  const [slotId, setSlotId] = useState('');
  const [sort, setSort] = useState('rate');
  const report = useAsync(() => api.attendanceReport({ start: range.start, end: range.end, slot_id: slotId || undefined }), [range.start, range.end, slotId, club?.id]);

  const r = report.data;
  const days = useMemo(() => {
    if (!r) return [];
    const map = {};
    for (const p of r.daily) {
      map[p.date] = map[p.date] || { date: p.date, present: 0, absent: 0 };
      map[p.date].present += p.present;
      map[p.date].absent += p.absent;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [r]);
  const students = useMemo(() => {
    if (!r) return [];
    const list = [...r.students];
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'streak') list.sort((a, b) => b.absent_streak - a.absent_streak || a.name.localeCompare(b.name));
    return list;
  }, [r, sort]);
  const worrying = r ? r.students.filter((s) => s.absent_streak >= 3) : [];

  return (
    <>
      <PageHeader title={t('reports.title')} subtitle={t('payments.subtitle', { from: formatDate(range.start), to: formatDate(range.end) })} />
      <RangePicker value={range} onChange={setRange} />
      <div className="mb-5 max-w-sm">
        <Field label={t('students.class')}>
          <Select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
            <option value="">{t('students.allClasses')}</option>
            {activeSlots.map((s) => <option key={s.id} value={s.id}>{formatSlot(s)}</option>)}
          </Select>
        </Field>
      </div>
      <ErrorNote error={report.error} onRetry={report.reload} />
      {report.loading && !r ? <Loading /> : null}
      {r && !r.class_days ? <EmptyState icon={CalendarCheck} title={t('reports.empty')} text={t('reports.emptyHint')} /> : null}
      {r && r.class_days ? (
        <>
          <section aria-label={t('reports.summary')} className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={CalendarCheck} label={t('reports.rate')} value={formatPercent(r.rate)} />
            <Stat icon={CheckCircle2} tone="ok" label={t('reports.presentMarks')} value={formatNumber(r.present)} />
            <Stat icon={XCircle} tone="crit" label={t('reports.absentMarks')} value={formatNumber(r.absent)} />
            <Stat icon={CalendarDays} label={t('reports.classDays')} value={formatNumber(r.class_days)} />
          </section>

          {worrying.length ? (
            <Card title={t('reports.missingTitle')} className="mb-6">
              <p className="mb-3 text-muted">{t('reports.missingHint')}</p>
              <ul className="flex flex-wrap gap-2">
                {worrying.map((s) => (
                  <li key={s.student_id} className="inline-flex items-center gap-2 rounded-lg border-2 border-crit-strong bg-crit-soft px-3 py-1 font-semibold text-crit">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    {s.name} · {t('reports.missedN', { count: s.absent_streak, n: s.absent_streak })}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card title={t('reports.perDay')} className="mb-6"><DailyChart days={days} /></Card>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card title={t('reports.byWeekday')}>
              <ul className="flex flex-col gap-2">
                {Object.entries(r.by_weekday).sort(([a], [b]) => a - b).map(([wd, v]) => (
                  <li key={wd} className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{weekday(Number(wd))}</span>
                    <Meter value={rateOf(v)} label={`${weekday(Number(wd))}: ${formatPercent(rateOf(v))}`} />
                  </li>
                ))}
              </ul>
            </Card>
            <Card title={t('reports.bySlot')}>
              <ul className="flex flex-col gap-2">
                {Object.entries(r.by_slot).map(([sid, v]) => (
                  <li key={sid} className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{formatSlot(slotById[sid] || slots.find((s) => String(s.id) === sid))}</span>
                    <Meter value={rateOf(v)} label={formatPercent(rateOf(v))} />
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title={t('reports.perKid')} action={(
            <label className="flex items-center gap-2">
              <span className="font-semibold">{t('reports.sortBy')}</span>
              <Select className="w-auto min-h-[44px]" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rate">{t('reports.sortRate')}</option>
                <option value="streak">{t('reports.sortStreak')}</option>
                <option value="name">{t('reports.sortName')}</option>
              </Select>
            </label>
          )}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-muted">
                  {['kid', 'rate', 'present', 'absent', 'streak', 'last'].map((c) => <th key={c} scope="col" className="px-2 py-2 font-semibold">{t(`reports.col.${c}`)}</th>)}
                </tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id} className="border-t border-line-soft">
                      <th scope="row" className="px-2 py-2 font-semibold">{s.name}</th>
                      <td className="px-2 py-2"><Meter value={s.rate} label={`${s.name}: ${formatPercent(s.rate)}`} /></td>
                      <td className="px-2 py-2 tabular-nums">{s.present}</td>
                      <td className="px-2 py-2 tabular-nums">{s.absent}</td>
                      <td className="px-2 py-2">{s.absent_streak >= 2 ? <span className="font-semibold text-crit">{t('reports.missedN', { count: s.absent_streak, n: s.absent_streak })}</span> : '—'}</td>
                      <td className="px-2 py-2">{formatDate(s.last_present)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </>
  );
}
